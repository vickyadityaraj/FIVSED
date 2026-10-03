import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { 
  eventStore, 
  recordIngestedEvent, 
  clearAllData, 
  getComputedDevices, 
  isAnyHardwareOnline 
} from '@/lib/server/event-store';
import { EventIngestionPayload, VerificationStatus } from '@/types/fivsed';

const VALID_API_KEY = process.env.DEVICE_API_KEY || 'fivsed_sec_key_77e9b812a4309c48';

// GET: Return current live monitoring state
export async function GET() {
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      const [devRes, verRes, evtRes, altRes] = await Promise.all([
        supabase.from('devices').select('*').order('device_id'),
        supabase.from('firmware_verifications').select('*').order('verified_at', { ascending: false }).limit(50),
        supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('alerts').select('*').order('created_at', { ascending: false })
      ]);

      const devices = devRes.data || [];
      const now = Date.now();
      const computedDevices = devices.map(d => {
        const isOnline = (now - new Date(d.last_seen).getTime()) < 45000;
        return {
          ...d,
          status: isOnline ? (d.status === 'WARNING' ? 'WARNING' : 'ONLINE') : 'OFFLINE'
        };
      });

      const latestVer = verRes.data && verRes.data.length > 0 ? verRes.data[0] : null;
      const isHardwareConnected = Boolean(
        (latestVer && (now - new Date(latestVer.verified_at).getTime()) < 45000) ||
        computedDevices.some(d => d.status === 'ONLINE' || d.status === 'WARNING')
      );

      return NextResponse.json({
        success: true,
        source: 'supabase',
        isHardwareConnected,
        devices: computedDevices,
        verifications: verRes.data || [],
        events: evtRes.data || [],
        alerts: altRes.data || []
      });
    } catch (err: unknown) {
      console.error('Supabase query error:', err);
    }
  }

  // Live dynamic event store with dynamic online status check
  const computedDevices = getComputedDevices();
  const isHardwareConnected = isAnyHardwareOnline();

  return NextResponse.json({
    success: true,
    source: 'runtime_store',
    isHardwareConnected,
    devices: computedDevices,
    verifications: eventStore.verifications,
    events: eventStore.events,
    alerts: eventStore.alerts
  });
}

// POST: Ingest event from ESP32 microcontroller
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const apiKeyHeader = req.headers.get('x-api-key') || req.headers.get('x-fivsed-api-key');
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const providedKey = apiKeyHeader || bearerToken;

    if (!providedKey || providedKey !== VALID_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: Invalid or missing device API key',
          code: 'AUTH_FAILED'
        },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    // Extract device_id from body or header (web_uploader.cpp sets X-FIVSED-Device-ID)
    const device_id = body.device_id || req.headers.get('x-fivsed-device-id') || 'FIVSED-001';
    const event = body.event || (body.result ? 'FIRMWARE_VERIFICATION' : undefined);
    
    // Map status from body.status OR body.result (STM32 sends result: MATCH | NEW_TARGET_REGISTERED | REFERENCE_UPDATED | HASH_MISMATCH)
    let rawStatus = body.status;
    if (!rawStatus && body.result) {
      if (body.result === 'MATCH' || body.result === 'NEW_TARGET_REGISTERED' || body.result === 'REFERENCE_UPDATED') {
        rawStatus = 'PASS';
      } else if (body.result === 'HASH_MISMATCH') {
        rawStatus = 'FAIL';
      } else {
        rawStatus = 'ERROR';
      }
    }

    const status = (rawStatus === 'ACTIVE' ? 'PASS' : (rawStatus || 'PASS')) as VerificationStatus;

    const {
      timestamp,
      severity,
      message
    } = body;

    const verification_id = body.verification_id ?? body.sequence ?? body.seq ?? (event === 'FIRMWARE_VERIFICATION' ? ((Date.now() % 90000) + 10000) : undefined);
    const current_hash = body.current_hash || body.hash || body.measured_hash || 'STM32_ONCHIP_PROTECTED';
    const reference_hash = body.reference_hash || body.golden_hash || body.reference || 'STM32_ONCHIP_PROTECTED';
    const verification_duration_ms = body.verification_duration_ms || body.duration_ms || body.duration || 390;

    // Capture STM32 HMAC from header if present
    const stm32Hmac = req.headers.get('x-fivsed-stm32-hmac') || body.stm32_hmac || body.hmac;
    const metadata = {
      ...(body.metadata || {}),
      ...(stm32Hmac ? { stm32_hmac: stm32Hmac } : {}),
      ...(body.result ? { result: body.result } : {}),
      ...(body.source ? { source: body.source } : {}),
      ...(body.esp32_active !== undefined ? { esp32_active: body.esp32_active } : {}),
      ...(body.stm32_active !== undefined ? { stm32_active: body.stm32_active } : {}),
      ...(body.raspberry_pi_active !== undefined ? { raspberry_pi_active: body.raspberry_pi_active } : {})
    };

    if (!device_id || !event) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: device_id and event are mandatory' 
        },
        { status: 422 }
      );
    }

    const eventTime = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    const isIntegrityEvent = event === 'FIRMWARE_VERIFICATION' || event === 'HASH_MISMATCH' || Boolean(body.result) || Boolean(verification_id);
    const isFailure = status === 'FAIL' || event === 'HASH_MISMATCH' || body.result === 'HASH_MISMATCH';

    // 3. Record in dynamic runtime store
    const storeResult = recordIngestedEvent({
      device_id,
      event,
      status,
      timestamp: eventTime,
      verification_id,
      current_hash,
      reference_hash,
      verification_duration_ms,
      severity,
      metadata,
      message
    });

    // 4. Record to Supabase if configured
    const supabase = getServerSupabase();
    if (supabase) {
      const stm32Active = metadata.stm32_active === true;
      const piActive = metadata.raspberry_pi_active === true;

      // Upsert ESP32 Node
      await supabase.from('devices').upsert({
        device_id: 'FIVSED-002',
        device_type: 'ESP32',
        device_name: 'ESP32 Wi-Fi Node (FIVSED-002)',
        role_title: 'Telemetry Uplink Node',
        role_description: 'Active ESP32 Wi-Fi telemetry uplink streaming firmware verification scan reports and heartbeats',
        status: isFailure ? 'WARNING' : 'ONLINE',
        communication_method: 'Wi-Fi / HTTPS REST API',
        last_seen: eventTime
      }, { onConflict: 'device_id' });

      // Upsert STM32 Security Authority
      await supabase.from('devices').upsert({
        device_id: 'FIVSED-001',
        device_type: 'STM32',
        device_name: 'STM32F407 Security Verifier (FIVSED-001)',
        role_title: 'Security Authority',
        role_description: 'Authoritative firmware integrity verifier. Measures target firmware, computes SHA-256 on-chip, and checks internal reference.',
        status: (stm32Active || isIntegrityEvent) ? (isFailure ? 'WARNING' : 'ONLINE') : 'OFFLINE',
        communication_method: 'Direct Hardware Bus / Dual UART',
        last_seen: (stm32Active || isIntegrityEvent) ? eventTime : new Date(0).toISOString()
      }, { onConflict: 'device_id' });

      // Upsert Raspberry Pi Main System
      await supabase.from('devices').upsert({
        device_id: 'FIVSED-003',
        device_type: 'RASPBERRY_PI',
        device_name: 'Raspberry Pi 3 Model B+ (FIVSED-003)',
        role_title: 'FIVSED Main System',
        role_description: 'Runs on-premise local operator interface and system supervisory telemetry.',
        status: piActive ? 'ONLINE' : 'OFFLINE',
        communication_method: 'Internal Bus / UART',
        last_seen: piActive ? eventTime : new Date(0).toISOString()
      }, { onConflict: 'device_id' });

      // Record scan report
      if (isIntegrityEvent && verification_id) {
        const { error: verErr } = await supabase.from('firmware_verifications').insert({
          verification_id,
          device_id,
          current_hash: current_hash || 'STM32_ONCHIP_PROTECTED',
          reference_hash: reference_hash || 'STM32_ONCHIP_PROTECTED',
          status,
          verification_result: isFailure ? 'HASH_MISMATCH' : 'INTEGRITY_PASS',
          verification_duration_ms: verification_duration_ms || 390,
          source: 'STM32',
          stm32_hmac: stm32Hmac || null,
          notes: body.result ? `STM32 Verdict: ${body.result}` : (message || null),
          verified_at: eventTime
        });
        if (verErr) console.error('Supabase verification insert error:', verErr);
      }

      // Record security event
      const calculatedSeverity = severity || (isFailure ? 'CRITICAL' : status === 'ERROR' ? 'HIGH' : 'INFO');
      const eventMessage = message || (
        isFailure 
          ? `Authoritative firmware integrity verification failed on target ${device_id} (Verification #${verification_id || 'N/A'}).`
          : event === 'COMPONENT_HEARTBEAT'
          ? `Liveness heartbeat recorded: ESP32=ACTIVE STM32=${stm32Active ? 'ACTIVE' : 'DISCONNECTED'} PI=${piActive ? 'ACTIVE' : 'NOT_DETECTED'}`
          : `Periodic firmware verification cycle completed on ${device_id}: Result=${status}`
      );

      await supabase.from('security_events').insert({
        device_id,
        event_type: event,
        status,
        severity: calculatedSeverity,
        message: eventMessage,
        verification_id: verification_id || null,
        metadata: metadata || {},
        source: 'ESP32',
        created_at: eventTime
      });

      // Record tampered alert
      if (isFailure) {
        await supabase.from('alerts').insert({
          device_id,
          event_type: 'HASH_MISMATCH',
          severity: 'CRITICAL',
          title: 'Firmware Integrity Failure Detected',
          description: `Firmware integrity verification failed because the measured hash did not match the trusted reference on ${device_id} (Verification #${verification_id || 'N/A'}).`,
          status: 'ACTIVE',
          verification_id: verification_id || null,
          created_at: eventTime
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event recorded successfully',
      device_id,
      event,
      status,
      timestamp: eventTime,
      verified_by_authority: 'STM32',
      uploaded_by_node: 'ESP32',
      verification_id: verification_id || null,
      alert_generated: isFailure
    });

  } catch (error: unknown) {
    console.error('API Error in /api/events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal Server Error' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const { alertId, action } = body;
    if (!alertId || !action) {
      return NextResponse.json({ success: false, error: 'alertId and action are required' }, { status: 400 });
    }

    const alert = eventStore.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = action === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' : 'RESOLVED';
      if (action === 'ACKNOWLEDGE') {
        alert.acknowledged_at = new Date().toISOString();
        alert.acknowledged_by = 'Operator (API)';
      }
    }

    const supabase = getServerSupabase();
    if (supabase) {
      await supabase
        .from('alerts')
        .update({
          status: action === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' : 'RESOLVED',
          acknowledged_at: action === 'ACKNOWLEDGE' ? new Date().toISOString() : undefined
        })
        .eq('id', alertId);
    }

    return NextResponse.json({ success: true, alertId, newStatus: alert?.status });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
  }
}

// DELETE: Completely wipe all scan records, alerts, events, and devices
export async function DELETE() {
  try {
    // 1. Wipe runtime in-memory store
    clearAllData();

    // 2. Wipe Supabase if configured
    const supabase = getServerSupabase();
    if (supabase) {
      await Promise.all([
        supabase.from('alerts').delete().neq('id', 'keep_none'),
        supabase.from('security_events').delete().neq('id', 'keep_none'),
        supabase.from('firmware_verifications').delete().neq('id', 'keep_none'),
        supabase.from('devices').delete().neq('id', 'keep_none')
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'All telemetry data, verification scan reports, and alerts cleared successfully'
    });
  } catch (err: unknown) {
    console.error('Error clearing data:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}

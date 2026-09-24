import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { 
  eventStore, 
  recordIngestedEvent, 
  clearAllData, 
  getComputedDevices, 
  isAnyHardwareOnline 
} from '@/lib/server/event-store';
import { EventIngestionPayload } from '@/types/fivsed';

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
    const apiKeyHeader = req.headers.get('x-api-key');
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
    let body: EventIngestionPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    const {
      device_id,
      event,
      status,
      timestamp,
      verification_id,
      current_hash,
      reference_hash,
      verification_duration_ms,
      severity,
      metadata,
      message
    } = body;

    if (!device_id || !event || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: device_id, event, status are mandatory' 
        },
        { status: 422 }
      );
    }

    const eventTime = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    const isIntegrityEvent = event === 'FIRMWARE_VERIFICATION' || event === 'HASH_MISMATCH' || Boolean(verification_id);
    const isFailure = status === 'FAIL' || event === 'HASH_MISMATCH';

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
      // Upsert device accurately as the ESP32 node
      const { error: devErr } = await supabase.from('devices').upsert({
        device_id,
        device_type: 'ESP32',
        device_name: `ESP32 Wi-Fi Node (${device_id})`,
        role_title: 'Telemetry Uplink Node',
        role_description: 'Active ESP32 Wi-Fi telemetry uplink streaming firmware verification scan reports',
        status: isFailure ? 'WARNING' : 'ONLINE',
        communication_method: 'Wi-Fi / HTTPS REST API',
        last_seen: eventTime
      }, { onConflict: 'device_id' });
      if (devErr) console.error('Supabase device upsert error:', devErr);

      // Record scan report
      if (isIntegrityEvent && verification_id) {
        const { error: verErr } = await supabase.from('firmware_verifications').insert({
          verification_id,
          device_id,
          current_hash: current_hash || 'UNKNOWN_DIGEST',
          reference_hash: reference_hash || 'UNKNOWN_DIGEST',
          status,
          verification_result: isFailure ? 'HASH_MISMATCH' : 'INTEGRITY_PASS',
          verification_duration_ms: verification_duration_ms || 390,
          source: 'STM32',
          verified_at: eventTime
        });
        if (verErr) console.error('Supabase verification insert error:', verErr);
      }

      // Record security event
      const calculatedSeverity = severity || (isFailure ? 'CRITICAL' : status === 'ERROR' ? 'HIGH' : 'INFO');
      const eventMessage = message || (
        isFailure 
          ? `Firmware integrity verification failed because the measured hash did not match the trusted reference on ${device_id} (Verification #${verification_id || 'N/A'}).`
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

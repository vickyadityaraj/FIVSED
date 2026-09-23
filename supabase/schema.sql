-- ============================================================================
-- FIVSED: Firmware Integrity Verification and Security Event Detection
-- Database Schema for Supabase PostgreSQL
-- 
-- ARCHITECTURE RULE:
-- STM32 = Security Authority (Firmware measurement, SHA-256, PASS/FAIL decision)
-- ESP32 = Controller & Web Uploader (Receives STM32 decision, controls LED/buzzer, uploads via Wi-Fi)
-- Raspberry Pi = FIVSED Main System (Local GUI, local logs, direct STM32 link)
-- Web App = Remote Monitoring & SOC Dashboard
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'security_operator', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: Automatically create public.profiles record when a user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('STM32', 'ESP32', 'RASPBERRY_PI')),
    device_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    role_description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ONLINE', 'OFFLINE', 'WARNING', 'ERROR')) DEFAULT 'ONLINE',
    ip_address TEXT,
    mac_address TEXT,
    firmware_version TEXT,
    hardware_version TEXT,
    communication_method TEXT NOT NULL,
    verification_interval_minutes INT DEFAULT 10,
    api_key_hash TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Firmware Verifications Table (Authoritative results from STM32)
CREATE TABLE IF NOT EXISTS public.firmware_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id BIGINT NOT NULL,
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    current_hash TEXT NOT NULL,
    reference_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'ERROR', 'VERIFYING')),
    verification_result TEXT NOT NULL CHECK (verification_result IN ('INTEGRITY_PASS', 'HASH_MISMATCH', 'VERIFICATION_ERROR', 'TIMEOUT')),
    verification_duration_ms INT NOT NULL DEFAULT 420,
    source TEXT NOT NULL DEFAULT 'STM32',
    notes TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Security Events Table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    verification_id BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    source TEXT NOT NULL DEFAULT 'ESP32',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')) DEFAULT 'ACTIVE',
    verification_id BIGINT,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Device Heartbeats Table
CREATE TABLE IF NOT EXISTS public.device_heartbeats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_firmware_verifications_device_id ON public.firmware_verifications(device_id);
CREATE INDEX IF NOT EXISTS idx_firmware_verifications_verified_at ON public.firmware_verifications(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);

-- Trigger: Automatically generate alert on verification failure or hash mismatch
CREATE OR REPLACE FUNCTION public.handle_verification_failure_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'FAIL' OR NEW.verification_result = 'HASH_MISMATCH' THEN
        INSERT INTO public.alerts (
            device_id,
            event_type,
            severity,
            title,
            description,
            status,
            verification_id,
            created_at
        ) VALUES (
            NEW.device_id,
            'HASH_MISMATCH',
            'CRITICAL',
            'Firmware Integrity Failure Detected',
            'Firmware integrity verification failed because the measured hash did not match the trusted reference on ' || NEW.device_id || ' (Verification #' || NEW.verification_id || ').',
            'ACTIVE',
            NEW.verification_id,
            NEW.verified_at
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_verification_failure ON public.firmware_verifications;
CREATE TRIGGER trigger_verification_failure
    AFTER INSERT ON public.firmware_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_verification_failure_alert();

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firmware_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_heartbeats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can view monitoring data
CREATE POLICY "Authenticated users can view profiles" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view devices" 
    ON public.devices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view verifications" 
    ON public.firmware_verifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view events" 
    ON public.security_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view alerts" 
    ON public.alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view heartbeats" 
    ON public.device_heartbeats FOR SELECT TO authenticated USING (true);

-- Operators and Admins can update alerts (e.g. acknowledge)
CREATE POLICY "Operators and admins can update alerts" 
    ON public.alerts FOR UPDATE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role IN ('admin', 'security_operator')
    ));

-- Admins can manage devices
CREATE POLICY "Admins can manage devices" 
    ON public.devices FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- Service role bypasses RLS for ingestion API (Next.js server-side)
-- Done automatically by Supabase with service_role secret key

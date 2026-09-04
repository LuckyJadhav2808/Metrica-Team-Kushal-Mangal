-- Metrica SIH 2026: Supabase Realtime Database Schema
-- Run this in your Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/aqxawwgoyedebfrvflzu/sql)

-- 1. Create Instruments Table
CREATE TABLE IF NOT EXISTS public.instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_instrument_id TEXT UNIQUE NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    model_name TEXT NOT NULL,
    category TEXT DEFAULT 'ELECTRONIC_COUNTER_SCALE',
    accuracy_class TEXT DEFAULT 'CLASS_III',
    nominal_unit TEXT DEFAULT 'KG',
    max_capacity NUMERIC DEFAULT 30.0,
    min_capacity NUMERIC DEFAULT 0.1,
    verification_interval NUMERIC DEFAULT 0.005,
    manufacturer_name TEXT DEFAULT 'Apex Metrology Ltd',
    owner_id TEXT,
    owner_name TEXT,
    owner_address TEXT,
    pincode TEXT DEFAULT '110001',
    jurisdiction_circle TEXT DEFAULT 'Delhi North District Circle',
    status TEXT DEFAULT 'REGISTERED_PENDING_VERIFICATION',
    risk_score INT DEFAULT 10,
    trust_score INT DEFAULT 90,
    priority_flag TEXT DEFAULT 'LOW',
    last_verified_at TEXT,
    valid_until TEXT,
    current_seal_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Verification Applications Table
CREATE TABLE IF NOT EXISTS public.verification_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    instrument_id UUID REFERENCES public.instruments(id) ON DELETE CASCADE,
    instrument_serial TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_phone TEXT DEFAULT '+91 98000 00000',
    type TEXT DEFAULT 'INITIAL_VERIFICATION',
    readiness_score INT DEFAULT 85,
    fee_amount NUMERIC DEFAULT 150.0,
    payment_ref_number TEXT,
    payment_status TEXT DEFAULT 'PAID',
    assigned_officer_id TEXT,
    assigned_officer_name TEXT,
    scheduled_date TEXT,
    scheduled_slot TEXT,
    status TEXT DEFAULT 'PENDING_ASSIGNMENT',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Verifications Table
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.verification_applications(id) ON DELETE CASCADE,
    instrument_id UUID REFERENCES public.instruments(id) ON DELETE CASCADE,
    officer_id TEXT NOT NULL,
    officer_name TEXT NOT NULL,
    inspection_date TIMESTAMPTZ DEFAULT now(),
    result TEXT NOT NULL, -- PASS or FAIL
    applied_seal_number TEXT,
    ocr_serial_matched BOOLEAN DEFAULT false,
    mpe_tolerance_passed BOOLEAN DEFAULT false,
    observations_json JSONB DEFAULT '[]'::jsonb,
    summary_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    instrument_id UUID REFERENCES public.instruments(id) ON DELETE CASCADE,
    digital_instrument_id TEXT NOT NULL,
    verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
    issue_date TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE_VALID',
    physical_seal_number TEXT NOT NULL,
    digital_signature_hash TEXT NOT NULL,
    signed_by_officer_name TEXT NOT NULL,
    qr_payload_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number TEXT UNIQUE NOT NULL,
    instrument_id UUID REFERENCES public.instruments(id) ON DELETE SET NULL,
    digital_instrument_id TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    complainant_phone TEXT,
    severity TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'LOGGED',
    impact_on_risk_score INT DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL
);

-- 7. Enable Row Level Security (RLS) & Allow Anonymous Demo Access
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for instruments" ON public.instruments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for applications" ON public.verification_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for verifications" ON public.verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for certificates" ON public.certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 8. Enable Supabase Realtime on Critical Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.instruments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- 9. Seed Initial Core Instruments
INSERT INTO public.instruments (
    digital_instrument_id, serial_number, model_name, category, accuracy_class, 
    nominal_unit, max_capacity, min_capacity, verification_interval, manufacturer_name,
    owner_name, owner_address, jurisdiction_circle, status, risk_score, trust_score, priority_flag,
    last_verified_at, valid_until
) VALUES 
(
    'IND-MET-2026-X8829', 'SN-8829-X', 'Precision Commercial Bench Scale', 'ELECTRONIC_COUNTER_SCALE', 'CLASS_III',
    'KG', 30.0, 0.1, 0.005, 'Apex Metrology Ltd',
    'Green Valley Groceries', 'Shop 14, APMC Market Yard', 'Delhi North District Circle', 'VERIFIED_ACTIVE', 5, 98, 'LOW',
    '2025-11-15', '2026-11-14'
),
(
    'IND-MET-2026-P4412', 'SN-APX-4412', 'Apex Platform Heavy Weighing Scale', 'PLATFORM_SCALE', 'CLASS_III',
    'KG', 150.0, 0.5, 0.02, 'Apex Metrology Ltd',
    'Green Valley Groceries', 'Shop 14, APMC Market Yard', 'Delhi North District Circle', 'REGISTERED_PENDING_VERIFICATION', 20, 80, 'MEDIUM',
    NULL, NULL
),
(
    'IND-MET-2026-B1090', 'SN-APX-1090', 'Commercial Mandi Bulk Balance', 'ELECTRONIC_COUNTER_SCALE', 'CLASS_III',
    'KG', 50.0, 0.2, 0.01, 'Apex Metrology Ltd',
    'Green Valley Groceries', 'Shop 14, APMC Market Yard', 'Delhi North District Circle', 'EXPIRING_SOON', 65, 60, 'HIGH',
    '2024-10-01', '2025-10-01'
)
ON CONFLICT (digital_instrument_id) DO NOTHING;

-- 10. Seed Initial Application for P4412
DO $$
DECLARE
    v_inst_id UUID;
BEGIN
    SELECT id INTO v_inst_id FROM public.instruments WHERE digital_instrument_id = 'IND-MET-2026-P4412';
    IF v_inst_id IS NOT NULL THEN
        INSERT INTO public.verification_applications (
            application_number, instrument_id, instrument_serial, applicant_name, applicant_phone,
            type, readiness_score, fee_amount, payment_ref_number, payment_status,
            assigned_officer_name, scheduled_date, scheduled_slot, status
        ) VALUES (
            'APP-2026-90412', v_inst_id, 'SN-APX-4412', 'Green Valley Groceries (Ramesh Patel)', '+91 98201 55667',
            'INITIAL_VERIFICATION', 85, 150.0, 'CHALLAN-BHARATKOSH-8821', 'PAID',
            'Rajesh Kumar (LMO Grade-I)', '2026-09-10', '10:00 AM - 01:00 PM', 'SCHEDULED'
        )
        ON CONFLICT (application_number) DO NOTHING;
    END IF;
END $$;

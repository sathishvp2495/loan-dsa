CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('ADMIN', 'AGENT', 'OPERATIONS');
CREATE TYPE loan_type AS ENUM ('PERSONAL', 'HOME', 'BUSINESS', 'MORTGAGE', 'CAR', 'EDUCATION', 'GOLD');
CREATE TYPE employment_type AS ENUM ('SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'OTHER');
CREATE TYPE lead_source AS ENUM ('WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'GOOGLE', 'REFERRAL', 'MANUAL');
CREATE TYPE lead_stage AS ENUM (
  'NEW_LEAD',
  'CONTACT_ATTEMPTED',
  'CONTACTED',
  'QUALIFIED',
  'DOCS_PENDING',
  'BANK_SUBMITTED',
  'SANCTIONED',
  'DISBURSED',
  'REJECTED',
  'CLOSED'
);
CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE message_channel AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'AGENT',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_phone TEXT,
  city TEXT NOT NULL,
  loan_type loan_type NOT NULL,
  employment_type employment_type NOT NULL,
  monthly_income INTEGER NOT NULL,
  requested_amount INTEGER NOT NULL,
  source lead_source NOT NULL DEFAULT 'WEBSITE',
  stage lead_stage NOT NULL DEFAULT 'NEW_LEAD',
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  system_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_stage lead_stage,
  next_stage lead_stage NOT NULL,
  changed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  lender_name TEXT NOT NULL,
  disbursed_amount INTEGER NOT NULL,
  payout_percent NUMERIC(6,2) NOT NULL,
  total_commission NUMERIC(12,2) NOT NULL,
  partner_share_percent NUMERIC(6,2) NOT NULL,
  partner_share_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction message_direction NOT NULL,
  channel message_channel NOT NULL DEFAULT 'WHATSAPP',
  provider_message_id TEXT,
  template_name TEXT,
  body TEXT,
  status TEXT,
  from_identity TEXT,
  to_identity TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_whatsapp_phone ON leads(whatsapp_phone);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX idx_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_customer_messages_lead_id ON customer_messages(lead_id);

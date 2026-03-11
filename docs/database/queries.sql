-- Create a new lead
INSERT INTO leads (
  reference_code,
  full_name,
  phone,
  whatsapp_phone,
  city,
  loan_type,
  employment_type,
  monthly_income,
  requested_amount,
  source,
  whatsapp_opt_in
) VALUES (
  'LD-2026-0001',
  'Rahul Sharma',
  '+919876543210',
  '+919876543210',
  'Bengaluru',
  'PERSONAL',
  'SALARIED',
  85000,
  600000,
  'WEBSITE',
  TRUE
);

-- Move the lead to CONTACTED
UPDATE leads
SET stage = 'CONTACTED',
    updated_at = NOW(),
    last_contacted_at = NOW()
WHERE reference_code = 'LD-2026-0001';

INSERT INTO lead_status_history (
  lead_id,
  previous_stage,
  next_stage,
  reason
)
SELECT id, 'NEW_LEAD', 'CONTACTED', 'Agent connected with borrower'
FROM leads
WHERE reference_code = 'LD-2026-0001';

-- Add a note
INSERT INTO lead_notes (lead_id, body)
SELECT id, 'Borrower confirmed salary and PAN availability over phone'
FROM leads
WHERE reference_code = 'LD-2026-0001';

-- Assign agent
UPDATE leads
SET assigned_agent_id = (
  SELECT id FROM users WHERE email = 'agent@loandsa.local'
)
WHERE reference_code = 'LD-2026-0001';

-- Record commission after disbursement
INSERT INTO commissions (
  lead_id,
  lender_name,
  disbursed_amount,
  payout_percent,
  total_commission,
  partner_share_percent,
  partner_share_amount
)
SELECT
  id,
  'HDFC Bank',
  550000,
  2.25,
  12375.00,
  40.00,
  4950.00
FROM leads
WHERE reference_code = 'LD-2026-0001';

-- Funnel query
SELECT stage, COUNT(*) AS count
FROM leads
GROUP BY stage
ORDER BY stage;

-- Lead detail snapshot
SELECT
  l.reference_code,
  l.full_name,
  l.phone,
  l.city,
  l.loan_type,
  l.stage,
  u.full_name AS assigned_agent
FROM leads l
LEFT JOIN users u ON u.id = l.assigned_agent_id
ORDER BY l.created_at DESC;

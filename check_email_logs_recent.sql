-- Check recent email logs
SELECT 
  id,
  registrant_id,
  payment_id,
  emails_sent,
  emails_failed,
  recipients,
  sent_at,
  created_at
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Also check recent registrants
SELECT 
  id,
  team_name,
  payment_status,
  paid_amount,
  razorpay_payment_id,
  payment_time,
  created_at
FROM registrants 
WHERE payment_status = 'paid'
ORDER BY payment_time DESC 
LIMIT 5;

-- Script to check payment data and potentially missing payment records

-- Check all paid registrants
SELECT 
  r.id as registrant_id,
  r.event_id,
  e.name as event_name,
  r.team_name,
  r.payment_status,
  r.razorpay_order_id,
  r.razorpay_payment_id,
  r.paid_amount,
  r.payment_time,
  r.created_at
FROM registrants r
JOIN events e ON r.event_id = e.id
WHERE r.payment_status = 'paid'
ORDER BY r.payment_time DESC;

-- Check payments table
SELECT 
  p.id,
  p.registrant_id,
  p.razorpay_order_id,
  p.razorpay_payment_id,
  p.paid_amount,
  p.payment_status,
  p.payment_time,
  p.created_at
FROM payments p
ORDER BY p.payment_time DESC;

-- Check for registrants with paid status but no corresponding payment record
SELECT 
  r.id as registrant_id,
  r.event_id,
  e.name as event_name,
  r.team_name,
  r.payment_status,
  r.razorpay_order_id,
  r.razorpay_payment_id,
  r.paid_amount,
  r.payment_time
FROM registrants r
JOIN events e ON r.event_id = e.id
LEFT JOIN payments p ON p.registrant_id = r.id
WHERE r.payment_status = 'paid' 
  AND p.id IS NULL;

-- Count summary
SELECT 
  'Paid Registrants' as type,
  COUNT(*) as count
FROM registrants 
WHERE payment_status = 'paid'
UNION ALL
SELECT 
  'Payment Records' as type,
  COUNT(*) as count
FROM payments
UNION ALL
SELECT 
  'Missing Payment Records' as type,
  COUNT(*) as count
FROM registrants r
LEFT JOIN payments p ON p.registrant_id = r.id
WHERE r.payment_status = 'paid' 
  AND p.id IS NULL;

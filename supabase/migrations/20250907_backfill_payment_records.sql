-- Migration to backfill payment records for existing paid registrants
-- This should be run once to populate the payments table with existing payment data

-- Insert payment records for all paid registrants that don't have payment records yet
INSERT INTO payments (
  registrant_id,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  paid_amount,
  payment_status,
  payment_method,
  payment_time,
  created_at,
  updated_at
)
SELECT 
  r.id,
  r.razorpay_order_id,
  r.razorpay_payment_id,
  r.razorpay_signature,
  COALESCE(r.paid_amount, e.price) as paid_amount, -- Use paid_amount if available, fallback to event price
  'paid',
  'razorpay',
  COALESCE(r.payment_time, r.updated_at) as payment_time, -- Use payment_time if available, fallback to updated_at
  r.created_at,
  r.updated_at
FROM registrants r
JOIN events e ON r.event_id = e.id
LEFT JOIN payments p ON p.registrant_id = r.id
WHERE r.payment_status = 'paid' 
  AND p.id IS NULL  -- Only insert if payment record doesn't exist
  AND r.razorpay_payment_id IS NOT NULL; -- Only if we have payment ID

-- Update any missing paid_amount in registrants table
UPDATE registrants 
SET paid_amount = events.price
FROM events 
WHERE registrants.event_id = events.id 
  AND registrants.payment_status = 'paid' 
  AND (registrants.paid_amount IS NULL OR registrants.paid_amount = 0);

-- Verify the results
SELECT 
  'After Migration - Paid Registrants' as type,
  COUNT(*) as count
FROM registrants 
WHERE payment_status = 'paid'
UNION ALL
SELECT 
  'After Migration - Payment Records' as type,
  COUNT(*) as count
FROM payments
UNION ALL
SELECT 
  'After Migration - Still Missing Payment Records' as type,
  COUNT(*) as count
FROM registrants r
LEFT JOIN payments p ON p.registrant_id = r.id
WHERE r.payment_status = 'paid' 
  AND p.id IS NULL;

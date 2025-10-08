-- Test script for email trigger system
-- Run this in Supabase SQL Editor to test the automatic email triggering

-- Step 1: Check current email trigger logs
SELECT 
  COUNT(*) as total_triggers,
  SUM(CASE WHEN email_sent THEN 1 ELSE 0 END) as emails_sent,
  SUM(CASE WHEN email_sent = false THEN 1 ELSE 0 END) as pending
FROM email_trigger_log;

-- Step 2: Find a test registrant with pending payment
SELECT 
  r.id,
  r.team_name,
  r.payment_status,
  u.email,
  u.name,
  e.name as event_name
FROM registrants r
JOIN users u ON u.id = r.user_id
JOIN events e ON e.id = r.event_id
WHERE r.payment_status = 'pending'
LIMIT 5;

-- Step 3: Manually update a test registrant's payment status
-- REPLACE 123 with actual registrant ID from Step 2
/*
UPDATE registrants 
SET 
  payment_status = 'paid',
  payment_time = NOW(),
  razorpay_payment_id = 'test_manual_' || gen_random_uuid()::text
WHERE id = 123;
*/

-- Step 4: Verify the trigger created a log entry
SELECT 
  etl.*,
  r.team_name,
  u.email,
  u.name
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
ORDER BY etl.created_at DESC
LIMIT 10;

-- Step 5: Check for pending emails that need to be sent
SELECT 
  etl.id as log_id,
  etl.registrant_id,
  etl.trigger_type,
  etl.old_status,
  etl.new_status,
  etl.email_sent,
  etl.error_message,
  r.team_name,
  u.email as user_email,
  u.name as user_name,
  e.name as event_name
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
JOIN events e ON e.id = r.event_id
WHERE etl.email_sent = false
ORDER BY etl.created_at ASC;

-- Step 6: After running /api/process-email-triggers, check if emails were sent
SELECT 
  etl.*,
  r.team_name,
  u.email
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
WHERE etl.email_sent = true
ORDER BY etl.created_at DESC
LIMIT 10;

-- Step 7: Check for any errors
SELECT 
  etl.*,
  r.team_name,
  u.email
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
WHERE etl.error_message IS NOT NULL
ORDER BY etl.created_at DESC
LIMIT 10;

-- Cleanup test data (optional)
-- DELETE FROM email_trigger_log WHERE trigger_type = 'payment_status_update' AND created_at > NOW() - INTERVAL '1 hour';

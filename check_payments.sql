-- Check if emails are being sent and logged properly
-- Run this in Supabase SQL Editor to see email sending status

-- 1. Check recent email logs
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
ORDER BY sent_at DESC 
LIMIT 10;

-- 2. Check the specific registrant that just paid
SELECT 
    r.id as registrant_id,
    r.team_name,
    r.razorpay_payment_id,
    r.payment_status,
    COUNT(reg.id) as team_members,
    ARRAY_AGG(reg.email) as member_emails
FROM registrants r
LEFT JOIN registrations reg ON r.id = reg.leader_id
WHERE r.razorpay_payment_id = 'pay_REhdRUvOPAvwCx'
GROUP BY r.id, r.team_name, r.razorpay_payment_id, r.payment_status;

-- 3. Check if there are any email logs for this payment
SELECT 
    el.*,
    r.team_name,
    r.razorpay_payment_id
FROM email_logs el
JOIN registrants r ON el.registrant_id = r.id
WHERE r.razorpay_payment_id = 'pay_REhdRUvOPAvwCx';

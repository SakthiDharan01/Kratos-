-- Check the latest payment and email logs
-- Run this to see if the recent payment triggered email sending

-- 1. Check the most recent payment
SELECT 
    r.id as registrant_id,
    r.team_name,
    r.razorpay_payment_id,
    r.payment_status,
    COUNT(reg.id) as team_members,
    ARRAY_AGG(reg.email) as member_emails
FROM registrants r
LEFT JOIN registrations reg ON r.id = reg.leader_id
WHERE r.razorpay_payment_id = 'pay_REio2iYUH8ajy2'
GROUP BY r.id, r.team_name, r.razorpay_payment_id, r.payment_status;

-- 2. Check if email logs were created for this payment
SELECT 
    el.*,
    r.team_name,
    r.razorpay_payment_id
FROM email_logs el
JOIN registrants r ON el.registrant_id = r.id
WHERE r.razorpay_payment_id = 'pay_REio2iYUH8ajy2';

-- 3. Check ALL recent email logs to see if any emails have been sent
SELECT 
    id,
    registrant_id,
    payment_id,
    emails_sent,
    emails_failed,
    recipients,
    sent_at
FROM email_logs 
ORDER BY sent_at DESC 
LIMIT 5;

-- Check if ANY emails have ever been logged
SELECT COUNT(*) as total_email_logs FROM email_logs;

-- If there are any, show the most recent ones
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

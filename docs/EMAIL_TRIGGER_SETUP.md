# Automatic Email Triggering on Payment Status Update

This document explains the automatic email confirmation system when payment status changes from "pending" to "paid".

## Overview

When an admin manually updates a registrant's payment status from "pending" to "paid" in Supabase, the system automatically triggers a confirmation email to be sent to the user.

## Architecture

### 1. Database Trigger (Recommended Approach)
- **Trigger**: `trigger_log_payment_status_change` on `registrants` table
- **Function**: `log_payment_status_change()`
- **What it does**: Logs payment status changes to `email_trigger_log` table
- **When**: Fires on UPDATE of `payment_status` column when status changes to 'paid'

### 2. Processing Queue
- **Endpoint**: `/api/process-email-triggers`
- **Purpose**: Processes pending email triggers and sends emails
- **Execution**: Can be triggered manually, via cron job, or via webhooks

## Setup Instructions

### Step 1: Run Database Migrations

Run these migrations in your Supabase SQL Editor:

1. **Email Trigger Logging** (required):
```bash
# File: supabase/migrations/20251008_add_email_trigger_logging.sql
```

This creates:
- `email_trigger_log` table to track email sending attempts
- `log_payment_status_change()` function to log status changes
- Database trigger to automatically log changes

2. **Optional: Direct HTTP Trigger** (if using pg_net):
```bash
# File: supabase/migrations/20251008_add_payment_status_email_trigger.sql
```

**Note**: This requires `pg_net` extension enabled in Supabase.

### Step 2: Add Environment Variable

Add to your `.env` file:

```env
# Cron job secret for scheduled email processing
CRON_SECRET=your-random-secret-here-change-this
```

Generate a secure secret:
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 3: Choose Email Processing Method

You have 3 options:

#### Option A: Manual Processing (Immediate)
Best for: Low volume, manual admin updates

After updating payment status in Supabase, call:
```bash
POST https://kratos-nu.vercel.app/api/process-email-triggers
Headers:
  x-cron-secret: your-secret-here
```

#### Option B: Scheduled Processing (Recommended)
Best for: Regular automated processing

**Using Vercel Cron:**

1. Create `vercel.json` in project root:
```json
{
  "crons": [{
    "path": "/api/process-email-triggers",
    "schedule": "*/5 * * * *"
  }]
}
```

2. Deploy to Vercel
3. Configure environment variable `CRON_SECRET` in Vercel dashboard

**Using GitHub Actions:**

1. Create `.github/workflows/process-emails.yml`:
```yaml
name: Process Email Triggers
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Email Processing
        run: |
          curl -X POST https://kratos-nu.vercel.app/api/process-email-triggers \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

2. Add `CRON_SECRET` to GitHub Secrets

#### Option C: Supabase Database Webhooks
Best for: Instant processing

1. In Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - **Table**: `email_trigger_log`
   - **Events**: INSERT
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://kratos-nu.vercel.app/api/process-email-triggers`
   - **Headers**: 
     ```
     x-cron-secret: your-secret-here
     Content-Type: application/json
     ```

## How It Works

### Workflow Diagram

```
1. Admin updates payment_status → 'paid'
   ↓
2. Database trigger fires
   ↓
3. log_payment_status_change() creates record in email_trigger_log
   ↓
4. Email processor (cron/webhook) detects pending trigger
   ↓
5. Calls /api/send-confirmation-email
   ↓
6. Email sent → Updates email_trigger_log.email_sent = true
```

### Database Tables

**email_trigger_log**
```sql
id               SERIAL PRIMARY KEY
registrant_id    INTEGER (FK to registrants)
trigger_type     VARCHAR(50)  -- 'payment_status_update', 'webhook', 'manual'
old_status       VARCHAR(20)  -- e.g., 'pending'
new_status       VARCHAR(20)  -- e.g., 'paid'
triggered_at     TIMESTAMPTZ
email_sent       BOOLEAN      -- false until processed
error_message    TEXT         -- NULL if successful
created_at       TIMESTAMPTZ
```

## Testing

### Test Manual Payment Update

1. In Supabase, update a registrant:
```sql
UPDATE registrants 
SET payment_status = 'paid',
    payment_time = NOW()
WHERE id = 123;
```

2. Check the log:
```sql
SELECT * FROM email_trigger_log 
WHERE registrant_id = 123 
ORDER BY created_at DESC 
LIMIT 1;
```

3. Process emails manually:
```bash
curl -X POST http://localhost:3000/api/process-email-triggers \
  -H "x-cron-secret: your-secret-here" \
  -H "Content-Type: application/json"
```

4. Verify email was sent:
```sql
SELECT * FROM email_trigger_log 
WHERE registrant_id = 123 AND email_sent = true;
```

### Check Pending Email Count

```bash
GET https://kratos-nu.vercel.app/api/process-email-triggers
```

Returns:
```json
{
  "pendingCount": 5,
  "message": "5 pending email triggers"
}
```

## Monitoring

### View Email Trigger Logs (Admin Only)

Query in Supabase:
```sql
-- Recent triggers
SELECT 
  etl.*,
  r.team_name,
  u.email,
  u.name
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
ORDER BY etl.created_at DESC
LIMIT 50;

-- Failed email attempts
SELECT * FROM email_trigger_log 
WHERE email_sent = false 
AND error_message IS NOT NULL
ORDER BY created_at DESC;

-- Success rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN email_sent THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) as failed
FROM email_trigger_log;
```

## Troubleshooting

### Emails Not Sending

1. **Check if trigger is logging**:
```sql
SELECT * FROM email_trigger_log ORDER BY created_at DESC LIMIT 10;
```

2. **Check for errors**:
```sql
SELECT * FROM email_trigger_log WHERE error_message IS NOT NULL;
```

3. **Verify email service is working**:
```bash
# Test email API directly
curl -X POST http://localhost:3000/api/send-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{"registrantId": 123, "paymentId": "pay_xxx"}'
```

4. **Check SMTP settings** in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=updates.kratos@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=updates.kratos@gmail.com
```

### Email Processing Not Running

1. **Manual trigger**:
```bash
curl -X POST https://kratos-nu.vercel.app/api/process-email-triggers \
  -H "x-cron-secret: your-secret" \
  -H "Content-Type: application/json"
```

2. **Check cron job logs** (Vercel Dashboard → Deployments → Logs)

3. **Verify webhook** (Supabase Dashboard → Database → Webhooks → Logs)

## Security

- Email trigger processing requires `CRON_SECRET` or admin authentication
- RLS policies protect `email_trigger_log` table (admin access only)
- Email sending uses server-side role key (not exposed to client)
- Idempotency: Checks `email_logs` table to prevent duplicate emails

## Performance

- Processes max 50 triggers per execution (prevents timeout)
- Async email sending (doesn't block transactions)
- Indexed queries for fast lookups
- Automatic retry via cron schedule

## Next Steps

1. ✅ Run database migrations
2. ✅ Add `CRON_SECRET` to environment
3. ✅ Choose processing method (cron/webhook)
4. ✅ Test with sample payment update
5. ✅ Monitor email_trigger_log table
6. ✅ Deploy to production

## API Endpoints

### POST /api/process-email-triggers
Process pending email triggers and send emails.

**Headers**:
- `x-cron-secret`: Secret for cron job authentication
- OR `Authorization`: Bearer token for admin authentication

**Response**:
```json
{
  "success": true,
  "message": "Processed 10 email triggers",
  "results": {
    "total": 10,
    "success": 9,
    "failed": 1,
    "errors": [...]
  }
}
```

### GET /api/process-email-triggers
Check pending email trigger count.

**Response**:
```json
{
  "pendingCount": 5,
  "message": "5 pending email triggers"
}
```

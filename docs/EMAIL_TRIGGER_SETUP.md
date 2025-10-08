# Automatic Email Triggering on Payment Status Update

This document explains the automatic email confirmation system when payment status changes from "pending" to "paid" using **Supabase Database Webhooks**.

## Overview

When an admin manually updates a registrant's payment status from "pending" to "paid" in Supabase, the system automatically triggers a confirmation email to be sent to the user.

## Architecture

### Simple Webhook-Based System

```
Admin updates payment → DB Trigger → Log entry → Supabase Webhook → Email API → Email sent
```

**Components**:
1. **Database Trigger**: Logs payment status changes to `email_trigger_log` table
2. **Supabase Webhook**: Listens for new entries in `email_trigger_log`
3. **Webhook API**: `/api/send-confirmation-email-webhook` processes the trigger
4. **Email Service**: Sends confirmation email via SMTP

## Setup Instructions

### Step 1: Run Database Migration

Run this migration in your **Supabase SQL Editor**:

```sql
-- Copy and paste the entire content from:
-- supabase/migrations/20251008_add_payment_status_email_trigger.sql
```

This creates:
- `email_trigger_log` table to track email triggers
- `log_payment_status_change()` function to detect payment status changes
- Database trigger on `registrants` table
- RLS policies for admin access

### Step 2: Add Environment Variable

Add to your `.env` file:

```env
# Supabase Webhook Secret (for authentication)
SUPABASE_WEBHOOK_SECRET=your-random-webhook-secret-here
```

Generate a secure secret:
```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Important**: Add this same secret to your Vercel environment variables after deployment.

### Step 3: Deploy to Vercel

Deploy your application to Vercel:
```bash
git add .
git commit -m "Add automatic email triggering on payment status update"
git push
```

### Step 4: Configure Supabase Database Webhook

1. **Go to Supabase Dashboard** → Database → Webhooks
2. **Click "Create a new hook"**
3. **Configure the webhook**:

   | Field | Value |
   |-------|-------|
   | **Name** | Send Confirmation Email on Payment |
   | **Table** | `email_trigger_log` |
   | **Events** | ✅ Insert (check this box) |
   | **Type** | HTTP Request |
   | **Method** | POST |
   | **URL** | `https://kratos-nu.vercel.app/api/send-confirmation-email-webhook` |

4. **Add HTTP Headers**:
   ```
   Content-Type: application/json
   x-webhook-secret: [paste your SUPABASE_WEBHOOK_SECRET here]
   ```

5. **Click "Create webhook"**

### Step 5: Test the System

1. **Update a registrant's payment status** in Supabase:
   ```sql
   UPDATE registrants 
   SET 
     payment_status = 'paid',
     payment_time = NOW(),
     razorpay_payment_id = 'test_manual_' || gen_random_uuid()::text
   WHERE id = 123;  -- Replace with actual registrant ID
   ```

2. **Check the trigger log**:
   ```sql
   SELECT * FROM email_trigger_log 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. **Verify webhook execution** in Supabase:
   - Dashboard → Database → Webhooks → [Your webhook] → Logs

4. **Check if email was sent**:
   ```sql
   SELECT * FROM email_trigger_log 
   WHERE email_sent = true 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## How It Works

### Detailed Workflow

1. **Admin Action**: Admin updates `registrants.payment_status` to `'paid'` in Supabase
2. **Database Trigger**: `trigger_log_payment_status_change` fires
3. **Log Entry**: New record inserted into `email_trigger_log` table
4. **Webhook Trigger**: Supabase detects INSERT and calls webhook URL
5. **API Processing**: `/api/send-confirmation-email-webhook` receives webhook
6. **Email Sending**: Calls `/api/send-confirmation-email` to send email
7. **Log Update**: Updates `email_trigger_log.email_sent = true`

### Database Schema

**email_trigger_log**
```sql
id               SERIAL PRIMARY KEY
registrant_id    INTEGER (FK to registrants)
trigger_type     VARCHAR(50)  -- 'payment_status_update'
old_status       VARCHAR(20)  -- e.g., 'pending'
new_status       VARCHAR(20)  -- e.g., 'paid'
triggered_at     TIMESTAMPTZ
email_sent       BOOLEAN      -- false until webhook processes it
error_message    TEXT         -- NULL if successful
created_at       TIMESTAMPTZ
```

## Monitoring

### View Recent Email Triggers

```sql
SELECT 
  etl.id,
  etl.registrant_id,
  etl.old_status,
  etl.new_status,
  etl.email_sent,
  etl.error_message,
  etl.created_at,
  r.team_name,
  u.email,
  u.name,
  e.name as event_name
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
JOIN events e ON e.id = r.event_id
ORDER BY etl.created_at DESC
LIMIT 20;
```

### Check Failed Email Attempts

```sql
SELECT 
  etl.*,
  r.team_name,
  u.email
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
WHERE etl.error_message IS NOT NULL
ORDER BY etl.created_at DESC;
```

### View Webhook Logs in Supabase

1. Go to **Supabase Dashboard** → Database → Webhooks
2. Click on your webhook: **"Send Confirmation Email on Payment"**
3. Click **"Logs"** tab to see execution history

## Troubleshooting

### Emails Not Being Sent

**1. Check if database trigger is logging**:
```sql
SELECT * FROM email_trigger_log 
ORDER BY created_at DESC 
LIMIT 10;
```
- If no records: Database trigger may not be installed correctly
- Solution: Re-run the migration

**2. Check webhook execution in Supabase**:
- Dashboard → Database → Webhooks → [Your webhook] → Logs
- Look for failed requests (red status)
- Check error messages

**3. Check for error messages in log**:
```sql
SELECT * FROM email_trigger_log 
WHERE error_message IS NOT NULL;
```

**4. Verify webhook secret**:
- Ensure `SUPABASE_WEBHOOK_SECRET` in `.env` matches webhook header
- Redeploy if you changed the secret

**5. Test webhook endpoint directly**:
```bash
curl -X POST https://kratos-nu.vercel.app/api/send-confirmation-email-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "type": "INSERT",
    "table": "email_trigger_log",
    "record": {
      "id": 1,
      "registrant_id": 123
    }
  }'
```

**6. Check SMTP configuration**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=updates.kratos@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=updates.kratos@gmail.com
```

### Webhook Returns 401 Unauthorized

- **Cause**: Webhook secret mismatch
- **Solution**: 
  1. Check `SUPABASE_WEBHOOK_SECRET` in Vercel environment variables
  2. Update webhook header in Supabase webhook configuration
  3. Ensure both match exactly

### Webhook Returns 404 Not Found

- **Cause**: Registrant not found or deleted
- **Solution**: Check if registrant ID exists in database

### Duplicate Emails

- **Prevention**: The system is idempotent
- Email service checks `email_logs` table before sending
- Each email is sent only once per payment

## Security

- ✅ Webhook authentication via secret header (`x-webhook-secret`)
- ✅ RLS policies protect `email_trigger_log` (admin-only access)
- ✅ Server-side only processing (uses service role key)
- ✅ SMTP credentials never exposed to client
- ✅ Validates payment status before sending email

## Performance

- ⚡ **Instant**: Webhook triggers immediately on payment status change
- ⚡ **Async**: Email sending doesn't block database operations
- ⚡ **Reliable**: Webhook logs provide audit trail
- ⚡ **Scalable**: Handles multiple simultaneous updates

## API Endpoints

### POST /api/send-confirmation-email-webhook

**Purpose**: Supabase webhook endpoint for email triggering

**Authentication**: `x-webhook-secret` header

**Request** (from Supabase):
```json
{
  "type": "INSERT",
  "table": "email_trigger_log",
  "record": {
    "id": 1,
    "registrant_id": 123,
    "old_status": "pending",
    "new_status": "paid"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Confirmation email sent successfully",
  "registrantId": 123,
  "logId": 1
}
```

### GET /api/send-confirmation-email-webhook

**Purpose**: Health check endpoint

**Response**:
```json
{
  "status": "ok",
  "message": "Supabase webhook endpoint is active"
}
```

## Testing Script

Use the provided SQL test script:

```bash
# File: scripts/test_email_trigger.sql
```

Run in Supabase SQL Editor to:
1. Find test registrants
2. Update payment status
3. Verify trigger logging
4. Check email sending status

## Summary

✅ **Simple Setup**: Just run migration + configure one webhook  
✅ **Instant Processing**: Emails sent immediately on status change  
✅ **No Cron Jobs**: Supabase webhooks handle everything  
✅ **Full Logging**: Complete audit trail in `email_trigger_log`  
✅ **Error Tracking**: Failed attempts logged with error messages  
✅ **Production Ready**: Secure, scalable, and reliable  

## Next Steps

1. ✅ Run database migration in Supabase
2. ✅ Add `SUPABASE_WEBHOOK_SECRET` to `.env`
3. ✅ Deploy to Vercel
4. ✅ Configure Supabase webhook
5. ✅ Test with sample payment update
6. ✅ Monitor `email_trigger_log` table

---

**Need Help?** Check webhook logs in Supabase Dashboard → Database → Webhooks → Logs

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

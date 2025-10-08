# 📧 Automatic Email on Payment Status Update

## Quick Setup Guide

When you manually update a payment status from "pending" to "paid" in Supabase, an email is automatically sent to the user.

### 🚀 Setup (3 Steps)

#### 1️⃣ Run Database Migration

In **Supabase SQL Editor**, run:
```sql
-- Copy entire content from:
supabase/migrations/20251008_add_payment_status_email_trigger.sql
```

#### 2️⃣ Add Environment Variable

In `.env`:
```env
SUPABASE_WEBHOOK_SECRET=paste-random-secret-here
```

Deploy to Vercel and add the same variable in Vercel dashboard.

#### 3️⃣ Configure Supabase Webhook

**Supabase Dashboard → Database → Webhooks → Create a new hook**

| Setting | Value |
|---------|-------|
| Name | Send Confirmation Email on Payment |
| Table | `email_trigger_log` |
| Events | ✅ Insert |
| Method | POST |
| URL | `https://kratos-nu.vercel.app/api/send-confirmation-email-webhook` |
| Headers | `Content-Type: application/json`<br>`x-webhook-secret: [your-secret]` |

Click **Create webhook** ✅

---

### ✅ Test It

```sql
-- In Supabase, update a payment status
UPDATE registrants 
SET payment_status = 'paid', payment_time = NOW()
WHERE id = 123;

-- Check if trigger logged it
SELECT * FROM email_trigger_log ORDER BY created_at DESC LIMIT 5;

-- Verify email was sent
SELECT * FROM email_trigger_log WHERE email_sent = true;
```

---

### 📊 Monitor

**View webhook logs**:
- Supabase Dashboard → Database → Webhooks → [Your webhook] → Logs

**View email triggers**:
```sql
SELECT 
  etl.*,
  r.team_name,
  u.email,
  e.name as event_name
FROM email_trigger_log etl
JOIN registrants r ON r.id = etl.registrant_id
JOIN users u ON u.id = r.user_id
JOIN events e ON e.id = r.event_id
ORDER BY etl.created_at DESC;
```

---

### 🔧 How It Works

```
Admin updates payment_status = 'paid'
    ↓
Database trigger creates log entry
    ↓
Supabase webhook fires
    ↓
API sends confirmation email
    ↓
Log updated: email_sent = true
```

---

### 📚 Full Documentation

See [EMAIL_TRIGGER_SETUP.md](./EMAIL_TRIGGER_SETUP.md) for complete documentation, troubleshooting, and advanced usage.

---

**That's it!** The system is fully automatic. No cron jobs, no manual processing needed. 🎉

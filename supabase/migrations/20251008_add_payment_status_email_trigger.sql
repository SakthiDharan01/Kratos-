-- Migration: Automatic Email Triggering via Supabase Webhooks
-- This creates a log table that triggers emails when payment status changes to 'paid'

-- Step 1: Create email trigger log table
CREATE TABLE IF NOT EXISTS email_trigger_log (
  id SERIAL PRIMARY KEY,
  registrant_id INTEGER NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'payment_status_update',
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_trigger_log_registrant ON email_trigger_log(registrant_id);
CREATE INDEX IF NOT EXISTS idx_email_trigger_log_triggered_at ON email_trigger_log(triggered_at);
CREATE INDEX IF NOT EXISTS idx_email_trigger_log_email_sent ON email_trigger_log(email_sent);

-- Step 2: Create function to log payment status changes
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when payment status changes to 'paid' from any other status
  IF (TG_OP = 'UPDATE' AND OLD.payment_status != 'paid' AND NEW.payment_status = 'paid') THEN
    INSERT INTO email_trigger_log (
      registrant_id,
      trigger_type,
      old_status,
      new_status,
      triggered_at
    ) VALUES (
      NEW.id,
      'payment_status_update',
      OLD.payment_status,
      NEW.payment_status,
      NOW()
    );

    RAISE NOTICE 'Payment status changed for registrant ID % from % to %. Email trigger logged.', 
      NEW.id, OLD.payment_status, NEW.payment_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger on registrants table
DROP TRIGGER IF EXISTS trigger_log_payment_status_change ON registrants;
CREATE TRIGGER trigger_log_payment_status_change
  AFTER UPDATE OF payment_status ON registrants
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_status_change();

-- Step 4: Add RLS policies for email_trigger_log
-- Note: RLS is enabled but policies allow service role (backend) to manage the table
-- No user-facing access needed since this is purely backend logging
ALTER TABLE email_trigger_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (backend operations)
CREATE POLICY "Allow service role full access to email trigger logs" ON email_trigger_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE email_trigger_log IS 'Logs payment status changes that trigger confirmation emails. Supabase webhook listens to INSERT events on this table.';
COMMENT ON FUNCTION log_payment_status_change() IS 'Automatically logs when payment status changes to paid. Supabase webhook then sends the email.';

-- ============================================================================
-- NEXT STEP: Configure Supabase Database Webhook
-- ============================================================================
-- 1. Go to Supabase Dashboard → Database → Webhooks
-- 2. Click "Create a new hook"
-- 3. Configure:
--    - Name: "Send Confirmation Email on Payment"
--    - Table: "email_trigger_log"
--    - Events: Check "Insert"
--    - Type: "HTTP Request"
--    - Method: "POST"
--    - URL: "https://kratos-nu.vercel.app/api/send-confirmation-email-webhook"
--    - HTTP Headers:
--      Content-Type: application/json
--      x-webhook-secret: [your-secret-key]
-- 4. Save the webhook
-- ============================================================================

-- Alternative migration: Use Supabase webhooks for email triggering
-- This approach is more reliable than pg_net and works better with Supabase infrastructure

-- Step 1: Create a log table to track email trigger attempts
CREATE TABLE IF NOT EXISTS email_trigger_log (
  id SERIAL PRIMARY KEY,
  registrant_id INTEGER NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL, -- 'payment_status_update', 'webhook', 'manual'
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_trigger_log_registrant ON email_trigger_log(registrant_id);
CREATE INDEX IF NOT EXISTS idx_email_trigger_log_triggered_at ON email_trigger_log(triggered_at);

-- Step 2: Create function to log email trigger events
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

-- Step 3: Create trigger for logging
DROP TRIGGER IF EXISTS trigger_log_payment_status_change ON registrants;
CREATE TRIGGER trigger_log_payment_status_change
  AFTER UPDATE OF payment_status ON registrants
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_status_change();

-- Step 4: Add RLS policies for email_trigger_log (admin access only)
ALTER TABLE email_trigger_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to view email trigger logs" ON email_trigger_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = TRUE
    )
  );

-- Add comments
COMMENT ON TABLE email_trigger_log IS 'Logs all attempts to trigger confirmation emails when payment status changes';
COMMENT ON FUNCTION log_payment_status_change() IS 'Logs payment status changes that should trigger confirmation emails. The actual email sending is handled by the application via scheduled jobs or immediate API calls.';

-- Migration to automatically send confirmation emails when payment status changes to 'paid'
-- This handles manual admin updates and webhook updates alike

-- Create a function to send confirmation email via webhook when payment status changes
CREATE OR REPLACE FUNCTION send_confirmation_email_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_site_url TEXT;
BEGIN
  -- Only proceed if payment status changed from pending to paid
  IF (TG_OP = 'UPDATE' AND OLD.payment_status != 'paid' AND NEW.payment_status = 'paid') THEN
    
    -- Get the site URL from environment (fallback to localhost for development)
    v_site_url := current_setting('app.settings.site_url', true);
    IF v_site_url IS NULL OR v_site_url = '' THEN
      v_site_url := 'https://kratos-nu.vercel.app';
    END IF;

    -- Use pg_net extension to make HTTP request to email API
    -- This is async and won't block the transaction
    PERFORM net.http_post(
      url := v_site_url || '/api/send-confirmation-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'registrantId', NEW.id,
        'paymentId', NEW.razorpay_payment_id,
        'trigger', 'payment_status_update'
      )
    );

    -- Log the email trigger attempt
    RAISE NOTICE 'Triggered confirmation email for registrant ID: %, Payment ID: %', NEW.id, NEW.razorpay_payment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_send_email_on_payment ON registrants;
CREATE TRIGGER trigger_send_email_on_payment
  AFTER UPDATE OF payment_status ON registrants
  FOR EACH ROW
  EXECUTE FUNCTION send_confirmation_email_on_payment();

-- Add comment for documentation
COMMENT ON FUNCTION send_confirmation_email_on_payment() IS 'Automatically triggers confirmation email sending when registrant payment_status changes from pending/failed to paid. Works for both webhook updates and manual admin updates.';

-- Note: This trigger requires the pg_net extension to be enabled
-- Run this in Supabase SQL editor if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

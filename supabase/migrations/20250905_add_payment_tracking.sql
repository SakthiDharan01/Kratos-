-- Ensure registrants table has all required payment tracking fields
-- This migration adds missing columns if they don't exist

-- Add paid_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registrants' AND column_name = 'paid_amount') THEN
        ALTER TABLE registrants ADD COLUMN paid_amount INTEGER;
        COMMENT ON COLUMN registrants.paid_amount IS 'Amount actually paid in INR (for tracking partial payments or discounts)';
    END IF;
END $$;

-- Add payment_time column if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registrants' AND column_name = 'payment_time') THEN
        ALTER TABLE registrants ADD COLUMN payment_time TIMESTAMPTZ;
        COMMENT ON COLUMN registrants.payment_time IS 'Timestamp when payment was actually completed';
    END IF;
END $$;

-- Add razorpay_signature column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registrants' AND column_name = 'razorpay_signature') THEN
        ALTER TABLE registrants ADD COLUMN razorpay_signature TEXT;
        COMMENT ON COLUMN registrants.razorpay_signature IS 'Razorpay payment signature for verification';
    END IF;
END $$;

-- Update existing paid registrations to set paid_amount from event price if null
UPDATE registrants 
SET paid_amount = events.price
FROM events 
WHERE registrants.event_id = events.id 
  AND registrants.payment_status = 'paid' 
  AND registrants.paid_amount IS NULL;

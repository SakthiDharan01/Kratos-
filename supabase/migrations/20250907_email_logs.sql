-- Add email logging table for tracking email sending
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  registrant_id INTEGER REFERENCES registrants(id),
  payment_id TEXT,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  recipients TEXT[], -- Array of email addresses
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_registrant_id ON email_logs(registrant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Add RLS policy for email logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own email logs
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (
    registrant_id IN (
      SELECT id FROM registrants WHERE user_id = auth.uid()
    )
  );

-- Admin policy: Admins can see all email logs
CREATE POLICY "Admins can view all email logs" ON email_logs
  FOR ALL USING (
    auth.email() IN (
      'admin@kratos2k25.com',
      'support@kratos2k25.com',
      'kratos2k25@easwari.edu.in'
    )
  );

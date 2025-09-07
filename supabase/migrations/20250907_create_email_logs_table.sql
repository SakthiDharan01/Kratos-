-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    payment_id TEXT,
    event_name TEXT,
    team_name TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    email_provider TEXT DEFAULT 'supabase',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_payment_id ON public.email_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage email logs
CREATE POLICY "Service role can manage email logs" ON public.email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy to allow authenticated users to view their own email logs
CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (auth.email() = recipient_email);

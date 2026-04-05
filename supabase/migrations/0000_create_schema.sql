-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  imap_host TEXT DEFAULT 'imap.gmail.com',
  imap_port INT DEFAULT 993,
  imap_user TEXT NOT NULL,
  imap_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_scan_at TIMESTAMPTZ
);

-- Create scanned_emails table
CREATE TABLE IF NOT EXISTS scanned_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE NOT NULL,
  from_email TEXT,
  from_name TEXT,
  subject TEXT,
  body_preview TEXT, -- first 500 chars
  full_body TEXT,
  received_at TIMESTAMPTZ,
  is_positive BOOLEAN,
  confidence_score FLOAT, -- 0.0 to 1.0
  ai_reasoning TEXT,
  category TEXT, -- 'interested', 'meeting_request', 'referral', 'not_now', 'negative', 'unsubscribe', 'auto_reply', 'other'
  scanned_at TIMESTAMPTZ DEFAULT now()
);

-- Create scan_logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  emails_fetched INT DEFAULT 0,
  emails_analyzed INT DEFAULT 0,
  positives_found INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT
);

-- Enable RLS (Optional, but good practice. Since we use service role, we'll keep it simple for now or restrict to service role)
-- For this spec, we'll assume the API uses the service role key.
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Basic policy: Allow all access for service role (default behavior often suffices, but let's be explicit if needed)
-- CREATE POLICY "Allow service role access" ON email_accounts FOR ALL USING (true);

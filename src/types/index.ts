export interface EmailAccount {
  id: string;
  label: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password?: string;
  is_active: boolean;
  created_at: string;
  last_scan_at?: string;
  last_scanned_at?: string; // mapping alias used in API
}

export interface ScannedEmail {
  id: string;
  account_id: string;
  message_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body_preview: string;
  full_body: string;
  received_at: string;
  is_positive: boolean;
  confidence_score: number;
  ai_reasoning: string;
  category: string;
  scanned_at: string;
  email_accounts?: {
    label: string;
  };
}

export interface ScanJob {
  status: 'running' | 'completed' | 'error';
  fetched: number;
  analyzed: number;
  positives: number;
  error?: string;
}

export interface ImapEmail {
  message_id: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  full_body: string;
  received_at: string;
}

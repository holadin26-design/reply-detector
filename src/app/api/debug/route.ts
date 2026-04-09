import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { count, error: e2 } = await supabaseAdmin
      .from('scanned_emails')
      .select('*', { count: 'exact', head: true });

    const { data: sample, error: e3 } = await supabaseAdmin
      .from('scanned_emails')
      .select('id, message_id, from_email, subject, is_positive, received_at')
      .limit(5)
      .order('scanned_at', { ascending: false });

    const { data: accounts, error: e4 } = await supabaseAdmin
      .from('email_accounts')
      .select('id, label, email, last_scan_at');

    return NextResponse.json({
      scanned_emails_count: count,
      recent_sample: sample,
      accounts,
      errors: { e2: e2?.message, e3: e3?.message, e4: e4?.message },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

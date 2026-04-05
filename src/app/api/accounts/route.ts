import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_accounts')
      .select('id, label, email, imap_host, imap_port, is_active, created_at, last_scanned_at:last_scan_at')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Accounts GET Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, email, imap_host, imap_port, imap_user, imap_password } = body;

    if (!email || !imap_user || !imap_password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('email_accounts')
      .insert([{
        label: label || email,
        email,
        imap_host: imap_host || 'imap.gmail.com',
        imap_port: imap_port || 993,
        imap_user,
        imap_password,
      }])
      .select('id, label, email')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Accounts POST Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

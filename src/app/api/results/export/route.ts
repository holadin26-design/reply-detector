import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const category = searchParams.get('category');
  const isPositive = searchParams.get('isPositive');

  let query = supabaseAdmin
    .from('scanned_emails')
    .select(`
      *,
      email_accounts (label)
    `)
    .order('received_at', { ascending: false });

  if (accountId && accountId !== 'all') query = query.eq('account_id', accountId);
  if (category && category !== 'all') query = query.eq('category', category);
  if (isPositive === 'true') query = query.eq('is_positive', true);
  if (isPositive === 'false') query = query.eq('is_positive', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['From Name', 'From Email', 'Subject', 'Category', 'Positive', 'Confidence', 'Received At', 'AI Reasoning', 'Account'];
  const rows = (data || []).map(e => [
    e.from_name || '',
    e.from_email || '',
    `"${e.subject?.replace(/"/g, '""')}"`,
    e.category || '',
    e.is_positive ? 'Yes' : 'No',
    e.confidence_score,
    e.received_at,
    `"${e.ai_reasoning?.replace(/"/g, '""')}"`,
    e.email_accounts?.label || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="replyradar_results_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err: unknown) {
    console.error('Export GET Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

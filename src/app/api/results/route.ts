import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const category = searchParams.get('category');
  const isPositive = searchParams.get('isPositive');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

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
  if (dateFrom) query = query.gte('received_at', dateFrom);
  if (dateTo) query = query.lte('received_at', dateTo);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

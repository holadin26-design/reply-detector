import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const { error } = await supabaseAdmin
    .from('email_accounts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

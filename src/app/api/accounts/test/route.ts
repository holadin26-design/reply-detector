import { NextResponse } from 'next/server';
import { testImapConnection } from '@/lib/imap';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await testImapConnection(body);

  if (result.success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
}

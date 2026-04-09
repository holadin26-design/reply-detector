import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchEmails } from '@/lib/imap';
import { classifyEmail } from '@/lib/openai';
import { EmailAccount, ImapEmail } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed for Vercel Hobby

export async function POST(request: Request) {
  try {
    const { accountIds, dateFrom, dateTo } = await request.json();
    
    if (!accountIds || !dateFrom || !dateTo) {
      return NextResponse.json({ error: 'Missing scan parameters' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (data: Record<string, unknown>) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          } catch {
            console.error("Stream already closed");
          }
        };

        const state = { status: 'running', fetched: 0, analyzed: 0, positives: 0 };
        sendUpdate(state);

        try {
          const { data: accounts, error: accError } = await supabaseAdmin
            .from('email_accounts')
            .select('*')
            .in('id', accountIds);

          if (accError) throw accError;

          const typedAccounts = accounts as EmailAccount[];

          for (const account of typedAccounts) {
            // 1. Fetch from IMAP
            const emails: ImapEmail[] = await fetchEmails(account, new Date(dateFrom), new Date(dateTo));
            state.fetched += emails.length;
            sendUpdate(state);

            // 2. Filter out already scanned
            const { data: existing } = await supabaseAdmin
              .from('scanned_emails')
              .select('message_id')
              .in('message_id', emails.map((e: ImapEmail) => e.message_id));
            
            const existingIds = new Set(existing?.map(e => e.message_id) || []);
            const newEmails = emails.filter((e: ImapEmail) => !existingIds.has(e.message_id));

            // 3. Batch Process
            const batchSize = 10;
            for (let i = 0; i < newEmails.length; i += batchSize) {
              const batch = newEmails.slice(i, i + batchSize);
              
              await Promise.allSettled(batch.map(async (email: ImapEmail) => {
                try {
                  const classification = await classifyEmail(
                    email.full_body.substring(0, 5000), // truncation for safety
                    email.from_name || 'Prospect',
                    email.from_email || '',
                    email.subject || ''
                  );

                  await supabaseAdmin.from('scanned_emails').insert([{
                    account_id: account.id,
                    message_id: email.message_id,
                    from_email: email.from_email,
                    from_name: email.from_name,
                    subject: email.subject,
                    body_preview: email.full_body.substring(0, 500),
                    full_body: email.full_body,
                    received_at: email.received_at,
                    is_positive: classification.is_positive,
                    confidence_score: classification.confidence_score,
                    ai_reasoning: classification.reasoning,
                    category: classification.category,
                  }]);

                  state.analyzed++;
                  if (classification.is_positive) {
                    state.positives++;
                  }
                } catch (err) {
                  console.error('Classification error:', err);
                }
              }));

              sendUpdate(state);

              // Rate limit delay
              if (i + batchSize < newEmails.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            }

            // Update account last scan
            await supabaseAdmin.from('email_accounts')
              .update({ last_scan_at: new Date().toISOString() })
              .eq('id', account.id);
              
            // Log the scan
            await supabaseAdmin.from('scan_logs').insert([{
              account_id: account.id,
              emails_fetched: emails.length,
              emails_analyzed: newEmails.length,
              positives_found: state.positives, 
              started_at: new Date(dateFrom).toISOString(),
              completed_at: new Date().toISOString()
            }]);
          }

          state.status = 'completed';
          sendUpdate(state);
          controller.close();
        } catch (err: unknown) {
          console.error('Scan Failed:', err);
          state.status = 'error';
          sendUpdate({ ...state, error: err instanceof Error ? err.message : String(err) });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('Scan POST Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

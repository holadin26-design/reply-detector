import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchEmails } from '@/lib/imap';
import { classifyEmail } from '@/lib/openai';
import { scanJobs } from '@/lib/scan-state';
import { EmailAccount, ImapEmail } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { accountIds, dateFrom, dateTo } = await request.json();
    
    if (!accountIds || !dateFrom || !dateTo) {
      return NextResponse.json({ error: 'Missing scan parameters' }, { status: 400 });
    }

    const jobId = Math.random().toString(36).substring(7);
    
    scanJobs[jobId] = { status: 'running', fetched: 0, analyzed: 0, positives: 0 };

    // Run the scan asynchronously
    runScan(jobId, accountIds, new Date(dateFrom), new Date(dateTo)).catch(err => {
      console.error('Scan Failed:', err);
      if (scanJobs[jobId]) {
        scanJobs[jobId].status = 'error';
        scanJobs[jobId].error = err instanceof Error ? err.message : String(err);
      }
    });

    return NextResponse.json({ jobId });
  } catch (err: unknown) {
    console.error('Scan POST Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

async function runScan(jobId: string, accountIds: string[], dateFrom: Date, dateTo: Date) {
  try {
    const { data: accounts, error: accError } = await supabaseAdmin
      .from('email_accounts')
      .select('*')
      .in('id', accountIds);

    if (accError) throw accError;

    const typedAccounts = accounts as EmailAccount[];

    for (const account of typedAccounts) {
      // 1. Fetch from IMAP
      const emails: ImapEmail[] = await fetchEmails(account, dateFrom, dateTo);
      scanJobs[jobId].fetched += emails.length;

      // 2. Filter out already scanned
      const { data: existing } = await supabaseAdmin
        .from('scanned_emails')
        .select('message_id')
        .in('message_id', emails.map((e: ImapEmail) => e.message_id));
      
      const existingIds = new Set(existing?.map(e => e.message_id) || []);
      const newEmails = emails.filter((e: ImapEmail) => !existingIds.has(e.message_id));

      // 3. Batch Process with OpenAI (10 at a time)
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

            scanJobs[jobId].analyzed++;
            if (classification.is_positive) {
              scanJobs[jobId].positives++;
            }
          } catch (err) {
            console.error('Classification error:', err);
          }
        }));

        // Rate limit delay
        if (i + batchSize < newEmails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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
        positives_found: scanJobs[jobId].positives, 
        started_at: dateFrom.toISOString(),
        completed_at: new Date().toISOString()
      }]);
    }

    scanJobs[jobId].status = 'completed';
  } catch (err: unknown) {
    if (scanJobs[jobId]) {
      scanJobs[jobId].status = 'error';
      scanJobs[jobId].error = err instanceof Error ? err.message : String(err);
    }
    throw err;
  }
}

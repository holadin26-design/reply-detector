import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailAccount, ImapEmail } from '@/types';

export async function testImapConnection(config: Partial<EmailAccount>) {
  const client = new ImapFlow({
    host: config.imap_host || 'imap.gmail.com',
    port: config.imap_port || 993,
    secure: true,
    auth: {
      user: config.imap_user || '',
      pass: config.imap_password || '',
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (error: unknown) {
    console.error('IMAP Connection Test Failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function fetchEmails(config: EmailAccount, dateFrom: Date, dateTo: Date): Promise<ImapEmail[]> {
  const client = new ImapFlow({
    host: config.imap_host || 'imap.gmail.com',
    port: config.imap_port || 993,
    secure: true,
    auth: {
      user: config.imap_user || '',
      pass: config.imap_password || '',
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  try {
    const messages: ImapEmail[] = [];
    const searchCriteria = {
      since: dateFrom,
      before: new Date(dateTo.getTime() + 24 * 60 * 60 * 1000), // inclusive of dateTo
    };

    // 1. Get List of messages in range (UIDs)
    const uids = await client.search(searchCriteria);
    
    if (uids && uids.length > 0) {
      // 2. Fetch source for those messages
      for await (const message of client.fetch(uids, { source: true, envelope: true })) {
        const parsed = await simpleParser(message.source as Buffer);
        
        messages.push({
          message_id: (message.envelope?.messageId || parsed.messageId || Math.random().toString()).toString(),
          from_email: parsed.from?.value[0]?.address || '',
          from_name: parsed.from?.value[0]?.name || '',
          subject: parsed.subject || '',
          full_body: parsed.text || parsed.textAsHtml?.replace(/<[^>]*>?/gm, '') || '', 
          received_at: (parsed.date || message.envelope?.date || new Date()).toISOString(),
        });
      }
    }

    return messages;
  } finally {
    lock.release();
    await client.logout();
  }
}

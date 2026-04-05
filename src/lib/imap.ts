import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export async function testImapConnection(config: any) {
  const client = new ImapFlow({
    host: config.imap_host || 'imap.gmail.com',
    port: config.imap_port || 993,
    secure: true,
    auth: {
      user: config.imap_user,
      pass: config.imap_password,
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (error: any) {
    console.error('IMAP Connection Test Failed:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchEmails(config: any, dateFrom: Date, dateTo: Date) {
  const client = new ImapFlow({
    host: config.imap_host || 'imap.gmail.com',
    port: config.imap_port || 993,
    secure: true,
    auth: {
      user: config.imap_user,
      pass: config.imap_password,
    },
    logger: false,
  });

  await client.connect();
  let lock = await client.getMailboxLock('INBOX');

  try {
    const messages = [];
    const searchCriteria = {
      since: dateFrom,
      before: new Date(dateTo.getTime() + 24 * 60 * 60 * 1000), // inclusive of dateTo
    };

    for await (let message of client.list(searchCriteria, { source: true })) {
      const parsed = await simpleParser(message.source);
      
      messages.push({
        message_id: message.envelope?.messageId || parsed.messageId,
        from_email: parsed.from?.value[0]?.address,
        from_name: parsed.from?.value[0]?.name,
        subject: parsed.subject,
        full_body: parsed.text || parsed.textAsHtml?.replace(/<[^>]*>?/gm, '') || '', // strip HTML if only HTML exists
        received_at: parsed.date || message.envelope?.date,
      });
    }

    return messages;
  } finally {
    lock.release();
    await client.logout();
  }
}

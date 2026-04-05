import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type EmailClassification = {
  is_positive: boolean;
  confidence_score: number;
  category: "interested" | "meeting_request" | "referral" | "not_now" | "negative" | "unsubscribe" | "auto_reply" | "other";
  reasoning: string;
};

export async function classifyEmail(body: string, fromName: string, fromEmail: string, subject: string): Promise<EmailClassification> {
  const systemPrompt = `You are an expert SDR analyst. Analyze this reply to a cold email outreach campaign. Classify the response.

Return ONLY a JSON object with:
{
  "is_positive": boolean,
  "confidence_score": number between 0.0 and 1.0,
  "category": one of ["interested", "meeting_request", "referral", "not_now", "negative", "unsubscribe", "auto_reply", "other"],
  "reasoning": string (max 2 sentences explaining why)
}

A POSITIVE response is one where the prospect shows any of:
- Interest in learning more
- Asking for pricing, a demo, or a meeting
- Referring you to someone else
- Open to a follow-up

A NEGATIVE response includes:
- Unsubscribes, hard no, not interested
- Auto-replies and out-of-office
- Hostile replies`;

  const userPrompt = `From: ${fromName} <${fromEmail}>
Subject: ${subject}
Body: ${body}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content returned from OpenAI');

  return JSON.parse(content) as EmailClassification;
}

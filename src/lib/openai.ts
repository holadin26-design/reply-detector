export type EmailClassification = {
  is_positive: boolean;
  confidence_score: number;
  category: "interested" | "meeting_request" | "referral" | "not_now" | "negative" | "unsubscribe" | "auto_reply" | "other";
  reasoning: string;
};

export async function classifyEmail(body: string, fromName: string, fromEmail: string, subject: string): Promise<EmailClassification> {
  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  // Auto-replies
  if (
    lowerSubject.includes("auto-reply") || 
    lowerSubject.includes("automatic reply") || 
    lowerSubject.includes("out of office") ||
    lowerSubject.includes("ooo") ||
    lowerBody.includes("out of the office") ||
    lowerBody.includes("away from my desk") ||
    lowerBody.includes("vacation")
  ) {
    return {
      is_positive: false,
      confidence_score: 0.9,
      category: "auto_reply",
      reasoning: "Subject or body contains clear out-of-office or auto-reply keywords."
    };
  }

  // Unsubscribe / Hard No
  if (
    lowerBody.includes("unsubscribe") ||
    lowerBody.includes("take me off") ||
    lowerBody.includes("remove me") ||
    lowerBody.includes("stop emailing") ||
    lowerBody.includes("not interested") ||
    lowerBody.includes("no longer interested") ||
    lowerBody.includes("no thanks") ||
    lowerBody.includes("please stop") ||
    lowerBody.startsWith("no") ||
    lowerBody.includes("don't email")
  ) {
    const isUnsub = lowerBody.includes("unsubscribe") || lowerBody.includes("take me off") || lowerBody.includes("remove me");
    return {
      is_positive: false,
      confidence_score: 0.85,
      category: isUnsub ? "unsubscribe" : "negative",
      reasoning: "Contains clear indicators of disinterest or unsubscribe requests."
    };
  }

  // Meeting / Pricing / Referrals
  if (
    lowerBody.includes("meeting") ||
    lowerBody.includes("call") ||
    lowerBody.includes("quick chat") ||
    lowerBody.includes("discuss") ||
    lowerBody.includes("calendar") ||
    lowerBody.includes("availability") ||
    lowerBody.includes("time to connect") ||
    lowerBody.includes("pricing") ||
    lowerBody.includes("how much") ||
    lowerBody.includes("demo")
  ) {
    let category: EmailClassification["category"] = "interested";
    if (lowerBody.includes("meeting") || lowerBody.includes("call") || lowerBody.includes("calendar")) {
      category = "meeting_request";
    }

    return {
      is_positive: true,
      confidence_score: 0.7,
      category,
      reasoning: "Contains keywords requesting a meeting, pricing, or demonstrating active interest."
    };
  }

  // Referrals
  if (
    lowerBody.includes("cc") ||
    lowerBody.includes("looping in") ||
    lowerBody.includes("reach out to") ||
    lowerBody.includes("speak with") ||
    lowerBody.includes("introducing") ||
    lowerBody.includes("better person")
  ) {
    return {
      is_positive: true,
      confidence_score: 0.75,
      category: "referral",
      reasoning: "Appears to be referring to another person or looping someone else into the thread."
    };
  }

  // Not now
  if (
    lowerBody.includes("not right now") ||
    lowerBody.includes("check back") ||
    lowerBody.includes("reach back out") ||
    lowerBody.includes("timing isn't right") ||
    lowerBody.includes("maybe later") ||
    lowerBody.includes("next quarter")
  ) {
    return {
      is_positive: false,
      confidence_score: 0.8,
      category: "not_now",
      reasoning: "Prospect indicated interest might exist in the future, but not at the current time."
    };
  }

  // Default fallback
  // If it's a short reply lacking negative words, it sometimes implies 'yes' or 'sure'.
  // We'll mark it as 'other' and positive engagement.
  return {
    is_positive: true, 
    confidence_score: 0.5,
    category: "other",
    reasoning: "Did not contain explicit negative or unsubscribe keywords, assuming positive engagement."
  };
}

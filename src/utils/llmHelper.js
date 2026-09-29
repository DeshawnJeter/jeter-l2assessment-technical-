import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are a customer support triage assistant for Relay AI.

Your job is to analyze incoming customer messages and classify them.

You MUST respond with ONLY valid JSON in this exact format — no other text:
{
  "category": "<one of: Billing Issue | Technical Problem | Feature Request | General Inquiry>",
  "urgency": "<one of: High | Medium | Low>",
  "reasoning": "<1-2 sentences explaining your classification>",
  "recommendedAction": "<a specific, helpful next step for the support team>"
}

Urgency guidelines:
- High: system outages, data loss, account lockouts, payment failures blocking access, anything production-critical
- Medium: bugs affecting workflow, billing questions with urgency, accounts working but degraded
- Low: feature requests, general questions, positive feedback, non-blocking inquiries

Category guidelines:
- Billing Issue: payments, charges, invoices, refunds, subscription management
- Technical Problem: bugs, errors, crashes, slow performance, features not working
- Feature Request: suggestions for new features or improvements
- General Inquiry: questions about the product, how-to questions, feedback`;

export async function categorizeMessage(message) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.2,
    });

    const content = response.choices[0].message.content.trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);

    const validCategories = ['Billing Issue', 'Technical Problem', 'Feature Request', 'General Inquiry'];
    const validUrgencies = ['High', 'Medium', 'Low'];

    return {
      category: validCategories.includes(parsed.category) ? parsed.category : 'General Inquiry',
      urgency: validUrgencies.includes(parsed.urgency) ? parsed.urgency : 'Medium',
      reasoning: parsed.reasoning || content,
      recommendedAction: parsed.recommendedAction || null,
    };
  } catch (error) {
    console.warn('Groq API failed, using mock response:', error.message);
    return getMockCategorization(message);
  }
}

function getMockCategorization(message) {
  const lowerMessage = message.toLowerCase();

  const reasoningVariations = {
    billing: [
      "This message contains billing terminology. The customer is likely experiencing issues with payments, invoices, or account charges.",
      "The message references financial matters related to the customer's account.",
    ],
    technical: [
      "This message describes technical difficulties or system errors.",
      "The customer is reporting functionality issues that may require engineering review.",
    ],
    feature: [
      "The customer is requesting enhancements or new functionality for the product.",
      "This appears to be a suggestion for product improvements rather than a support issue.",
    ],
    inquiry: [
      "This appears to be a general question about the product or service.",
      "The message contains questions that don't indicate a specific problem.",
    ],
  };

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (lowerMessage.includes('bill') || lowerMessage.includes('payment') ||
      lowerMessage.includes('charge') || lowerMessage.includes('invoice') ||
      lowerMessage.includes('refund') || lowerMessage.includes('subscription')) {
    return { category: 'Billing Issue', urgency: 'Medium', reasoning: getRandom(reasoningVariations.billing), recommendedAction: null };
  }

  if (lowerMessage.includes('bug') || lowerMessage.includes('error') ||
      lowerMessage.includes('broken') || lowerMessage.includes('not working') ||
      lowerMessage.includes('crash') || lowerMessage.includes('down') ||
      lowerMessage.includes('server') || lowerMessage.includes('slow')) {
    return { category: 'Technical Problem', urgency: 'High', reasoning: getRandom(reasoningVariations.technical), recommendedAction: null };
  }

  if (lowerMessage.includes('feature') || lowerMessage.includes('improve') ||
      lowerMessage.includes('suggestion') || lowerMessage.includes('would like') ||
      lowerMessage.includes('enhancement') || lowerMessage.includes('would be great')) {
    return { category: 'Feature Request', urgency: 'Low', reasoning: getRandom(reasoningVariations.feature), recommendedAction: null };
  }

  return { category: 'General Inquiry', urgency: 'Low', reasoning: getRandom(reasoningVariations.inquiry), recommendedAction: null };
}

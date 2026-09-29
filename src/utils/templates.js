const actionTemplates = {
  "Billing Issue": "Ask the customer to visit the billing portal to review charges, update payment info, or download invoices. Escalate to the billing team if the issue isn't resolved.",
  "Technical Problem": "Gather details about the error (screenshot, browser, steps to reproduce) and escalate to the engineering team if it can't be resolved with a quick fix like cache clearing.",
  "General Inquiry": "Respond with a link to the help center FAQ. If the question isn't covered, provide a direct answer and consider adding it to the FAQ.",
  "Feature Request": "Thank the customer for the suggestion and log it in the product backlog. Share it with the product team for review during the next planning cycle.",
  "Unknown": "Review manually and assign to the appropriate team."
}

export function getRecommendedAction(category, urgency) {
  return actionTemplates[category] || "No recommendation available."
}

export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

export function shouldEscalate(category, urgency, message) {
  if (urgency === 'High') return true;
  if (urgency === 'Medium' && category === 'Technical Problem') return true;
  return false;
}

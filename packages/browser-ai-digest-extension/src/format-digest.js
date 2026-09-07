const MAX_FEEDBACK_ITEMS = 8;
const MAX_FEEDBACK_LENGTH = 360;

export function formatAiDigest({ source, url, title, feedback } = {}) {
  const lines = [
    'Review Digest',
    '',
    `Source: ${cleanText(source) || 'Unknown'}`,
    `URL: ${cleanText(url) || 'Unknown'}`,
    `Title: ${cleanText(title) || 'Untitled'}`,
    '',
    'Feedback:',
  ];

  for (const item of normalizeFeedback(feedback)) {
    lines.push(`- ${item}`);
  }

  return lines.join('\n');
}

function normalizeFeedback(feedback) {
  const items = Array.isArray(feedback)
    ? feedback
    : feedback
      ? [feedback]
      : [];

  const cleaned = items
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, MAX_FEEDBACK_ITEMS)
    .map((item) => truncateText(item, MAX_FEEDBACK_LENGTH));

  return cleaned.length > 0 ? cleaned : ['No visible feedback found.'];
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

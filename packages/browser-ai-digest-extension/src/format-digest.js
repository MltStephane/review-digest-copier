const MAX_FEEDBACK_LENGTH = 360;

export function formatAiDigest({ source, url, title, feedback, feedbackItems } = {}) {
  const lines = [
    'You are reviewing the feedback below.',
    '',
    'Context:',
    `- Source: ${cleanText(source) || 'Unknown'}`,
    `- URL: ${cleanText(url) || 'Unknown'}`,
    `- Title: ${cleanText(title) || 'Untitled'}`,
    '',
    'Instructions:',
    '- Treat the items one by one, without merging unrelated remarks.',
    '- The available items may be incomplete, so treat them as extracted evidence, not a complete transcript.',
    '- If two comments conflict, call it out explicitly and prefer the most specific or blocking one.',
    '- Draft ready-to-post conventional review comment replies at the end.',
    '',
    'Feedback:',
  ];

  for (const item of normalizeFeedbackItems(feedbackItems, feedback)) {
    lines.push(...renderFeedbackItem(item));
  }

  return lines.join('\n');
}

function normalizeFeedbackItems(feedbackItems, feedback) {
  const items = Array.isArray(feedbackItems) && feedbackItems.length > 0
    ? feedbackItems
    : Array.isArray(feedback)
      ? feedback
      : feedback
        ? [feedback]
        : [];

  const cleaned = items
    .map((item) => normalizeFeedbackItem(item))
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : [{ comment: 'No visible feedback found.' }];
}

function normalizeFeedbackItem(item) {
  if (typeof item === 'string') {
    const comment = truncateText(cleanText(item), MAX_FEEDBACK_LENGTH);
    return comment ? { comment } : null;
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const comment = truncateText(cleanText(item.comment ?? item.text ?? item.feedback), MAX_FEEDBACK_LENGTH);
  const file = truncateText(cleanText(item.file), 200);
  const diff = truncateText(normalizeDiffText(item.diff), 900);

  if (!comment && !file && !diff) {
    return null;
  }

  return {
    comment: comment || 'No visible feedback found.',
    file,
    diff,
  };
}

function renderFeedbackItem(item) {
  const lines = [];

  if (item.file || item.diff) {
    lines.push(`- Comment: ${item.comment}`);

    if (item.file) {
      lines.push(`  File: ${item.file}`);
    }

    if (item.diff) {
      lines.push('  Diff:');
      lines.push('  ```diff');
      for (const line of item.diff.split('\n')) {
        lines.push(`  ${line}`);
      }
      lines.push('  ```');
    }

    return lines;
  }

  lines.push(`- ${item.comment}`);
  return lines;
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDiffText(value) {
  const lines = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());

  const normalizedLines = [];

  for (const line of lines) {
    if (/^\s*\d+\s*$/.test(line)) {
      continue;
    }

    const prefixMatch = line.match(/^(\s*)\d+(?:\s{2,}|\t+)(\S.*)$/);
    const normalizedLine = prefixMatch ? `${prefixMatch[1]}${prefixMatch[2]}` : line;

    if (normalizedLine === '' && normalizedLines.at(-1) === '') {
      continue;
    }

    normalizedLines.push(normalizedLine);
  }

  return normalizedLines.join('\n').trim();
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

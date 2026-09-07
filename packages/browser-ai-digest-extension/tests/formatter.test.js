import assert from 'node:assert/strict';
import test from 'node:test';

import { formatAiDigest } from '../src/format-digest.js';

test('formats a digest with structured sections', () => {
  const output = formatAiDigest({
    source: 'GitHub PR · openchamber/openchamber#123',
    url: 'https://github.com/openchamber/openchamber/pull/123',
    title: 'Fix clipboard copy flow',
    feedback: ['Please split this into two changes.', 'Looks good to me.'],
  });

  assert.equal(
    output,
    [
      'Review Digest',
      '',
      'Source: GitHub PR · openchamber/openchamber#123',
      'URL: https://github.com/openchamber/openchamber/pull/123',
      'Title: Fix clipboard copy flow',
      '',
      'Feedback:',
      '- Please split this into two changes.',
      '- Looks good to me.',
    ].join('\n'),
  );
});

test('normalizes empty or noisy feedback', () => {
  const output = formatAiDigest({
    source: 'GitLab MR',
    url: 'https://gitlab.com/group/project/-/merge_requests/7',
    title: 'Review draft',
    feedback: ['   ', '\n\nNeeds\tattention\n\n'],
  });

  assert.match(output, /- Needs attention/);
  assert.doesNotMatch(output, /-\s+$/m);
});

test('falls back when no feedback is available', () => {
  const output = formatAiDigest({
    source: 'Unknown',
    url: '',
    title: '',
    feedback: [],
  });

  assert.match(output, /- No visible feedback found\./);
  assert.match(output, /URL: Unknown/);
  assert.match(output, /Title: Untitled/);
});

test('truncates very long feedback items', () => {
  const output = formatAiDigest({
    source: 'GitHub PR',
    url: 'https://github.com/openchamber/openchamber/pull/1',
    title: 'Long note',
    feedback: ['x'.repeat(500)],
  });

  assert.match(output, /x{359}…/);
});

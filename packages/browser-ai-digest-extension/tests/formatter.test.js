import assert from 'node:assert/strict';
import test from 'node:test';

import { formatAiDigest } from '../src/format-digest.js';

test('formats a digest with structured sections', () => {
  const output = formatAiDigest({
    source: 'GitHub PR · openchamber/openchamber#123',
    url: 'https://github.com/openchamber/openchamber/pull/123',
    title: 'Fix clipboard copy flow',
    feedbackItems: [
      {
        comment: 'Please split this into two changes.',
        file: 'packages/browser-ai-digest-extension/src/format-digest.js',
        diff: '@@ -1,2 +1,2 @@\n-old\n+new',
      },
      {
        comment: 'Looks good to me.',
      },
    ],
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
      '- Comment: Please split this into two changes.',
      '  File: packages/browser-ai-digest-extension/src/format-digest.js',
      '  Diff:',
      '    @@ -1,2 +1,2 @@',
      '    -old',
      '    +new',
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

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
      '  ```diff',
      '  @@ -1,2 +1,2 @@',
      '  -old',
      '  +new',
      '  ```',
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

test('normalizes GitLab diff noise into a fenced diff block', () => {
  const output = formatAiDigest({
    source: 'GitLab MR',
    url: 'https://gitlab.com/group/project/-/merge_requests/7',
    title: 'Review draft',
    feedbackItems: [
      {
        comment: 'Please keep the diff readable.',
        file: 'src/example.js',
        diff: '12\n@@ -10,3 +10,3 @@\n10  const oldValue = true;\n11  const nextValue = false;\n12\n\n13  return nextValue;',
      },
    ],
  });

  assert.match(output, /  ```diff\n  @@ -10,3 \+10,3 @@\n  const oldValue = true;\n  const nextValue = false;\n  \n  return nextValue;\n  ```/);
  assert.doesNotMatch(output, /^\s*\d+\s*$/m);
  assert.doesNotMatch(output, /^\s*\d+\s{2,}const/m);
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

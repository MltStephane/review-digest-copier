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
      'You are reviewing the feedback below.',
      '',
      'Context:',
      '- Source: GitHub PR · openchamber/openchamber#123',
      '- URL: https://github.com/openchamber/openchamber/pull/123',
      '- Title: Fix clipboard copy flow',
      '',
      'Instructions:',
      '- Treat the items one by one, without merging unrelated remarks.',
      '- The available items may be incomplete, so treat them as extracted evidence, not a complete transcript.',
      '- If two comments conflict, call it out explicitly and prefer the most specific or blocking one.',
      '- Draft ready-to-post conventional review comment replies at the end.',
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

test('includes review instructions before the digest content', () => {
  const output = formatAiDigest({
    source: 'GitLab MR · group/project!7',
    url: 'https://gitlab.com/group/project/-/merge_requests/7',
    title: 'Review draft',
    feedback: ['Please split unrelated changes.'],
  });

  assert.match(output, /You are reviewing the feedback below\./);
  assert.match(output, /Context:\n- Source: GitLab MR · group\/project!7/);
  assert.match(output, /- Draft ready-to-post conventional review comment replies at the end\./);
});

test('keeps every comment even when the popup preview would only show a truncated subset', () => {
  const output = formatAiDigest({
    source: 'GitLab MR · group/project!99',
    url: 'https://gitlab.com/group/project/-/merge_requests/99',
    title: 'Review draft',
    feedbackItems: [
      { comment: 'First comment.' },
      { comment: 'Second comment.' },
      { comment: 'Third comment.' },
      { comment: 'Fourth comment.' },
      { comment: 'Fifth comment.' },
      { comment: 'Sixth comment.' },
      { comment: 'Seventh comment.' },
      { comment: 'Eighth comment.' },
      { comment: 'Ninth comment.' },
    ],
  });

  assert.match(output, /- First comment\./);
  assert.match(output, /- Ninth comment\./);
  assert.doesNotMatch(output, /No visible feedback found\./);
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

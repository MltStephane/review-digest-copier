import assert from 'node:assert/strict';
import test from 'node:test';

import { isGitLabMergeRequestPage } from '../src/page-digest.js';

test('detects GitLab merge request pages', () => {
  assert.equal(isGitLabMergeRequestPage('https://gitlab.com/group/project/-/merge_requests/7'), true);
  assert.equal(isGitLabMergeRequestPage('https://gitlab.com/group/project/-/issues/7'), false);
  assert.equal(isGitLabMergeRequestPage('https://github.com/openchamber/openchamber/pull/7'), false);
});

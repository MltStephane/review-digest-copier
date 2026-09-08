import assert from 'node:assert/strict';
import test from 'node:test';

import { collectPageDigest, isGitLabMergeRequestPage } from '../src/page-digest.js';

test('detects GitLab merge request pages on gitlab.com and self-hosted instances', () => {
  const restore = mockGlobals({
    document: createMockDocument(),
    location: { href: 'https://gitlab-iliad.mgt.proxad.net/group/project/-/merge_requests/7', hostname: 'gitlab-iliad.mgt.proxad.net' },
  });

  assert.equal(isGitLabMergeRequestPage('https://gitlab.com/group/project/-/merge_requests/7'), true);
  assert.equal(isGitLabMergeRequestPage('https://gitlab-iliad.mgt.proxad.net/group/project/-/merge_requests/7'), true);
  assert.equal(isGitLabMergeRequestPage('https://gitlab.com/group/project/-/issues/7'), false);
  assert.equal(isGitLabMergeRequestPage('https://github.com/openchamber/openchamber/pull/7'), false);

  restore();
});

test('collects self-hosted GitLab feedback with file and diff context when available', () => {
  const title = createMockElement({
    text: 'Harden the review digest copy flow',
    selectors: ['[data-testid="merge-request-title"]', '.detail-page-header h1', '.merge-request-title', '.js-merge-request-title'],
  });

  const fileTitle = createMockElement({
    text: 'packages/browser-ai-digest-extension/src/page-digest.js',
    selectors: ['[data-testid="file-name"]', '[data-testid="file-path"]', '[data-file-path]', '[data-file-name]', '.file-title-name', '.file-title-name a', '.file-header .file-title-name', '.file-header-content .file-title-name', '.diff-file-name', '.file-header-title', '.file-title', '.file-path', '.js-file-title-name', 'a[href*="/blob/"]', 'a[href*="/tree/"]'],
  });

  const diffBlock = createMockElement({
    text: '@@ -10,2 +10,3 @@\n-const oldValue = true;\n+const oldValue = false;\n+const fileContext = getFileContext();',
    selectors: ['[data-testid="diff-content"]', '.diff-content', '.diff-lines', '.file-content', '.blob-viewer', '.line_content', '.diff-line-content', '.code', '.file-body', '.file-holder', '.diff-blob', 'pre', 'code'],
  });

  const noteBody = createMockElement({
    text: 'Please keep the file path in the digest.',
    selectors: ['[data-testid="note-content"]', '.note-body', '.note-text', '.discussion-note .note-text', '.timeline-entry .note-text', '.js-note-body'],
  });

  const noteWrapper = createMockElement({
    selectors: ['.discussion-note'],
    children: [noteBody],
  });

  const fileWrapper = createMockElement({
    children: [title, fileTitle, diffBlock, noteWrapper],
  });

  noteWrapper.parentElement = fileWrapper;
  noteBody.parentElement = noteWrapper;
  title.parentElement = fileWrapper;
  fileTitle.parentElement = fileWrapper;
  diffBlock.parentElement = fileWrapper;

  const restore = mockGlobals({
    document: {
      title: 'Harden the review digest copy flow · !7',
      querySelector(selector) {
        return [title].find((element) => element.matches(selector)) ?? null;
      },
      querySelectorAll(selector) {
        return [noteBody].filter((element) => element.matches(selector));
      },
    },
    location: { href: 'https://gitlab-iliad.mgt.proxad.net/group/project/-/merge_requests/7', hostname: 'gitlab-iliad.mgt.proxad.net' },
  });

  const digest = collectPageDigest();

  assert.equal(digest.source, 'GitLab MR · group/project!7');
  assert.equal(digest.title, 'Harden the review digest copy flow');
  assert.deepEqual(digest.feedbackItems, [
    {
      comment: 'Please keep the file path in the digest.',
      file: 'packages/browser-ai-digest-extension/src/page-digest.js',
      diff: '@@ -10,2 +10,3 @@\n-const oldValue = true;\n+const oldValue = false;\n+const fileContext = getFileContext();',
    },
  ]);
  assert.deepEqual(digest.rawFeedback, ['Please keep the file path in the digest.']);

  restore();
});

test('collectPageDigest works when serialized for chrome.scripting.executeScript', () => {
  const title = createMockElement({
    text: 'Review digest injection regression',
    selectors: ['[data-testid="merge-request-title"]', '.detail-page-header h1', '.merge-request-title', '.js-merge-request-title'],
  });

  const fileTitle = createMockElement({
    text: 'packages/browser-ai-digest-extension/src/'.padEnd(260, 'a') + '.js',
    selectors: ['[data-testid="file-name"]', '[data-testid="file-path"]', '[data-file-path]', '[data-file-name]', '.file-title-name', '.file-title-name a', '.file-header .file-title-name', '.file-header-content .file-title-name', '.diff-file-name', '.file-header-title', '.file-title', '.file-path', '.js-file-title-name', 'a[href*="/blob/"]', 'a[href*="/tree/"]'],
  });

  const diffBlock = createMockElement({
    text: Array.from({ length: 120 }, (_, index) => `+line ${index + 1} with injected digest context`).join('\n'),
    selectors: ['[data-testid="diff-content"]', '.diff-content', '.diff-lines', '.file-content', '.blob-viewer', '.line_content', '.diff-line-content', '.code', '.file-body', '.file-holder', '.diff-blob', 'pre', 'code'],
  });

  const noteBody = createMockElement({
    text: 'Please keep the injected function self-contained.',
    selectors: ['[data-testid="note-content"]', '.note-body', '.note-text', '.discussion-note .note-text', '.timeline-entry .note-text', '.js-note-body'],
  });

  const noteWrapper = createMockElement({
    selectors: ['.discussion-note'],
    children: [noteBody],
  });

  const fileWrapper = createMockElement({
    children: [title, fileTitle, diffBlock, noteWrapper],
  });

  noteWrapper.parentElement = fileWrapper;
  noteBody.parentElement = noteWrapper;
  title.parentElement = fileWrapper;
  fileTitle.parentElement = fileWrapper;
  diffBlock.parentElement = fileWrapper;

  const restore = mockGlobals({
    document: {
      title: 'Review digest injection regression · !8',
      querySelector(selector) {
        return [title].find((element) => element.matches(selector)) ?? null;
      },
      querySelectorAll(selector) {
        return [noteBody].filter((element) => element.matches(selector));
      },
    },
    location: { href: 'https://gitlab-iliad.mgt.proxad.net/group/project/-/merge_requests/8', hostname: 'gitlab-iliad.mgt.proxad.net' },
  });

  const injectedCollectPageDigest = new Function(`return (${collectPageDigest.toString()});`)();
  const digest = injectedCollectPageDigest();

  assert.equal(digest.source, 'GitLab MR · group/project!8');
  assert.equal(digest.feedbackItems[0].file.endsWith('…'), true);
  assert.equal(digest.feedbackItems[0].diff.endsWith('…'), true);
  assert.match(digest.feedbackItems[0].file, /^packages\/browser-ai-digest-extension\/src\//);
  assert.match(digest.feedbackItems[0].diff, /^\+line 1 with injected digest context/);

  restore();
});

function mockGlobals(next) {
  const previous = {
    document: globalThis.document,
    location: globalThis.location,
    window: globalThis.window,
  };

  globalThis.document = next.document;
  globalThis.location = next.location;
  globalThis.window = {
    getComputedStyle() {
      return { display: 'block', visibility: 'visible', opacity: '1' };
    },
    getSelection() {
      return { toString: () => '' };
    },
  };

  return () => {
    globalThis.document = previous.document;
    globalThis.location = previous.location;
    globalThis.window = previous.window;
  };
}

function createMockDocument() {
  return {
    title: 'Merge request',
    querySelector(selector) {
      if (
        selector.includes('[data-testid="merge-request-title"]')
        || selector.includes('.detail-page-header h1')
        || selector.includes('.merge-request-title')
        || selector.includes('.js-merge-request-title')
      ) {
        return {};
      }

      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function createMockElement({ text = '', selectors = [], children = [] } = {}) {
  const element = {
    innerText: text,
    textContent: text,
    children: [],
    parentElement: null,
    selectors: new Set(selectors),
    getClientRects() {
      return [{ width: 1, height: 1 }];
    },
    matches(selector) {
      return selector
        .split(',')
        .map((part) => part.trim())
        .some((part) => this.selectors.has(part));
    },
    querySelector(selector) {
      return findInTree(this.children, selector);
    },
    closest(selector) {
      const selectors = selector.split(',').map((part) => part.trim());
      let current = this;

      while (current) {
        if (selectors.some((part) => current.matches(part))) {
          return current;
        }

        current = current.parentElement;
      }

      return null;
    },
  };

  element.children = children;

  for (const child of children) {
    child.parentElement = element;
  }

  return element;
}

function findInTree(nodes, selector) {
  for (const node of nodes) {
    if (node.matches(selector)) {
      return node;
    }

    const match = node.querySelector(selector);
    if (match) {
      return match;
    }
  }

  return null;
}

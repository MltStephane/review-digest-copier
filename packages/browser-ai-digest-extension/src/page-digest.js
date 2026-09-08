export function isGitLabMergeRequestPage(url = location.href) {
  const parsedUrl = new URL(url);

  if (!/^\/.+\/-\/merge_requests\/\d+/.test(parsedUrl.pathname.replace(/\/+$/, ''))) {
    return false;
  }

  if (parsedUrl.hostname === 'gitlab.com') {
    return true;
  }

  return hasGitLabMergeRequestSignals();
}

function hasGitLabMergeRequestSignals() {
  if (typeof document === 'undefined') {
    return false;
  }

  return Boolean(document.querySelector([
    '[data-testid="merge-request-title"]',
    '[data-testid="title-content"]',
    '.detail-page-header h1',
    'h1[data-testid="title-content"]',
    '.merge-request-title',
    '.js-merge-request-title',
  ].join(',')));
}

export function collectPageDigest() {
  // Self-contained provider detection: must not close over module scope
  // because `chrome.scripting.executeScript({ func: collectPageDigest })`
  // serializes only this function's body. Any external reference
  // (e.g. isGitLabMergeRequestPage defined outside) becomes a
  // ReferenceError in the injected isolated world and makes the popup
  // show “Could not read the current page.”
  function hasGitLabMergeRequestSignalsInternal() {
    if (typeof document === 'undefined') {
      return false;
    }

    return Boolean(document.querySelector([
      '[data-testid="merge-request-title"]',
      '[data-testid="title-content"]',
      '.detail-page-header h1',
      'h1[data-testid="title-content"]',
      '.merge-request-title',
      '.js-merge-request-title',
    ].join(',')));
  }

  function isGitLabMergeRequestPageInternal(url) {
    try {
      const parsedUrl = new URL(url);

      if (!/^\/.+\/-\/merge_requests\/\d+/.test(parsedUrl.pathname.replace(/\/+$/, ''))) {
        return false;
      }

      if (parsedUrl.hostname === 'gitlab.com') {
        return true;
      }

      return hasGitLabMergeRequestSignalsInternal();
    } catch {
      return false;
    }
  }

  function detectProvider(url) {
    if (url.includes('github.com')) {
      return 'github';
    }

    if (isGitLabMergeRequestPageInternal(url)) {
      return 'gitlab';
    }

    return 'unknown';
  }

  function isSupportedReviewPage(provider, url) {
    const path = new URL(url).pathname.replace(/\/+$/, '');

    if (provider === 'github') {
      return /^\/[^/]+\/[^/]+\/pull\/\d+/.test(path);
    }

    if (provider === 'gitlab') {
      return /^\/.+\/-\/merge_requests\/\d+/.test(path);
    }

    return false;
  }

  function getSourceLabel(provider, url) {
    const path = new URL(url).pathname.replace(/\/+$/, '');

    if (provider === 'github') {
      const match = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      return match ? `GitHub PR · ${match[1]}/${match[2]}#${match[3]}` : 'GitHub PR';
    }

    if (provider === 'gitlab') {
      const match = path.match(/^\/(.+)\/-\/merge_requests\/(\d+)/);
      return match ? `GitLab MR · ${match[1]}!${match[2]}` : 'GitLab MR';
    }

    return location.hostname;
  }

  function normalizeText(value) {
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

  function truncateBlockText(value, maxLength) {
    const normalized = String(value ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);

    return (
      style.display !== 'none'
      && style.visibility !== 'hidden'
      && style.opacity !== '0'
      && element.getClientRects().length > 0
    );
  }

  function getPageTitle(provider) {
    const selectors = provider === 'github'
      ? [
          'h1[data-testid="issue-title"]',
          '.gh-header-title .js-issue-title',
          '[data-testid="issue-title"]',
          'h1',
        ]
      : [
          '[data-testid="merge-request-title"]',
          '[data-testid="title-content"]',
          '.detail-page-header h1',
          'h1[data-testid="title-content"]',
          '.merge-request-title',
          '.js-merge-request-title',
          'h1',
        ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const text = normalizeText(getRawVisibleText(element));

      if (text) {
        return text;
      }
    }

    return document.title.replace(/\s+[·|]\s+.*$/, '').trim();
  }

  function getSelectionText() {
    return String(window.getSelection()?.toString() ?? '').trim();
  }

  function collectFeedback(provider) {
    const selectors = provider === 'github'
      ? [
          '[data-testid="comment-body"]',
          '.js-comment-body',
          '.review-comment .comment-body',
          '.timeline-comment .comment-body',
          '.comment-body',
          '.js-timeline-item .comment-body',
        ]
      : [
          '[data-testid="note-content"]',
          '.note-body',
          '.note-text',
          '.discussion-note .note-text',
          '.timeline-entry .note-text',
          '.js-note-body',
        ];

    const feedback = [];
    const seen = new Set();

    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const text = getRawVisibleText(element);
        const normalizedText = normalizeText(text);

        if (!normalizedText || seen.has(normalizedText)) {
          continue;
        }

        seen.add(normalizedText);
        feedback.push(text);

        if (feedback.length >= 8) {
          return feedback;
        }
      }
    }

    return feedback;
  }

  function collectFeedbackItems(provider) {
    if (provider !== 'gitlab') {
      return [];
    }

    const selectors = [
      '[data-testid="note-content"]',
      '.note-body',
      '.note-text',
      '.discussion-note .note-text',
      '.timeline-entry .note-text',
      '.js-note-body',
    ];

    const items = [];
    const seen = new Set();

    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const comment = normalizeText(getRawVisibleText(element));

        if (!comment) {
          continue;
        }

        const context = collectGitLabContext(element);
        const dedupeKey = [comment, context.file, context.diff].join('\u0000');

        if (seen.has(dedupeKey)) {
          continue;
        }

        seen.add(dedupeKey);
        items.push({
          comment,
          file: context.file,
          diff: context.diff,
        });

        if (items.length >= 8) {
          return items;
        }
      }
    }

    return items;
  }

  function collectGitLabContext(element) {
    const root = element.closest(
      'article, li, section, .note, .discussion-note, .timeline-entry, .discussion, .diff-discussion, .note-wrapper, .note-holder',
    ) ?? element.parentElement ?? element;

    const file = findVisibleTextInAncestors(root, [
      '[data-testid="file-name"]',
      '[data-testid="file-path"]',
      '[data-file-path]',
      '[data-file-name]',
      '.file-title-name',
      '.file-title-name a',
      '.file-header .file-title-name',
      '.file-header-content .file-title-name',
      '.diff-file-name',
      '.file-header-title',
      '.file-title',
      '.file-path',
      '.js-file-title-name',
      'a[href*="/blob/"]',
      'a[href*="/tree/"]',
    ], 10);

    const diff = findVisibleBlockTextInAncestors(root, [
      '[data-testid="diff-content"]',
      '.diff-content',
      '.diff-lines',
      '.file-content',
      '.blob-viewer',
      '.line_content',
      '.diff-line-content',
      '.code',
      '.file-body',
      '.file-holder',
      '.diff-blob',
      'pre',
      'code',
    ], 10);

    return {
      file: file ? truncateText(file, 200) : '',
      diff: diff ? truncateBlockText(diff, 900) : '',
    };
  }

  function findVisibleTextInAncestors(element, selectors, maxDepth = 10) {
    let current = element;
    let depth = 0;

    while (current && depth <= maxDepth) {
      for (const selector of selectors) {
        const match = typeof current.matches === 'function' && current.matches(selector)
          ? current
          : current.querySelector(selector);
        const text = normalizeText(getRawVisibleText(match));

        if (text) {
          return text;
        }
      }

      current = current.parentElement;
      depth += 1;
    }

    return '';
  }

  function findVisibleBlockTextInAncestors(element, selectors, maxDepth = 10) {
    let current = element;
    let depth = 0;

    while (current && depth <= maxDepth) {
      for (const selector of selectors) {
        const match = typeof current.matches === 'function' && current.matches(selector)
          ? current
          : current.querySelector(selector);
        const text = String(getRawVisibleText(match) ?? '')
          .replace(/\r\n?/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        if (text) {
          return text;
        }
      }

      current = current.parentElement;
      depth += 1;
    }

    return '';
  }

  function getRawVisibleText(element) {
    if (!element || !isVisible(element)) {
      return '';
    }

    return String(element.innerText || element.textContent || '').trim();
  }

  const provider = detectProvider(location.href);
  const title = getPageTitle(provider);
  const selection = getSelectionText();
  const pageSource = getSourceLabel(provider, location.href);
  const rawFeedback = selection ? [selection] : collectFeedback(provider);
  const feedbackItems = selection ? [] : collectFeedbackItems(provider);
  const rawFeedbackReason = rawFeedback.length > 0
    ? ''
    : (selection
      ? ''
      : isSupportedReviewPage(provider, location.href)
        ? 'No raw feedback blocks were found on this page.'
        : 'Raw feedback is unavailable on this page. Open a GitHub pull request or GitLab merge request, or select the review text first.');

  const source = selection ? `Selected text · ${pageSource}` : pageSource;

  return {
    source,
    url: location.href,
    title,
    feedback: rawFeedback,
    feedbackItems,
    rawFeedback,
    rawFeedbackReason,
  };
}

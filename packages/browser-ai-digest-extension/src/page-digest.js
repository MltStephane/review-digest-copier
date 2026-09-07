export function isGitLabMergeRequestPage(url = location.href) {
  const parsedUrl = new URL(url);

  return parsedUrl.hostname === 'gitlab.com'
    && /^\/.+\/-\/merge_requests\/\d+/.test(parsedUrl.pathname.replace(/\/+$/, ''));
}

export function collectPageDigest() {
  function detectProvider(url) {
    if (url.includes('github.com')) {
      return 'github';
    }

    if (url.includes('gitlab.com')) {
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
          '.detail-page-header h1',
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
    rawFeedback,
    rawFeedbackReason,
  };
}

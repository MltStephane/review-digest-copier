const state = globalThis.__reviewDigestCopierGitLabMrState ??= {
  ready: false,
  observer: null,
};

if (!state.ready) {
  state.ready = true;
  void initialize();
}

async function initialize() {
  const [{ collectGitLabCommentFeedbackItem, collectPageDigest, GITLAB_COMMENT_SELECTORS, isGitLabMergeRequestPage }, { formatAiDigest }] = await Promise.all([
    import(chrome.runtime.getURL('src/page-digest.js')),
    import(chrome.runtime.getURL('src/format-digest.js')),
  ]);

  const buttonId = 'review-digest-copier-gitlab-mr-button';
  const statusId = 'review-digest-copier-gitlab-mr-status';
  const commentButtonClass = 'review-digest-copier-gitlab-comment-button';

  syncButton();

  state.observer = new MutationObserver(() => {
    syncButton();
  });

  state.observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', syncButton, { passive: true });
  window.addEventListener('hashchange', syncButton, { passive: true });
  document.addEventListener('turbo:load', syncButton, { passive: true });
  document.addEventListener('turbo:render', syncButton, { passive: true });
  document.addEventListener('pjax:end', syncButton, { passive: true });

  async function syncButton() {
    const existingButton = document.getElementById(buttonId);
    const shouldShow = isGitLabMergeRequestPage(location.href);

    if (!shouldShow) {
      existingButton?.remove();
      removeCommentButtons();
      removeStatus();
      return;
    }

    const button = existingButton ?? createButton();
    const mountPoint = document.body ?? document.documentElement;

    if (!button.isConnected) {
      mountPoint.appendChild(button);
    }

    syncCommentButtons();
  }

  function createButton() {
    const button = document.createElement('button');
    button.id = buttonId;
    button.type = 'button';
    button.textContent = 'Copy digest';
    button.setAttribute('aria-describedby', statusId);
    button.style.cssText = [
      'position: fixed',
      'right: 16px',
      'bottom: 16px',
      'z-index: 2147483647',
      'padding: 10px 14px',
      'border: 1px solid rgba(31, 41, 55, 0.16)',
      'border-radius: 9999px',
      'background: #111827',
      'color: #fff',
      'font: 600 13px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18)',
      'cursor: pointer',
    ].join('; ');

    button.addEventListener('click', () => {
      void copyDigest(button);
    });

    return button;
  }

  async function copyDigest(button) {
    button.disabled = true;
    setStatus('Collecting digest…');

    try {
      const pageData = await collectPageDigest();
      const digest = formatAiDigest(pageData);
      await navigator.clipboard.writeText(digest);
      setStatus('Copied Review Digest to clipboard.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Copy failed.');
    } finally {
      button.disabled = false;
    }
  }

  function syncCommentButtons() {
    const seenRoots = new Set();

    for (const selector of GITLAB_COMMENT_SELECTORS) {
      for (const element of document.querySelectorAll(selector)) {
        const root = getCommentRoot(element);

        if (
          !root
          || seenRoots.has(root)
          || root.querySelector(`.${commentButtonClass}`)
          || element.nextElementSibling?.classList?.contains(commentButtonClass)
        ) {
          continue;
        }

        seenRoots.add(root);
        const button = createCommentButton(element);
        element.insertAdjacentElement('afterend', button);
      }
    }
  }

  function createCommentButton(commentElement) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = commentButtonClass;
    button.textContent = 'Copy comment';
    button.setAttribute('data-review-digest-copier-comment-button', 'true');
    button.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'margin: 6px 0 0',
      'padding: 4px 8px',
      'border: 1px solid rgba(31, 41, 55, 0.16)',
      'border-radius: 9999px',
      'background: #fff',
      'color: #111827',
      'font: 600 11px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)',
      'cursor: pointer',
    ].join('; ');

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void copyComment(commentElement, button);
    });

    return button;
  }

  async function copyComment(commentElement, button) {
    button.disabled = true;
    setStatus('Collecting comment…');

    try {
      const pageData = await collectPageDigest();
      const feedbackItem = collectGitLabCommentFeedbackItem(commentElement);

      if (!feedbackItem) {
        throw new Error('No comment text found to copy.');
      }

      const digest = formatAiDigest({
        ...pageData,
        source: `Single comment · ${pageData.source ?? 'GitLab MR'}`,
        feedback: [feedbackItem.comment],
        feedbackItems: [feedbackItem],
        rawFeedback: [feedbackItem.comment],
      });

      await navigator.clipboard.writeText(digest);
      setStatus('Copied comment to clipboard.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Comment copy failed.');
    } finally {
      button.disabled = false;
    }
  }

  function getCommentRoot(element) {
    return element.closest(
      'article, li, section, .note, .discussion-note, .timeline-entry, .discussion, .diff-discussion, .note-wrapper, .note-holder',
    ) ?? element.parentElement ?? element;
  }

  function removeCommentButtons() {
    for (const button of document.querySelectorAll(`.${commentButtonClass}`)) {
      button.remove();
    }
  }

  function setStatus(message) {
    let status = document.getElementById(statusId);

    if (!status) {
      status = document.createElement('div');
      status.id = statusId;
      status.setAttribute('aria-live', 'polite');
      status.style.cssText = [
        'position: fixed',
        'right: 16px',
        'bottom: 60px',
        'z-index: 2147483647',
        'max-width: 320px',
        'padding: 8px 10px',
        'border-radius: 8px',
        'background: rgba(17, 24, 39, 0.92)',
        'color: #fff',
        'font: 12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'pointer-events: none',
      ].join('; ');
      (document.body ?? document.documentElement).appendChild(status);
    }

    status.textContent = message;

    window.clearTimeout(state.statusTimer);
    state.statusTimer = window.setTimeout(removeStatus, 2200);
  }

  function removeStatus() {
    const status = document.getElementById(statusId);
    status?.remove();
  }
}

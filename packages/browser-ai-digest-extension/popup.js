import { formatAiDigest } from './src/format-digest.js';
import { collectPageDigest } from './src/page-digest.js';

const copyButton = document.getElementById('copyButton');
const copyRawButton = document.getElementById('copyRawButton');
const status = document.getElementById('status');
const preview = document.getElementById('preview');

let currentDigest = '';
let currentRawFeedback = '';
let currentRawFeedbackReason = '';

copyButton.addEventListener('click', () => {
  void copyDigest();
});

copyRawButton.addEventListener('click', () => {
  void copyRawFeedback();
});

void loadDigestPreview();

async function loadDigestPreview() {
  setLoadingState(true);
  setStatus('Collecting page data…');

  try {
    const pageData = await buildDigest();
    currentDigest = formatAiDigest(pageData);
    currentRawFeedback = joinRawFeedback(pageData.rawFeedback);
    currentRawFeedbackReason = pageData.rawFeedbackReason ?? '';
    renderPreview(currentDigest);
    setStatus(currentRawFeedbackReason ? `Digest ready. ${currentRawFeedbackReason}` : 'Digest ready.');
  } catch (error) {
    currentDigest = '';
    currentRawFeedback = '';
    currentRawFeedbackReason = getErrorMessage(error);
    renderError(error);
  } finally {
    setLoadingState(false);
  }
}

async function copyDigest() {
  if (!currentDigest) {
    setStatus('Wait for the digest preview to finish loading.');
    return;
  }

  try {
    await navigator.clipboard.writeText(currentDigest);
    setStatus('Copied Review Digest to clipboard.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Copy failed.');
  }
}

async function copyRawFeedback() {
  if (!currentRawFeedback) {
    setStatus(currentRawFeedbackReason || 'Raw feedback is unavailable for this page.');
    return;
  }

  try {
    await navigator.clipboard.writeText(currentRawFeedback);
    setStatus('Copied raw feedback to clipboard.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Copy failed.');
  }
}

async function buildDigest() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error('No active tab found.');
  }

  let injectionResults;

  try {
    injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectPageDigest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? '');

    if (/host permission/i.test(message) || /Cannot access/i.test(message) || /No tab with id/i.test(message)) {
      throw new Error(
        'Could not read the current page. The extension has no permission for this host. Check chrome://extensions → Review Digest Copier → Site access, and reload the page.',
      );
    }

    throw new Error(message || 'Could not read the current page.');
  }

  const first = injectionResults?.[0];

  // MV3 returns { result, error } per frame; surface the injected error
  // instead of the generic "Could not read" when the serialized function
  // throws (e.g. stale closure over an out-of-scope helper).
  if (first?.error) {
    const injectedMessage = first.error.message || String(first.error);
    throw new Error(injectedMessage || 'Could not read the current page.');
  }

  if (!first?.result) {
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message || 'Could not read the current page.');
    }

    throw new Error('Could not read the current page.');
  }

  return first.result;
}

function setStatus(message) {
  status.textContent = message;
}

function setLoadingState(isLoading) {
  copyButton.disabled = isLoading || !currentDigest;
  copyRawButton.disabled = isLoading || !currentRawFeedback;
  preview.setAttribute('aria-busy', String(isLoading));
  if (isLoading) {
    preview.dataset.state = 'loading';
    preview.value = 'Loading digest preview…';
  } else if (!currentDigest) {
    copyButton.disabled = true;
    copyRawButton.disabled = true;
  }
}

function renderPreview(digest) {
  preview.dataset.state = 'ready';
  preview.value = digest;
}

function renderError(error) {
  preview.dataset.state = 'error';
  preview.value = `Unable to build the digest preview.\n${getErrorMessage(error)}`;
  setStatus(getErrorMessage(error));
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Preview generation failed.';
}

function joinRawFeedback(rawFeedback) {
  if (!Array.isArray(rawFeedback) || rawFeedback.length === 0) {
    return '';
  }

  return rawFeedback.join('\n\n');
}

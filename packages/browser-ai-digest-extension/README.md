# Review Digest Copier

Minimal unpacked Manifest V3 extension for Chrome/Brave that copies a GitHub PR or GitLab MR review digest to the clipboard.

## Install

1. Open `chrome://extensions` or `brave://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `packages/browser-ai-digest-extension`.

## Use

1. Open a GitHub pull request or GitLab merge request.
2. Optional: select text on the page to use it as the feedback source.
3. On GitLab merge request pages, use the fixed **Copy digest** button on the page.
4. Otherwise, click the extension icon.
5. Press **Copy digest**.

The extension prefers selected text. If nothing is selected, it scrapes visible review/comment text from the current page and formats it as an AI-friendly digest.

## Scripts

```bash
bun run --cwd packages/browser-ai-digest-extension test
bun run --cwd packages/browser-ai-digest-extension lint
```

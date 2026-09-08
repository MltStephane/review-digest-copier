import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('exposes the dynamically imported extension modules to GitLab MR pages', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'),
  );

  assert.deepEqual(manifest.web_accessible_resources, [
    {
      resources: ['src/page-digest.js', 'src/format-digest.js'],
      matches: ['https://*/*', 'http://*/*'],
    },
  ]);
});

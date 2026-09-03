import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getContentType } from '../src/handlers/frontend.js'

test('serves browser image formats with explicit MIME types', () => {
  assert.equal(getContentType('flag.svg'), 'image/svg+xml')
  assert.equal(getContentType('icon.webp?version=1'), 'image/webp')
  assert.equal(getContentType('icon.png'), 'image/png')
  assert.equal(getContentType('legacy.ico'), 'image/x-icon')
})

test('keeps public image assets immutable at the browser edge', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8')

  for (const route of ['/flags/*', '/os-icons/*']) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(
      headers,
      new RegExp(`${escaped}\\s+Cache-Control: public, max-age=31536000, immutable`),
      `${route} should have immutable caching`
    )
  }
})

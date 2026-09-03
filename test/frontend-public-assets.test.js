import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getPublicAssetUrl, resolvePublicAssetUrl } from '../src/frontend/utils/config.js'

test('resolves public assets from a root deployment and ignores hash routes', () => {
  assert.equal(
    resolvePublicAssetUrl('flags/cn.svg', 'https://monitor.example/#/server/1'),
    'https://monitor.example/flags/cn.svg'
  )
  assert.equal(
    resolvePublicAssetUrl('/os-icons/os-debian.svg', 'https://monitor.example/index.html#/server/1'),
    'https://monitor.example/os-icons/os-debian.svg'
  )
})

test('resolves public assets from a GitHub Pages project directory', () => {
  assert.equal(
    resolvePublicAssetUrl('flags/us.svg', 'https://owner.github.io/monitor/'),
    'https://owner.github.io/monitor/flags/us.svg'
  )
  assert.equal(
    resolvePublicAssetUrl('./files/world.zh.json', 'https://owner.github.io/monitor/index.html?preview=1#/map'),
    'https://owner.github.io/monitor/files/world.zh.json'
  )
  assert.equal(
    resolvePublicAssetUrl('', 'https://owner.github.io/monitor/index.html#/'),
    'https://owner.github.io/monitor/'
  )
})

test('getPublicAssetUrl uses document.baseURI when browser globals are available', () => {
  const previousDocument = globalThis.document
  globalThis.document = { baseURI: 'https://owner.github.io/cfmonitor/#/detail' }

  try {
    assert.equal(
      getPublicAssetUrl('os-icons/os-alpine.webp'),
      'https://owner.github.io/cfmonitor/os-icons/os-alpine.webp'
    )
  } finally {
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
  }
})

test('public image component declares the reliability contract in its SFC', async () => {
  const componentUrl = new URL('../src/frontend/components/PublicAssetImage.vue', import.meta.url)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /getPublicAssetUrl\(source\)/)
  assert.match(source, /watch\(\[resolvedSrc, \(\) => props\.alt\]/)
  assert.match(source, /failedSrc\.value = resolvedSrc\.value/)
  assert.match(source, /:loading="loading"/)
  assert.match(source, /:decoding="decoding"/)
  assert.match(source, /v-bind="\$attrs"/)
  assert.match(source, /<slot name="fallback"/)
})

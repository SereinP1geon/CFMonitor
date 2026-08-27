#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(rootDir, 'themes/mynt')
const assetsDir = path.join(outputDir, 'assets')

assert.equal(fs.existsSync(outputDir), true, 'themes/mynt must exist after the build')
assert.deepEqual(
  fs.readdirSync(outputDir).sort(),
  ['assets', 'index.html'],
  'published theme root must contain only index.html and assets/'
)
assert.equal(fs.statSync(assetsDir).isDirectory(), true)

const indexHtml = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8')
assert.match(indexHtml, /assets\//, 'index.html must reference bundled assets')
assert.doesNotMatch(indexHtml, /(?:src|href)=["']\/src\//, 'source paths must not leak into the build')
assert.doesNotMatch(indexHtml, /(?:src|href)=["']\/static\//, 'legacy static paths must not be emitted')

for (const filename of ['GPL-3.0.txt', 'NOTICE.txt', 'OFL-1.1.txt', 'MDI-LICENSE.txt']) {
  const fullPath = path.join(assetsDir, 'licenses', filename)
  assert.equal(fs.existsSync(fullPath), true, `missing published license: ${filename}`)
}

const generatedFiles = fs.readdirSync(assetsDir, { recursive: true })
assert.equal(generatedFiles.some(filename => String(filename).endsWith('.map')), false, 'release must not contain source maps')
assert.equal(generatedFiles.some(filename => /^Poppins-Regular-.*\.ttf$/.test(String(filename))), true, 'Poppins must be self-hosted')

for (const filename of generatedFiles.filter(filename => String(filename).endsWith('.js'))) {
  const source = fs.readFileSync(path.join(assetsDir, String(filename)), 'utf8')
  assert.match(source, /CFMonitor MYNT - GPL-3\.0-or-later/, `missing GPL banner: ${filename}`)
}

console.log('MYNT theme artifact verified:', outputDir)

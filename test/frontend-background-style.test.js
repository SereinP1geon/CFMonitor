import assert from 'node:assert/strict'
import test from 'node:test'

import { buildBackgroundStyle } from '../src/utils/csp.js'

test('iOS custom backgrounds stay on body and avoid hidden pseudo-elements', () => {
  const style = buildBackgroundStyle('https://cdn.example/desktop.webp')

  assert.match(style, /@supports \(-webkit-touch-callout: none\)/)
  assert.match(style, /background-attachment:scroll !important/)
  assert.match(style, /background-position:center top !important/)
  assert.doesNotMatch(style, /body::after/)
  assert.doesNotMatch(style, /position:fixed/)
})

test('iOS mobile background overrides the desktop image inside the phone media query', () => {
  const style = buildBackgroundStyle(
    'https://cdn.example/desktop.webp',
    'https://cdn.example/mobile.webp'
  )

  assert.match(
    style,
    /@supports \(-webkit-touch-callout: none\)[\s\S]*@media \(max-width: 767px\)\{body\{[^}]*mobile\.webp[^}]*background-attachment:scroll !important/
  )
})

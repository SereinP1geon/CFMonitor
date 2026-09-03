import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DEFAULT_MYNT_OPTIONS,
  clearStoredMyntPreferences,
  getContrastTextColor,
  LOCAL_STORAGE_KEY,
  MYNT_STORAGE_KEYS,
  PRESET_ACCENTS,
  mergeMyntThemeOptions,
  normalizeLocalPreferences,
  normalizeMyntOptions,
  readStoredMyntPreferences,
  resolveMyntPreferences
} from '../theme-src/mynt/src/utils/themePreferences.js'

test('normalizes valid accents to upper-case and applies the stable defaults', () => {
  assert.deepEqual(normalizeMyntOptions({
    schema: 99,
    accent: '#aBcDeF',
    colorMode: 'dark',
    ignored: true
  }), {
    schema: 1,
    accent: '#ABCDEF',
    colorMode: 'dark'
  })

  assert.deepEqual(normalizeMyntOptions(null), DEFAULT_MYNT_OPTIONS)
  assert.deepEqual(normalizeMyntOptions({ accent: '#abc', colorMode: 'auto' }), DEFAULT_MYNT_OPTIONS)
  assert.deepEqual(normalizeMyntOptions({ accent: '#GGGGGG', colorMode: 'sepia' }), DEFAULT_MYNT_OPTIONS)
  assert.deepEqual(normalizeMyntOptions({ accent: 42, colorMode: null }), DEFAULT_MYNT_OPTIONS)
})

test('exports canonical preset accents and a versioned local storage key', () => {
  assert.equal(PRESET_ACCENTS.includes(DEFAULT_MYNT_OPTIONS.accent), true)
  assert.equal(PRESET_ACCENTS.every(value => /^#[0-9A-F]{6}$/.test(value)), true)
  assert.equal(typeof LOCAL_STORAGE_KEY, 'string')
  assert.match(LOCAL_STORAGE_KEY, /-v\d+$/)
})

test('reads current and legacy localStorage JSON without browser globals', () => {
  const values = new Map([
    [LOCAL_STORAGE_KEY, JSON.stringify({ accent: '#0aBcDe', colorMode: 'auto' })]
  ])
  const storage = { getItem: key => values.get(key) ?? null }

  assert.deepEqual(normalizeLocalPreferences(storage), {
    schema: 1,
    accent: '#0ABCDE',
    colorMode: 'system'
  })

  const legacyStorage = {
    getItem: key => key === 'mynt-theme' ? JSON.stringify({ theme: 'light' }) : null
  }
  assert.deepEqual(normalizeLocalPreferences(legacyStorage), {
    ...DEFAULT_MYNT_OPTIONS,
    colorMode: 'light'
  })

  assert.deepEqual(normalizeLocalPreferences('{not-json'), DEFAULT_MYNT_OPTIONS)
  assert.deepEqual(normalizeLocalPreferences('dark'), {
    ...DEFAULT_MYNT_OPTIONS,
    colorMode: 'dark'
  })
  assert.deepEqual(normalizeLocalPreferences({ accent: '#123456', colorMode: 'light' }), {
    schema: 1,
    accent: '#123456',
    colorMode: 'light'
  })
})

test('invalid stored fields fall through to site defaults and clearing removes legacy keys', () => {
  const values = new Map([
    [LOCAL_STORAGE_KEY, JSON.stringify({ accent: '#bad', colorMode: 'sepia' })],
    ['mynt-theme', JSON.stringify({ accent: '#123456', theme: 'dark' })]
  ])
  const storage = {
    getItem: key => values.get(key) ?? null,
    removeItem: key => values.delete(key)
  }

  assert.equal(readStoredMyntPreferences(storage), null)
  assert.deepEqual(resolveMyntPreferences(readStoredMyntPreferences(storage), {
    accent: '#654321',
    colorMode: 'light'
  }), {
    schema: 1,
    accent: '#654321',
    colorMode: 'light'
  })

  clearStoredMyntPreferences(storage)
  assert.equal(MYNT_STORAGE_KEYS.every(key => !values.has(key)), true)
})

test('resolves each field local > remote > default', () => {
  assert.deepEqual(resolveMyntPreferences(
    { accent: '#aa00bb', colorMode: 'light' },
    { accent: '#112233', colorMode: 'dark' }
  ), {
    schema: 1,
    accent: '#AA00BB',
    colorMode: 'light'
  })

  assert.deepEqual(resolveMyntPreferences(
    { accent: 'invalid' },
    { accent: '#112233', colorMode: 'dark' }
  ), {
    schema: 1,
    accent: '#112233',
    colorMode: 'dark'
  })

  assert.deepEqual(resolveMyntPreferences(undefined, undefined), DEFAULT_MYNT_OPTIONS)
})

test('replaces only mynt and retains unknown theme options and config keys', () => {
  const themeOptions = {
    otherTheme: { enabled: true },
    legacy: 'keep-me',
    mynt: { accent: '#111111', stale: 'replace-me' }
  }
  const snapshot = structuredClone(themeOptions)
  const merged = mergeMyntThemeOptions(themeOptions, {
    accent: '#abcdef',
    colorMode: 'dark'
  })

  assert.deepEqual(merged, {
    otherTheme: { enabled: true },
    legacy: 'keep-me',
    mynt: {
      schema: 1,
      accent: '#ABCDEF',
      colorMode: 'dark'
    }
  })
  assert.deepEqual(themeOptions, snapshot)

  const config = {
    site_title: 'Monitor',
    theme_options: { other: 1 }
  }
  const configSnapshot = structuredClone(config)
  assert.deepEqual(mergeMyntThemeOptions(config, { accent: '#0f0f0f' }), {
    site_title: 'Monitor',
    theme_options: {
      other: 1,
      mynt: { ...DEFAULT_MYNT_OPTIONS, accent: '#0F0F0F' }
    }
  })
  assert.deepEqual(config, configSnapshot)
})

test('normalization and resolution never mutate input objects', () => {
  const local = { mynt: { accent: '#aa11cc', colorMode: 'dark' } }
  const remote = { theme_options: { mynt: { accent: '#001122', colorMode: 'light' } } }
  const localSnapshot = structuredClone(local)
  const remoteSnapshot = structuredClone(remote)

  normalizeMyntOptions(local)
  normalizeLocalPreferences(local)
  resolveMyntPreferences(local, remote)

  assert.deepEqual(local, localSnapshot)
  assert.deepEqual(remote, remoteSnapshot)
})

test('selects readable neutral text for bright and dark accents', () => {
  assert.equal(getContrastTextColor('#FFFFFF'), '#111318')
  assert.equal(getContrastTextColor('#000000'), '#FFFFFF')
})

test('keeps an iOS 15 compatible theme fallback and build target', async () => {
  const [tokens, styles, viteConfig] = await Promise.all([
    readFile(new URL('../theme-src/mynt/src/styles/tokens.css', import.meta.url), 'utf8'),
    readFile(new URL('../theme-src/mynt/src/styles/mynt.css', import.meta.url), 'utf8'),
    readFile(new URL('../theme-src/mynt/vite.config.js', import.meta.url), 'utf8')
  ])

  assert.match(tokens, /@supports not \(color: color-mix/)
  assert.match(styles, /-webkit-backdrop-filter:/)
  assert.match(styles, /background-attachment:\s*scroll/)
  assert.match(styles, /env\(safe-area-inset-bottom\)/)
  assert.match(viteConfig, /target:\s*\['es2020', 'safari15'\]/)
})

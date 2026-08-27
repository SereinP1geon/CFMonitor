/**
 * Pure helpers for the MYNT theme preferences.
 *
 * The helpers intentionally accept plain values (and, for local preferences,
 * a small localStorage-like object) so that the theme can use the same rules
 * in the browser and in Node-based tests without importing browser globals.
 */

export const DEFAULT_MYNT_OPTIONS = Object.freeze({
  schema: 1,
  accent: '#4382EC',
  colorMode: 'system'
})

/**
 * Preset Material You accents shown by the theme settings panel.
 * Keep this as an array of canonical, upper-case hex strings so consumers can
 * use it directly as the value of a color input or CSS variable.
 */
export const PRESET_ACCENTS = Object.freeze([
  '#4382EC',
  '#6750A4',
  '#006A6A',
  '#0061A4',
  '#7D5260',
  '#BA1A1A',
  '#7D5700'
])

/** Versioned so a future preference shape can be migrated without ambiguity. */
export const LOCAL_STORAGE_KEY = 'cfmonitor-mynt-preferences-v1'

const LEGACY_STORAGE_KEYS = Object.freeze([
  'cfmonitor-mynt-preferences',
  'mynt-preferences',
  'mynt-theme'
])

export const MYNT_STORAGE_KEYS = Object.freeze([
  LOCAL_STORAGE_KEY,
  ...LEGACY_STORAGE_KEYS
])

const HEX_ACCENT = /^#[0-9a-fA-F]{6}$/
const COLOR_MODES = new Set(['system', 'light', 'dark'])
const LEGACY_COLOR_MODES = new Map([
  ['auto', 'system'],
  ['system', 'system'],
  ['light', 'light'],
  ['dark', 'dark']
])

const isRecord = value => (
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value)
)

const cloneDefaultOptions = () => ({ ...DEFAULT_MYNT_OPTIONS })

const normalizeAccent = value => (
  typeof value === 'string' && HEX_ACCENT.test(value)
    ? value.toUpperCase()
    : null
)

const normalizeColorMode = (value, allowLegacy = false) => {
  if (typeof value !== 'string') return null
  if (COLOR_MODES.has(value)) return value
  if (allowLegacy) return LEGACY_COLOR_MODES.get(value) || null
  return null
}

/**
 * Unwrap the shapes that have been used by theme configuration and by older
 * versions of the theme. The returned object is never the caller's object.
 */
const unwrapOptions = (value, allowLegacy = false) => {
  if (!isRecord(value)) {
    if (allowLegacy && typeof value === 'string') {
      const legacyColorMode = normalizeColorMode(value, true)
      return legacyColorMode ? { colorMode: legacyColorMode } : {}
    }
    return {}
  }

  // `/api/config` exposes the complete map as `theme_options`; callers may
  // pass that envelope directly to make the helper easier to use.
  if (isRecord(value.theme_options)) {
    const nested = isRecord(value.theme_options.mynt)
      ? value.theme_options.mynt
      : value.theme_options
    return { ...nested }
  }

  if (isRecord(value.mynt)) return { ...value.mynt }

  // A couple of early local builds stored the preferences under one of these
  // generic wrappers. Supporting them is harmless for current values.
  if (allowLegacy && isRecord(value.preferences)) return { ...value.preferences }
  if (allowLegacy && isRecord(value.options)) return { ...value.options }

  const result = { ...value }
  if (allowLegacy && !Object.prototype.hasOwnProperty.call(result, 'colorMode')) {
    const legacyMode = normalizeColorMode(result.mode ?? result.theme, true)
    if (legacyMode) result.colorMode = legacyMode
  } else if (allowLegacy && result.colorMode === 'auto') {
    result.colorMode = 'system'
  }
  return result
}

/**
 * Return only valid fields supplied by `value`. This is used by the resolver
 * to retain per-field precedence when one source is partial or malformed.
 */
const validFields = (value, allowLegacy = false) => {
  const source = unwrapOptions(value, allowLegacy)
  const result = {}
  const accent = normalizeAccent(source.accent)
  const colorMode = normalizeColorMode(source.colorMode, allowLegacy)

  if (accent) result.accent = accent
  if (colorMode) result.colorMode = colorMode
  return result
}

/**
 * Normalize a MYNT option object to the stable, complete schema.
 * Unknown fields are ignored deliberately: they belong to the outer
 * `theme_options` namespace and are preserved by mergeMyntThemeOptions.
 */
export const normalizeMyntOptions = value => {
  const fields = validFields(value)
  return {
    ...cloneDefaultOptions(),
    ...fields
  }
}

const parseStoredValue = value => {
  if (typeof value !== 'string') return value
  const raw = value.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // Older builds could store the mode as a bare string rather than JSON.
    return raw
  }
}

const readStorageValue = storage => {
  if (!storage || typeof storage.getItem !== 'function') return storage

  for (const key of MYNT_STORAGE_KEYS) {
    let value
    try {
      value = storage.getItem(key)
    } catch {
      continue
    }
    if (value !== null && value !== undefined && value !== '') return value
  }
  return null
}

/**
 * Read and normalize local preferences. It accepts either a raw localStorage
 * value, a parsed preference object, or a localStorage-like object. Invalid or
 * missing values safely resolve to the built-in defaults.
 */
export const normalizeLocalPreferences = value => {
  const parsed = parseStoredValue(readStorageValue(value))
  return {
    ...cloneDefaultOptions(),
    ...validFields(parsed, true)
  }
}

/**
 * Read a persisted local override without manufacturing default values for
 * invalid or partial data. This lets the resolver fall through field-by-field
 * to site defaults when a legacy entry is malformed.
 */
export const readStoredMyntPreferences = storage => {
  const stored = readStorageValue(storage)
  if (stored === null || stored === undefined || stored === '') return null

  const fields = validFields(parseStoredValue(stored), true)
  if (Object.keys(fields).length === 0) return null
  return { schema: DEFAULT_MYNT_OPTIONS.schema, ...fields }
}

/** Remove the current key and every supported legacy key. */
export const clearStoredMyntPreferences = storage => {
  if (!storage || typeof storage.removeItem !== 'function') return
  for (const key of MYNT_STORAGE_KEYS) {
    try {
      storage.removeItem(key)
    } catch {
      // Storage can be disabled by browser privacy policy; clearing remains
      // best-effort and the in-memory preference is still reset by the caller.
    }
  }
}

/**
 * Resolve preferences by field with local values taking precedence over the
 * remote site configuration, and defaults filling any missing/invalid field.
 * Both inputs are treated as read-only.
 */
export const resolveMyntPreferences = (local, remote) => ({
  ...cloneDefaultOptions(),
  ...validFields(remote),
  ...validFields(local, true)
})

/**
 * Replace only the `mynt` entry in a theme-options map while retaining every
 * other theme key. For convenience, a complete config envelope containing a
 * `theme_options` map is accepted too and is cloned at both levels.
 */
export const mergeMyntThemeOptions = (themeOptions, myntOptions) => {
  const normalized = normalizeMyntOptions(myntOptions)

  if (isRecord(themeOptions) && isRecord(themeOptions.theme_options)) {
    return {
      ...themeOptions,
      theme_options: {
        ...themeOptions.theme_options,
        mynt: normalized
      }
    }
  }

  return {
    ...(isRecord(themeOptions) ? themeOptions : {}),
    mynt: normalized
  }
}

/** Return the higher-contrast neutral text color for an arbitrary accent. */
export const getContrastTextColor = accent => {
  const normalized = normalizeAccent(accent) || DEFAULT_MYNT_OPTIONS.accent
  const channels = normalized.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255)
  const linear = channels.map(value => (
    value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  ))
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  const whiteContrast = 1.05 / (luminance + 0.05)
  const darkContrast = (luminance + 0.05) / 0.056
  return whiteContrast >= darkContrast ? '#FFFFFF' : '#111318'
}

export default {
  DEFAULT_MYNT_OPTIONS,
  PRESET_ACCENTS,
  LOCAL_STORAGE_KEY,
  MYNT_STORAGE_KEYS,
  normalizeMyntOptions,
  normalizeLocalPreferences,
  readStoredMyntPreferences,
  clearStoredMyntPreferences,
  resolveMyntPreferences,
  mergeMyntThemeOptions,
  getContrastTextColor
}

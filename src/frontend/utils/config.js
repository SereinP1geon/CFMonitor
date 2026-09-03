let apiBases = []
let wsBase = null
let title = ''
let configuredApiBase = false

const stripTrailingSlash = (s) => String(s || '').replace(/\/+$/, '')

const computeWsBase = (origin) => {
  try {
    const u = new URL(origin)
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${u.host}`
  } catch (_) {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }
}

const setApiBases = (values) => {
  apiBases = values.map(v => stripTrailingSlash(v)).filter(v => v)
  if (apiBases.length === 0) {
    apiBases = [stripTrailingSlash(window.location.origin)]
  }
  wsBase = computeWsBase(apiBases[0])
  window.__APP_API_BASES__ = apiBases
  window.__APP_WS_BASE__ = wsBase
}

export const initConfig = async () => {
  configuredApiBase = false
  setApiBases([window.location.origin])

  // GitHub Pages/static builds inject runtime config through meta tags.
  const metaApiBase = document.querySelector('meta[name="apiBase"]')?.content
  if (metaApiBase) {
    const bases = metaApiBase.split(',').map(s => s.trim()).filter(Boolean)
    if (bases.length > 0) {
      configuredApiBase = true
      setApiBases(bases)
    }
  }

  title = document.title || ''

  return apiBases
}

export const getApiBases = () => {
  if (apiBases.length > 0) return apiBases
  if (window.__APP_API_BASES__?.length > 0) return window.__APP_API_BASES__
  return [stripTrailingSlash(window.location.origin)]
}

export const getWsBase = () => {
  if (wsBase) return wsBase
  if (window.__APP_WS_BASE__) return window.__APP_WS_BASE__
  return computeWsBase(getApiBases()[0])
}

export const hasMultipleApiBases = () => {
  return getApiBases().length > 1
}

export const hasConfiguredApiBase = () => configuredApiBase

export const getTitle = () => title

const getRuntimeBaseUri = () => {
  if (typeof document !== 'undefined' && document.baseURI) return document.baseURI
  if (typeof window !== 'undefined' && window.location?.href) return window.location.href
  return ''
}

/**
 * Resolve a public asset against the directory containing the current document.
 *
 * Using the document directory instead of location.pathname keeps the result
 * stable on hash routes and also honours a <base> element when a static build is
 * deployed below a GitHub Pages project path.
 */
export const resolvePublicAssetUrl = (assetPath, baseUri = '') => {
  const rawPath = String(assetPath || '')
  const cleanPath = rawPath.replace(/^\/+/, '')
  const relativePath = cleanPath || '.'
  const resolvedBaseUri = String(baseUri || getRuntimeBaseUri())

  if (!resolvedBaseUri) return cleanPath ? `./${cleanPath}` : './'

  try {
    const deploymentDirectory = new URL('.', resolvedBaseUri)
    return new URL(relativePath, deploymentDirectory).href
  } catch (_) {
    return cleanPath ? `./${cleanPath}` : './'
  }
}

export const getPublicAssetUrl = (assetPath) => resolvePublicAssetUrl(assetPath)

export default {
  initConfig,
  getApiBases,
  getWsBase,
  hasMultipleApiBases,
  hasConfiguredApiBase,
  getTitle,
  resolvePublicAssetUrl,
  getPublicAssetUrl
}

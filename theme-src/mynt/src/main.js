/*
 * CFMonitor MYNT Theme
 * Derived from CF-Server-Monitor (MIT) and Material You New Tab (GPLv3+).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import '@cf/styles/main.css'
import '@cf/styles/light.css'
import './styles/tokens.css'
import './styles/mynt.css'
import { initConfig, hasMultipleApiBases } from '@cf/utils/config.js'
import { http } from '@cf/utils/http.js'
import { VERSION, LAST_AGENT_VERSION, LAST_WORKERS_VERSION, normalizeLiveSocketTimeoutMinutes } from '@cf/utils/api.js'
import { resolveDisplayMode } from '@cf/utils/displayMode.js'
import { normalizeThemeOptions } from '@cf/utils/themeOptions.js'
import {
  clearTurnstileToken,
  fetchAllTurnstileConfigs,
  getTurnstileEnabledSites,
  hasTurnstileSiteKeyMismatch,
  isTurnstileValueEnabled,
  loadTurnstileScript,
  setTurnstileToken
} from '@cf/utils/turnstile.js'

const DEFAULT_CONFIG = Object.freeze({
  turnstile_enabled: false,
  turnstile_login_enabled: false,
  turnstile_site_key: '',
  turnstile_api_index: 0,
  version: '',
  last_workers_version: '',
  last_agent_version: '',
  verified: false,
  is_public: true,
  authorization: false,
  site_title: 'CFMonitor',
  display_mode: 'bar',
  frontend_ws_timeout_minutes: 0,
  theme_options: {}
})

const normalizeConfig = (data = {}) => ({
  ...DEFAULT_CONFIG,
  ...data,
  turnstile_enabled: isTurnstileValueEnabled(data.turnstile_enabled),
  turnstile_login_enabled: isTurnstileValueEnabled(data.turnstile_login_enabled),
  is_public: data.is_public !== false,
  authorization: data.authorization === true,
  verified: data.verified === true,
  display_mode: resolveDisplayMode(data),
  frontend_ws_timeout_minutes: normalizeLiveSocketTimeoutMinutes(data.frontend_ws_timeout_minutes),
  theme_options: normalizeThemeOptions(data.theme_options)
})

const applyVersionRefs = (config) => {
  if (config.version) VERSION.value = config.version
  LAST_WORKERS_VERSION.value = config.last_workers_version || ''
  LAST_AGENT_VERSION.value = config.last_agent_version || ''
}

const fetchSingleConfig = async () => {
  const result = await http.get('/api/config', {
    includeAuth: true,
    includeTurnstile: true,
    autoRedirect: false
  })
  return result.error || !result.data ? { ...DEFAULT_CONFIG } : normalizeConfig(result.data)
}

const fetchMultiConfig = async () => {
  const results = await fetchAllTurnstileConfigs()
  const available = results.filter((result) => !result.error && result.data)
  const first = available[0]
  if (!first) return { ...DEFAULT_CONFIG, site_configs: [] }

  const turnstileSites = getTurnstileEnabledSites(results, 'global')
  const sharedTurnstileSite = turnstileSites[0] || null
  const privateSites = available.filter((result) => result.data.is_public === false)
  const config = normalizeConfig({
    ...first.data,
    is_public: privateSites.length === 0,
    authorization: privateSites.every((result) => result.data.authorization === true),
    turnstile_enabled: !!sharedTurnstileSite,
    turnstile_site_key: sharedTurnstileSite?.siteKey || first.data.turnstile_site_key || '',
    turnstile_api_index: sharedTurnstileSite?.index || 0,
    verified: sharedTurnstileSite
      ? turnstileSites.every((site) => site.verified)
      : first.data.verified === true
  })
  config.site_configs = results.map((result) => (!result.error && result.data ? result.data : null))
  config.turnstile_key_mismatch = hasTurnstileSiteKeyMismatch(turnstileSites)
  return config
}

const renderStartupError = (title, description) => {
  const loading = document.getElementById('loading')
  if (!loading) return
  loading.className = 'mynt-boot mynt-boot-error'
  loading.innerHTML = `<strong>${title}</strong><small>${description}</small>`
}

const verifyTurnstile = async (config) => {
  if (!config.turnstile_enabled || config.verified || !config.turnstile_site_key) return true
  const loading = document.getElementById('loading')
  if (!loading) return false
  loading.innerHTML = '<strong>Verification required</strong><div id="turnstile-container"></div><small>Complete the check to continue.</small>'

  try {
    await loadTurnstileScript()
    return await new Promise((resolve) => {
      window.turnstile.render('#turnstile-container', {
        sitekey: config.turnstile_site_key,
        callback: async (token) => {
          setTurnstileToken(token)
          const result = await http.getByIndex('/api/config', config.turnstile_api_index || 0, {
            includeAuth: false,
            includeTurnstile: true,
            autoRedirect: false
          })
          resolve(!result.error && result.data?.verified === true)
        },
        errorCallback: () => resolve(false),
        expiredCallback: () => {
          clearTurnstileToken()
          resolve(false)
        }
      })
    })
  } catch (error) {
    console.error('Turnstile initialization failed:', error)
    return false
  }
}

const initApp = async () => {
  await initConfig()

  let config
  try {
    config = hasMultipleApiBases() ? await fetchMultiConfig() : await fetchSingleConfig()
  } catch (error) {
    console.error('Failed to load CFMonitor configuration:', error)
    config = { ...DEFAULT_CONFIG }
  }
  applyVersionRefs(config)

  // Prevent the built-in Mikus overlay from leaking into this independent
  // theme while preserving the unmodified map for lossless settings writes.
  config.raw_theme_options = { ...(config.theme_options || {}) }
  config.theme_options = { ...config.raw_theme_options, mikus: false }

  if (config.turnstile_key_mismatch && config.is_public) {
    renderStartupError('Turnstile configuration mismatch', 'The configured sites do not share the same site key.')
    return
  }

  if (!(await verifyTurnstile(config))) {
    renderStartupError('Verification failed', 'Refresh the page to try again.')
    return
  }

  if (!config.is_public && !config.authorization) {
    window.location.replace('/admin#admin')
    return
  }

  const app = createApp(App)
  app.provide('appConfig', config)
  app.use(router)
  app.mount('#app')

  requestAnimationFrame(() => {
    document.documentElement.classList.add('mynt-ready')
    window.setTimeout(() => document.getElementById('loading')?.remove(), 360)
  })
}

initApp()

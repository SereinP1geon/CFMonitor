<template>
  <div class="mynt-app-shell">
    <router-view v-slot="{ Component, route }">
      <transition name="mynt-route" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <button
      type="button"
      class="mynt-theme-fab"
      :aria-label="appearanceLabel"
      @click="drawerOpen = true"
    >
      <MyntIcon name="palette" decorative />
    </button>

    <ThemeDrawer
      :open="drawerOpen"
      :preferences="preferences"
      :site-defaults="siteDefaults"
      :can-save="canSaveDefaults"
      :saving="savingDefaults"
      :save-feedback="saveFeedback"
      @close="drawerOpen = false"
      @update-preferences="updatePreferences"
      @save-defaults="saveDefaults"
      @reset-local="resetLocalPreferences"
    />
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { http } from '@cf/utils/http.js'
import { currentLang } from '@cf/utils/i18n.js'
import MyntIcon from './components/MyntIcon.vue'
import ThemeDrawer from './components/ThemeDrawer.vue'
import {
  DEFAULT_MYNT_OPTIONS,
  clearStoredMyntPreferences,
  getContrastTextColor,
  LOCAL_STORAGE_KEY,
  mergeMyntThemeOptions,
  normalizeLocalPreferences,
  normalizeMyntOptions,
  readStoredMyntPreferences,
  resolveMyntPreferences
} from './utils/themePreferences.js'

const appConfig = inject('appConfig', {})
const drawerOpen = ref(false)
const savingDefaults = ref(false)
const saveFeedback = ref(null)
const siteDefaults = ref(normalizeMyntOptions(appConfig?.theme_options?.mynt))

const readLocalPreferences = () => {
  try {
    return readStoredMyntPreferences(localStorage)
  } catch (_) {
    return null
  }
}

const localPreferences = ref(readLocalPreferences())
const preferences = ref(resolveMyntPreferences(localPreferences.value, siteDefaults.value))
const canSaveDefaults = computed(() => appConfig?.authorization === true)
const appearanceLabel = computed(() => currentLang.value === 'zh' ? '打开外观设置' : 'Open appearance settings')
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

const applyPreferences = (value) => {
  const normalized = normalizeMyntOptions(value)
  const resolvedMode = normalized.colorMode === 'system'
    ? (systemDark.matches ? 'dark' : 'light')
    : normalized.colorMode
  document.documentElement.dataset.myntColorMode = normalized.colorMode
  document.documentElement.dataset.myntResolvedMode = resolvedMode
  document.documentElement.style.setProperty('--mynt-seed', normalized.accent)
  document.documentElement.style.setProperty('--mynt-on-primary', getContrastTextColor(normalized.accent))
  document.body.classList.toggle('light', resolvedMode === 'light')
  localStorage.setItem('theme_preference', normalized.colorMode === 'system' ? 'auto' : normalized.colorMode)
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    resolvedMode === 'dark' ? '#171615' : '#BBD6FD'
  )
}

const updatePreferences = (next) => {
  saveFeedback.value = null
  const normalized = normalizeLocalPreferences({ ...preferences.value, ...next })
  localPreferences.value = normalized
  preferences.value = resolveMyntPreferences(normalized, siteDefaults.value)
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized))
  applyPreferences(preferences.value)
}

const resetLocalPreferences = () => {
  clearStoredMyntPreferences(localStorage)
  saveFeedback.value = null
  localPreferences.value = null
  preferences.value = resolveMyntPreferences(null, siteDefaults.value)
  applyPreferences(preferences.value)
}

const saveDefaults = async () => {
  if (!canSaveDefaults.value || savingDefaults.value) return
  savingDefaults.value = true
  saveFeedback.value = null
  try {
    const themeOptions = mergeMyntThemeOptions(appConfig?.raw_theme_options || appConfig?.theme_options, preferences.value)
    const result = await http.post('/api/theme_options', { theme_options: themeOptions }, { autoRedirect: false })
    if (result.error) {
      saveFeedback.value = {
        tone: 'error',
        message: currentLang.value === 'zh'
          ? `保存站点默认失败：${result.error}`
          : `Could not save site defaults: ${result.error}`
      }
      return
    }
    appConfig.raw_theme_options = result.data?.theme_options || themeOptions
    appConfig.theme_options = { ...appConfig.raw_theme_options, mikus: false }
    siteDefaults.value = normalizeMyntOptions(appConfig.raw_theme_options.mynt)
    saveFeedback.value = {
      tone: 'success',
      message: currentLang.value === 'zh' ? '站点默认设置已保存。' : 'Site defaults saved.'
    }
  } catch (error) {
    const reason = error?.message || (currentLang.value === 'zh' ? '未知错误' : 'Unknown error')
    saveFeedback.value = {
      tone: 'error',
      message: currentLang.value === 'zh' ? `保存站点默认失败：${reason}` : `Could not save site defaults: ${reason}`
    }
  } finally {
    savingDefaults.value = false
  }
}

const handleSystemTheme = () => {
  if (preferences.value.colorMode === 'system') applyPreferences(preferences.value)
}

onMounted(() => {
  applyPreferences(preferences.value || DEFAULT_MYNT_OPTIONS)
  systemDark.addEventListener?.('change', handleSystemTheme)
})

onBeforeUnmount(() => systemDark.removeEventListener?.('change', handleSystemTheme))
</script>

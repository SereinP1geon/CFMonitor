<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { currentLang } from '@cf/utils/i18n.js'
import { PRESET_ACCENTS } from '../utils/themePreferences.js'
import MyntIcon from './MyntIcon.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  preferences: {
    type: Object,
    default: () => ({})
  },
  siteDefaults: {
    type: Object,
    default: () => ({})
  },
  canSave: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  },
  saveFeedback: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'update-preferences', 'save-defaults', 'reset-local'])

const drawerRef = ref(null)
const lastFocusedElement = ref(null)
const titleId = 'mynt-theme-drawer-title'
const DEFAULT_ACCENT = '#4382EC'

const COPY = {
  en: {
    appearance: 'Appearance', close: 'Close appearance settings', colorMode: 'Color mode',
    light: 'Light', dark: 'Dark', system: 'System', accent: 'Accent color', siteDefault: 'Site default',
    customAccent: 'Choose a custom accent color', siteDefaults: 'Site defaults', custom: 'Custom',
    description: 'Save this theme for everyone who visits the monitor.', saving: 'Saving…',
    save: 'Save as site default', clear: 'Clear local override', useAccent: 'Use {color} accent'
  },
  zh: {
    appearance: '外观设置', close: '关闭外观设置', colorMode: '明暗模式',
    light: '浅色', dark: '深色', system: '跟随系统', accent: '强调色', siteDefault: '站点默认',
    customAccent: '选择自定义强调色', siteDefaults: '站点默认设置', custom: '自定义',
    description: '将当前配色保存为所有访客的站点默认值。', saving: '保存中…',
    save: '保存为站点默认', clear: '清除本机覆盖', useAccent: '使用 {color} 强调色'
  }
}

const copy = computed(() => COPY[currentLang.value] || COPY.en)
const colorModeOptions = computed(() => [
  { value: 'light', label: copy.value.light, icon: 'white-balance-sunny' },
  { value: 'dark', label: copy.value.dark, icon: 'moon-waning-crescent' },
  { value: 'system', label: copy.value.system, icon: 'theme-light-dark' }
])

const normalizePreset = (preset, key) => {
  if (typeof preset === 'string') {
    return { value: preset, label: preset }
  }

  if (!preset || typeof preset !== 'object') return null

  const value = preset.value || preset.accent || preset.color || preset.hex
  if (!value) return null

  return {
    value,
    label: preset.label || preset.name || key || value
  }
}

const presetAccents = computed(() => {
  if (Array.isArray(PRESET_ACCENTS)) {
    return PRESET_ACCENTS
      .map((preset, index) => normalizePreset(preset, String(index)))
      .filter(Boolean)
  }

  if (PRESET_ACCENTS && typeof PRESET_ACCENTS === 'object') {
    return Object.entries(PRESET_ACCENTS)
      .map(([key, preset]) => normalizePreset(preset, key))
      .filter(Boolean)
  }

  return []
})

const currentPreferences = computed(() => ({
  schema: 1,
  ...props.preferences
}))

const currentAccent = computed(() => {
  const accent = String(currentPreferences.value.accent || '').trim()
  return /^#[\da-f]{6}$/i.test(accent) ? accent : DEFAULT_ACCENT
})

const currentMode = computed(() => {
  const mode = currentPreferences.value.colorMode
  return ['light', 'dark', 'system'].includes(mode) ? mode : 'system'
})

const siteAccent = computed(() => {
  const accent = String(props.siteDefaults?.accent || '').trim()
  return /^#[\da-f]{6}$/i.test(accent) ? accent : ''
})

const siteMode = computed(() => {
  const mode = props.siteDefaults?.colorMode
  return ['light', 'dark', 'system'].includes(mode) ? mode : ''
})

const setPreference = (key, value) => {
  emit('update-preferences', {
    ...currentPreferences.value,
    [key]: value,
    schema: 1
  })
}

const setMode = (mode) => setPreference('colorMode', mode)
const setAccent = (accent) => {
  if (/^#[\da-f]{6}$/i.test(accent)) setPreference('accent', accent.toUpperCase())
}

const handleSave = () => {
  if (!props.canSave || props.saving) return
  emit('save-defaults', { ...currentPreferences.value })
}

const handleResetLocal = () => {
  if (props.saving) return
  emit('reset-local')
}

const close = () => emit('close')
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'Tab' && drawerRef.value) {
    const focusable = [...drawerRef.value.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), a[href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.getClientRects().length > 0)

    if (focusable.length === 0) {
      event.preventDefault()
      drawerRef.value.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    lastFocusedElement.value = document.activeElement
    await nextTick()
    const initialFocus = drawerRef.value?.querySelector(
      'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
    if (initialFocus) initialFocus.focus()
    else drawerRef.value?.focus()
  } else if (lastFocusedElement.value?.focus) {
    await nextTick()
    lastFocusedElement.value.focus()
    lastFocusedElement.value = null
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="mynt-drawer">
      <div
        v-if="open"
        class="mynt-drawer"
        role="presentation"
        @keydown="handleKeydown"
        @click.self="close"
      >
        <section
          ref="drawerRef"
          class="mynt-drawer__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <header class="mynt-drawer__header">
            <div>
              <p class="mynt-drawer__eyebrow">MYNT</p>
              <h2 :id="titleId">{{ copy.appearance }}</h2>
            </div>
            <button
              class="mynt-icon-button"
              type="button"
              :aria-label="copy.close"
              @click="close"
            >
              <MyntIcon name="close" :size="22" :decorative="true" />
            </button>
          </header>

          <div class="mynt-drawer__content">
            <section class="mynt-drawer__section" aria-labelledby="mynt-mode-label">
              <h3 id="mynt-mode-label">{{ copy.colorMode }}</h3>
              <div class="mynt-segmented" role="group" :aria-label="copy.colorMode">
                <button
                  v-for="option in colorModeOptions"
                  :key="option.value"
                  class="mynt-segmented__item"
                  :class="{ 'is-active': currentMode === option.value }"
                  type="button"
                  :aria-pressed="currentMode === option.value"
                  @click="setMode(option.value)"
                >
                  <MyntIcon :name="option.icon" :size="18" :decorative="true" />
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </section>

            <section class="mynt-drawer__section" aria-labelledby="mynt-accent-label">
              <div class="mynt-drawer__section-heading">
                <h3 id="mynt-accent-label">{{ copy.accent }}</h3>
                <span v-if="siteAccent" class="mynt-drawer__default-hint" :title="`Site default: ${siteAccent}`">
                  {{ copy.siteDefault }}
                </span>
              </div>
              <div class="mynt-palette" role="list" aria-label="Preset accent colors">
                <button
                  v-for="preset in presetAccents"
                  :key="`${preset.label}-${preset.value}`"
                  class="mynt-swatch"
                  :class="{ 'is-active': currentAccent.toUpperCase() === String(preset.value).toUpperCase() }"
                  type="button"
                  role="listitem"
                  :aria-label="copy.useAccent.replace('{color}', preset.label)"
                  :aria-pressed="currentAccent.toUpperCase() === String(preset.value).toUpperCase()"
                  :style="{ '--swatch-color': preset.value }"
                  @click="setAccent(preset.value)"
                >
                  <MyntIcon v-if="currentAccent.toUpperCase() === String(preset.value).toUpperCase()" name="check" :size="18" :decorative="true" />
                </button>
                <label class="mynt-color-picker">
                  <span class="sr-only">{{ copy.customAccent }}</span>
                  <input
                    type="color"
                    :value="currentAccent"
                    :aria-label="copy.customAccent"
                    @input="setAccent($event.target.value)"
                  />
                  <span class="mynt-color-picker__preview" :style="{ '--swatch-color': currentAccent }" aria-hidden="true">
                    <MyntIcon name="palette" :size="18" :decorative="true" />
                  </span>
                </label>
              </div>
            </section>

            <section class="mynt-drawer__section mynt-drawer__section--site" aria-labelledby="mynt-site-default-label">
              <div class="mynt-drawer__section-heading">
                <h3 id="mynt-site-default-label">{{ copy.siteDefaults }}</h3>
                <span v-if="siteMode || siteAccent" class="mynt-drawer__default-hint">
                  {{ siteMode || copy.custom }}<span v-if="siteAccent"> · {{ siteAccent }}</span>
                </span>
              </div>
              <p class="mynt-drawer__description">
                {{ copy.description }}
              </p>
              <div class="mynt-drawer__actions">
                <button
                  class="mynt-button mynt-button--primary"
                  type="button"
                  :disabled="!canSave || saving"
                  @click="handleSave"
                >
                  <MyntIcon v-if="!saving" name="check" :size="18" :decorative="true" />
                  <span>{{ saving ? copy.saving : copy.save }}</span>
                </button>
                <button
                  class="mynt-button mynt-button--tonal"
                  type="button"
                  :disabled="saving"
                  @click="handleResetLocal"
                >
                  <MyntIcon name="close" :size="18" :decorative="true" />
                  <span>{{ copy.clear }}</span>
                </button>
              </div>
              <p
                v-if="saveFeedback?.message"
                class="mynt-drawer__feedback"
                :class="`is-${saveFeedback.tone || 'info'}`"
                :role="saveFeedback.tone === 'error' ? 'alert' : 'status'"
              >
                {{ saveFeedback.message }}
              </p>
            </section>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mynt-drawer {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: color-mix(in srgb, var(--mynt-scrim, #172033) 38%, transparent);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

.mynt-drawer__panel {
  display: flex;
  flex-direction: column;
  width: min(100%, 430px);
  height: 100%;
  overflow: auto;
  color: var(--mynt-on-surface, #1c1b1f);
  background: var(--mynt-surface, #fffbfe);
  box-shadow: var(--mynt-shadow-drawer, -12px 0 36px rgba(31, 35, 50, 0.18));
  outline: none;
}

.mynt-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 28px 20px;
}

.mynt-drawer__eyebrow {
  margin: 0 0 5px;
  color: var(--mynt-primary, #4382ec);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.mynt-drawer h2,
.mynt-drawer h3,
.mynt-drawer p {
  margin-top: 0;
}

.mynt-drawer h2 {
  margin-bottom: 0;
  font-size: 1.55rem;
  letter-spacing: -0.02em;
}

.mynt-drawer h3 {
  margin-bottom: 12px;
  font-size: 0.93rem;
  font-weight: 700;
}

.mynt-icon-button {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  color: var(--mynt-on-surface-variant, #49454f);
  background: transparent;
  cursor: pointer;
}

.mynt-icon-button:hover,
.mynt-icon-button:focus-visible {
  color: var(--mynt-primary, #4382ec);
  background: var(--mynt-primary-container, #d9e2ff);
}

.mynt-icon-button:active,
.mynt-button:active,
.mynt-segmented__item:active,
.mynt-swatch:active {
  transform: scale(0.96);
}

.mynt-drawer__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 26px;
  padding: 6px 28px 32px;
}

.mynt-drawer__section {
  padding-bottom: 26px;
  border-bottom: 1px solid var(--mynt-outline-variant, #cac4d0);
}

.mynt-drawer__section--site {
  padding-bottom: 0;
  border-bottom: 0;
}

.mynt-drawer__section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.mynt-drawer__section-heading h3 {
  margin-bottom: 12px;
}

.mynt-drawer__default-hint {
  color: var(--mynt-on-surface-variant, #49454f);
  font-size: 0.75rem;
}

.mynt-segmented {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--mynt-outline-variant, #cac4d0);
  border-radius: 16px;
  background: var(--mynt-surface-container-low, #f7f2fa);
}

.mynt-segmented__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 7px 8px;
  border: 0;
  border-radius: 12px;
  color: var(--mynt-on-surface-variant, #49454f);
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 650;
  cursor: pointer;
}

.mynt-segmented__item:hover,
.mynt-segmented__item:focus-visible {
  color: var(--mynt-primary, #4382ec);
  background: var(--mynt-primary-container, #d9e2ff);
}

.mynt-segmented__item.is-active {
  color: var(--mynt-on-primary-container, #001a41);
  background: var(--mynt-primary-container, #d9e2ff);
}

.mynt-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.mynt-swatch,
.mynt-color-picker__preview {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--mynt-swatch-foreground, #fff);
  background: var(--swatch-color, var(--mynt-primary, #4382ec));
  box-shadow: inset 0 0 0 2px color-mix(in srgb, #fff 25%, transparent), 0 0 0 1px var(--mynt-outline-variant, #cac4d0);
}

.mynt-swatch {
  padding: 0;
  border: 0;
  cursor: pointer;
}

.mynt-swatch:hover,
.mynt-swatch:focus-visible,
.mynt-color-picker:focus-within .mynt-color-picker__preview {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, #fff 38%, transparent), 0 0 0 3px color-mix(in srgb, var(--mynt-primary, #4382ec) 25%, transparent);
}

.mynt-swatch.is-active {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, #fff 55%, transparent), 0 0 0 3px var(--mynt-primary, #4382ec);
}

.mynt-color-picker {
  position: relative;
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.mynt-color-picker input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.mynt-color-picker__preview {
  border: 0;
}

.mynt-drawer__description {
  margin-bottom: 16px;
  color: var(--mynt-on-surface-variant, #49454f);
  font-size: 0.83rem;
  line-height: 1.5;
}

.mynt-drawer__actions {
  display: grid;
  gap: 10px;
}

.mynt-drawer__feedback {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  color: var(--mynt-on-secondary-container, #1a1b20);
  background: var(--mynt-secondary-container, #e1e2ec);
  font-size: 0.8rem;
  line-height: 1.45;
}

.mynt-drawer__feedback.is-error {
  color: var(--mynt-on-error-container, #410002);
  background: var(--mynt-error-container, #ffdad6);
}

.mynt-drawer__feedback.is-success {
  color: var(--mynt-on-tertiary-container, #00201c);
  background: var(--mynt-tertiary-container, #a7f2e8);
}

.mynt-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 16px;
  border: 0;
  border-radius: 14px;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
}

.mynt-button--primary {
  color: var(--mynt-on-primary, #fff);
  background: var(--mynt-primary, #4382ec);
}

.mynt-button--tonal {
  color: var(--mynt-on-secondary-container, #1a1b20);
  background: var(--mynt-secondary-container, #e1e2ec);
}

.mynt-button:hover,
.mynt-button:focus-visible {
  filter: brightness(0.96);
}

.mynt-button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.mynt-drawer-enter-active,
.mynt-drawer-leave-active,
.mynt-drawer-enter-active .mynt-drawer__panel,
.mynt-drawer-leave-active .mynt-drawer__panel {
  transition: opacity 220ms ease, transform 220ms cubic-bezier(0.2, 0, 0, 1);
}

.mynt-drawer-enter-from,
.mynt-drawer-leave-to {
  opacity: 0;
}

.mynt-drawer-enter-from .mynt-drawer__panel,
.mynt-drawer-leave-to .mynt-drawer__panel {
  opacity: 0;
  transform: translateX(28px);
}

@media (max-width: 520px) {
  .mynt-drawer__header,
  .mynt-drawer__content {
    padding-right: 20px;
    padding-left: 20px;
  }

  .mynt-segmented__item {
    flex-direction: column;
    gap: 2px;
    font-size: 0.72rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mynt-drawer,
  .mynt-drawer__panel,
  .mynt-drawer-enter-active,
  .mynt-drawer-leave-active,
  .mynt-drawer-enter-active .mynt-drawer__panel,
  .mynt-drawer-leave-active .mynt-drawer__panel {
    transition: none;
    animation: none;
  }

  .mynt-drawer-enter-from .mynt-drawer__panel,
  .mynt-drawer-leave-to .mynt-drawer__panel {
    transform: none;
  }
}
</style>

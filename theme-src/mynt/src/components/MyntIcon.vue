<script setup>
import { computed, useAttrs } from 'vue'
import {
  mdiArrowLeft,
  mdiCheck,
  mdiClose,
  mdiCog,
  mdiFilterVariant,
  mdiGithub,
  mdiInformationOutline,
  mdiMagnify,
  mdiMap,
  mdiMoonWaningCrescent,
  mdiPalette,
  mdiServer,
  mdiShieldAccount,
  mdiSourceBranch,
  mdiTable,
  mdiThemeLightDark,
  mdiViewDashboard,
  mdiViewList,
  mdiWhiteBalanceSunny,
  mdiHelpCircleOutline
} from '@mdi/js'

const props = defineProps({
  /** Name from the local icon map. */
  name: {
    type: String,
    required: true
  },
  /** SVG width/height. Numbers are passed through as SVG units; CSS values are supported too. */
  size: {
    type: [Number, String],
    default: 24
  },
  /** Hide the icon from assistive technology when it is accompanying visible text. */
  decorative: {
    type: Boolean,
    default: false
  },
  /** Accessible name for non-decorative icons. */
  ariaLabel: {
    type: String,
    default: ''
  },
  /** Friendly alias for consumers that prefer `label` over `aria-label`. */
  label: {
    type: String,
    default: ''
  }
})

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const iconPaths = {
  palette: mdiPalette,
  'theme-light-dark': mdiThemeLightDark,
  cog: mdiCog,
  close: mdiClose,
  check: mdiCheck,
  'view-dashboard': mdiViewDashboard,
  'view-list': mdiViewList,
  table: mdiTable,
  map: mdiMap,
  server: mdiServer,
  'arrow-left': mdiArrowLeft,
  'shield-account': mdiShieldAccount,
  github: mdiGithub,
  'information-outline': mdiInformationOutline,
  'moon-waning-crescent': mdiMoonWaningCrescent,
  'source-branch': mdiSourceBranch,
  magnify: mdiMagnify,
  'filter-variant': mdiFilterVariant,
  'white-balance-sunny': mdiWhiteBalanceSunny,
  help: mdiHelpCircleOutline,
  'help-circle-outline': mdiHelpCircleOutline
}

const path = computed(() => iconPaths[props.name] || mdiHelpCircleOutline)
const iconSize = computed(() => {
  if (typeof props.size === 'number' && Number.isFinite(props.size) && props.size > 0) {
    return String(props.size)
  }

  const value = String(props.size || '24')
  return value.trim() || '24'
})

const humanName = computed(() => props.name
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase()))

const accessibleLabel = computed(() => props.ariaLabel || props.label || attrs['aria-label'] || `${humanName.value} icon`)
</script>

<template>
  <svg
    class="mynt-icon"
    :width="iconSize"
    :height="iconSize"
    viewBox="0 0 24 24"
    fill="currentColor"
    focusable="false"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : accessibleLabel"
    v-bind="attrs"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.mynt-icon {
  display: inline-block;
  flex: 0 0 auto;
  width: v-bind(iconSize);
  height: v-bind(iconSize);
  color: currentColor;
  vertical-align: middle;
}

@media (prefers-reduced-motion: reduce) {
  .mynt-icon {
    animation: none;
    transition: none;
  }
}
</style>

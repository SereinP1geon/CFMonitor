<template>
  <img
    v-if="resolvedSrc && failedSrc !== resolvedSrc"
    v-bind="$attrs"
    :key="resolvedSrc"
    :src="resolvedSrc"
    :alt="alt"
    :loading="loading"
    :decoding="decoding"
    @load="handleLoad"
    @error="handleError"
  >
  <span
    v-else
    v-bind="$attrs"
    :class="[$attrs.class, fallbackClass, 'public-asset-fallback']"
    role="img"
    :aria-label="alt || fallback"
  >
    <slot name="fallback" :alt="alt" :src="resolvedSrc">{{ fallback }}</slot>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getPublicAssetUrl } from '../utils/config.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  fallback: { type: String, default: '' },
  fallbackClass: { type: [String, Array, Object], default: '' },
  loading: {
    type: String,
    default: 'lazy',
    validator: value => value === 'lazy' || value === 'eager'
  },
  decoding: {
    type: String,
    default: 'async',
    validator: value => value === 'async' || value === 'sync' || value === 'auto'
  }
})

const emit = defineEmits(['load', 'error'])

const failedSrc = ref('')
const resolvedSrc = computed(() => {
  const source = String(props.src || '').trim()
  return source ? getPublicAssetUrl(source) : ''
})

watch([resolvedSrc, () => props.alt], () => {
  // A component can be reused for another record whose URL was seen before.
  // Clear the previous failure whenever its identifying inputs change.
  failedSrc.value = ''
})

const handleLoad = event => {
  failedSrc.value = ''
  emit('load', event)
}

const handleError = event => {
  failedSrc.value = resolvedSrc.value
  emit('error', event)
}
</script>

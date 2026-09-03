<template>
  <PublicAssetImage
    class="os-icon-img"
    fallback-class="os-icon-fallback"
    :src="osImage"
    :alt="osName"
    :aria-label="osName"
    :fallback="fallbackLabel"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
  />
</template>

<script setup>
import { computed } from 'vue'
import PublicAssetImage from './PublicAssetImage.vue'
import { getOSImage, getOSName } from '../utils/osIcon'

const props = defineProps({
  os: { type: String, default: '' },
  eager: { type: Boolean, default: false }
})

const osImage = computed(() => getOSImage(props.os))
const osName = computed(() => getOSName(props.os))
const fallbackLabel = computed(() => {
  const name = String(osName.value || '').trim()
  if (!name || name.toLowerCase() === 'unknown') return 'Unknown'

  const words = name.match(/[\p{L}\p{N}]+/gu) || []
  if (words.length > 1) return words.slice(0, 3).map(word => word[0]).join('').toUpperCase()
  return name.slice(0, 3).toUpperCase()
})
</script>

<style scoped>
.os-icon-fallback {
  display: inline-flex;
  width: auto;
  min-width: 18px;
  padding: 0 2px;
  align-items: center;
  justify-content: center;
  overflow: visible;
  font-size: 9px;
  font-weight: 700;
  line-height: 18px;
  white-space: nowrap;
}
</style>

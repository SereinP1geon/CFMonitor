<script setup>
const props = defineProps({
  version: {
    type: [String, Number],
    default: ''
  },
  sourceUrl: {
    type: String,
    default: 'https://github.com/huilang-me/CF-Server-Monitor'
  },
  licenseUrl: {
    type: String,
    default: 'https://www.gnu.org/licenses/gpl-3.0.html'
  }
})
</script>

<template>
  <footer class="mynt-footer">
    <span class="mynt-footer__credit">Powered by CF-Server-Monitor</span>
    <span v-if="version !== ''" class="mynt-footer__version">v{{ version }}</span>
    <span class="mynt-footer__links" aria-label="Project links">
      <a
        v-if="props.sourceUrl"
        :href="props.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
      >Source</a>
      <a
        v-if="props.licenseUrl"
        :href="props.licenseUrl"
        target="_blank"
        rel="noopener noreferrer"
      >License</a>
    </span>
  </footer>
</template>

<style scoped>
.mynt-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  padding: 20px 24px 28px;
  color: var(--mynt-on-surface-variant, #49454f);
  font-size: 0.76rem;
  line-height: 1.45;
  text-align: center;
}

.mynt-footer__version {
  opacity: 0.76;
  font-variant-numeric: tabular-nums;
}

.mynt-footer__links {
  display: inline-flex;
  gap: 12px;
}

.mynt-footer a {
  color: var(--mynt-primary, #4382ec);
  font-weight: 700;
  text-decoration: none;
}

.mynt-footer a:hover,
.mynt-footer a:focus-visible {
  text-decoration: underline;
}

@media (prefers-reduced-motion: reduce) {
  .mynt-footer,
  .mynt-footer a {
    transition: none;
    animation: none;
  }
}
</style>

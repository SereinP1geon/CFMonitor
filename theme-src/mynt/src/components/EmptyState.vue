<script setup>
import { computed, useSlots } from 'vue'
import MyntIcon from './MyntIcon.vue'

const props = defineProps({
  icon: {
    type: String,
    default: 'information-outline'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  /** Button label. Use the `#action` slot for a custom action control. */
  action: {
    type: [String, Boolean],
    default: ''
  }
})

const emit = defineEmits(['action'])
const slots = useSlots()
const hasAction = computed(() => Boolean(props.action) || Boolean(slots.action))
</script>

<template>
  <section class="mynt-empty-state" aria-live="polite">
    <div class="mynt-empty-state__icon" aria-hidden="true">
      <MyntIcon :name="icon" :size="32" :decorative="true" />
    </div>
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <div v-if="hasAction" class="mynt-empty-state__action">
      <slot name="action">
        <button type="button" class="mynt-empty-state__button" @click="emit('action')">
          {{ action }}
        </button>
      </slot>
    </div>
  </section>
</template>

<style scoped>
.mynt-empty-state {
  display: grid;
  justify-items: center;
  max-width: 34rem;
  margin: 0 auto;
  padding: 48px 24px;
  color: var(--mynt-on-surface, #1c1b1f);
  text-align: center;
}

.mynt-empty-state__icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 18px;
  border-radius: 24px;
  color: var(--mynt-primary, #4382ec);
  background: var(--mynt-primary-container, #d9e2ff);
}

.mynt-empty-state h2 {
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  letter-spacing: -0.015em;
}

.mynt-empty-state p {
  max-width: 29rem;
  margin: 10px 0 0;
  color: var(--mynt-on-surface-variant, #49454f);
  font-size: 0.9rem;
  line-height: 1.55;
}

.mynt-empty-state__action {
  margin-top: 22px;
}

.mynt-empty-state__button {
  min-height: 42px;
  padding: 9px 18px;
  border: 0;
  border-radius: 999px;
  color: var(--mynt-on-primary, #fff);
  background: var(--mynt-primary, #4382ec);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.mynt-empty-state__button:hover,
.mynt-empty-state__button:focus-visible {
  filter: brightness(0.96);
}

.mynt-empty-state__button:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .mynt-empty-state,
  .mynt-empty-state__button {
    transition: none;
    animation: none;
  }
}
</style>

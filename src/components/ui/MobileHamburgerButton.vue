<script setup lang="ts">
withDefaults(
  defineProps<{
    active: boolean
    controls?: string
    openLabel?: string
    closeLabel?: string
  }>(),
  {
    controls: undefined,
    openLabel: '打开菜单',
    closeLabel: '关闭菜单',
  },
)

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    type="button"
    class="mobile-hamburger"
    :class="{ active }"
    :aria-label="active ? closeLabel : openLabel"
    :aria-expanded="active"
    :aria-controls="controls"
    @click="$emit('click')"
  >
    <span class="container" aria-hidden="true">
      <span class="top" />
      <span class="middle" />
      <span class="bottom" />
    </span>
  </button>
</template>

<style scoped>
.mobile-hamburger {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 8px;
  padding: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.25s ease;
}

.mobile-hamburger:hover,
.mobile-hamburger:focus-visible {
  background: var(--surface-soft);
}

.mobile-hamburger:focus-visible {
  outline: none;
}

.container {
  position: relative;
  width: 16px;
  height: 14px;
  overflow: hidden;
  transform: scaleX(-1);
  transform-origin: center;
}

.top,
.middle,
.bottom {
  position: absolute;
  left: 0;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background-color: var(--text-primary);
  transition:
    top 0.25s,
    background-color 0.25s,
    transform 0.25s;
}

.top {
  top: 0;
  transform: translateX(0);
}

.middle {
  top: 6px;
  transform: translateX(8px);
}

.bottom {
  top: 12px;
  transform: translateX(4px);
}

.mobile-hamburger:hover .top,
.mobile-hamburger:focus-visible .top {
  top: 0;
  transform: translateX(4px);
}

.mobile-hamburger:hover .middle,
.mobile-hamburger:focus-visible .middle {
  top: 6px;
  transform: translateX(0);
}

.mobile-hamburger:hover .bottom,
.mobile-hamburger:focus-visible .bottom {
  top: 12px;
  transform: translateX(8px);
}

.mobile-hamburger.active .top {
  top: 6px;
  transform: translateX(0) rotate(225deg);
}

.mobile-hamburger.active .middle {
  top: 6px;
  transform: translateX(16px);
}

.mobile-hamburger.active .bottom {
  top: 6px;
  transform: translateX(0) rotate(135deg);
}

.mobile-hamburger.active:hover .top,
.mobile-hamburger.active:hover .middle,
.mobile-hamburger.active:hover .bottom,
.mobile-hamburger.active:focus-visible .top,
.mobile-hamburger.active:focus-visible .middle,
.mobile-hamburger.active:focus-visible .bottom {
  background-color: var(--text-secondary);
}
@media (min-width: 769px) {
  .mobile-hamburger {
    display: none;
  }
}
</style>

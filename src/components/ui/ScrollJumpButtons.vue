<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useScrollJumpButtons } from '@/composables/useScrollJumpButtons'

const { showBackToTop, showGoToBottom, scrollToTop, scrollToBottom } = useScrollJumpButtons()
</script>

<template>
  <button
    v-show="showGoToBottom"
    class="go-to-bottom-btn"
    type="button"
    title="去底部"
    aria-label="去底部"
    @click="scrollToBottom"
  >
    <ChevronDown class="h-5 w-5" />
  </button>

  <button
    v-show="showBackToTop"
    class="back-to-top-btn"
    type="button"
    title="返回顶部"
    aria-label="返回顶部"
    @click="scrollToTop"
  >
    <ChevronUp class="h-5 w-5" />
  </button>
</template>

<style scoped>
.back-to-top-btn,
.go-to-bottom-btn {
  position: fixed;
  bottom: 1.5rem;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--floating-border);
  border-radius: 9999px;
  background: var(--floating-bg);
  color: var(--text-contrast);
  cursor: pointer;
  box-shadow: var(--floating-shadow);
  transition: all 0.2s ease;
}

.back-to-top-btn {
  right: 1.5rem;
}

.go-to-bottom-btn {
  left: 1.5rem;
}

.back-to-top-btn:hover,
.go-to-bottom-btn:hover {
  transform: translateY(-2px);
  background: var(--floating-bg-hover);
}

@media (max-width: 768px) {
  .back-to-top-btn {
    right: 1rem;
    bottom: 1rem;
  }

  .go-to-bottom-btn {
    left: 1rem;
    bottom: 1rem;
  }
}
</style>

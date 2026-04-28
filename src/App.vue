<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { MoonStar, SunMedium } from 'lucide-vue-next'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'japanese-song-theme'

const resolveInitialTheme = (): ThemeMode => {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<ThemeMode>('light')
const isDarkTheme = computed(() => theme.value === 'dark')
const themeButtonLabel = computed(() => (isDarkTheme.value ? '切换到亮色模式' : '切换到暗色模式'))

const applyTheme = (value: ThemeMode) => {
  document.documentElement.dataset.theme = value
}

const toggleTheme = () => {
  theme.value = isDarkTheme.value ? 'light' : 'dark'
}

onMounted(() => {
  theme.value = resolveInitialTheme()
})

watch(
  theme,
  (value) => {
    applyTheme(value)
    window.localStorage.setItem(THEME_STORAGE_KEY, value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-shell">
    <div class="theme-toggle-anchor">
      <button
        type="button"
        class="theme-toggle"
        :class="{ 'is-dark': isDarkTheme }"
        :aria-label="themeButtonLabel"
        :title="themeButtonLabel"
        @click="toggleTheme"
      >
        <span class="theme-toggle__rope" aria-hidden="true"></span>
        <span class="theme-toggle__pendant" aria-hidden="true">
          <MoonStar v-if="isDarkTheme" class="theme-toggle__icon" />
          <SunMedium v-else class="theme-toggle__icon" />
        </span>
        <span class="sr-only">{{ themeButtonLabel }}</span>
      </button>
    </div>

    <RouterView />
  </div>
</template>

<style>
.app-shell {
  min-height: 100vh;
}

.theme-toggle-anchor {
  position: fixed;
  top: 0;
  right: clamp(0.8rem, 2vw, 1.8rem);
  z-index: 100;
  pointer-events: none;
}

.theme-toggle {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 2.9rem 0 0;
  border: none;
  background: transparent;
  color: var(--theme-toggle-icon);
  cursor: pointer;
  pointer-events: auto;
  transform-origin: top center;
  animation: theme-toggle-sway 6.8s ease-in-out infinite;
}

.theme-toggle:hover,
.theme-toggle:focus-visible {
  animation-play-state: paused;
}

.theme-toggle:focus-visible {
  outline: none;
}

.theme-toggle__rope {
  position: absolute;
  top: 0;
  width: 2px;
  height: 3.1rem;
  border-radius: 999px;
  background: var(--theme-toggle-rope);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.theme-toggle__pendant {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: 1px solid var(--theme-toggle-border);
  background: var(--theme-toggle-bg);
  box-shadow: var(--theme-toggle-shadow);
  backdrop-filter: blur(14px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.theme-toggle:hover .theme-toggle__pendant,
.theme-toggle:focus-visible .theme-toggle__pendant {
  transform: translateY(2px) scale(1.04);
  border-color: var(--border-accent-strong);
}

.theme-toggle__icon {
  width: 1.35rem;
  height: 1.35rem;
  stroke-width: 2;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes theme-toggle-sway {
  0%,
  100% {
    transform: rotate(2deg);
  }

  50% {
    transform: rotate(-4deg);
  }
}

@media (max-width: 768px) {
  .theme-toggle-anchor {
    right: 0.85rem;
  }

  .theme-toggle {
    padding-top: 2.55rem;
  }

  .theme-toggle__rope {
    height: 2.75rem;
  }

  .theme-toggle__pendant {
    width: 2.7rem;
    height: 2.7rem;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LyricsEditor from '@/components/LyricsEditor.vue'
import MobileHamburgerButton from '@/components/ui/MobileHamburgerButton.vue'
import ScrollJumpButtons from '@/components/ui/ScrollJumpButtons.vue'
import { useMobileActionPanel } from '@/composables/useMobileActionPanel'
import { getSongById, getSongs } from '@/lib/songCatalog'

const route = useRoute()
const router = useRouter()
const editorRef = ref<InstanceType<typeof LyricsEditor> | null>(null)
const songs = getSongs()
const copyStatus = ref('')
const EDITOR_STORAGE_KEY = 'japanese-lyrics-editor-state'
const isCopyToastError = computed(() => copyStatus.value.includes('失败'))
const {
  shellRef: headerActionsShellRef,
  isMobileViewport,
  isOpen: showHeaderActions,
  toggle: toggleHeaderActions,
  close: closeHeaderActions,
} = useMobileActionPanel()
let copyStatusTimer: number | null = null

const selectedSongId = computed(() => {
  if (typeof route.params.songId === 'string') return route.params.songId
  return songs.length > 0 ? songs[0].id : ''
})

const selectedSong = computed(() => songs.find((song) => song.id === selectedSongId.value) ?? null)

const selectedSongData = computed(() => {
  if (!selectedSongId.value) return null
  return getSongById(selectedSongId.value)
})

watch(
  selectedSongData,
  async (data) => {
    if (!data) return
    await nextTick()
    editorRef.value?.loadData(data)
  },
  { immediate: true },
)

const copySongLink = async () => {
  if (!selectedSong.value) return

  const href = router.resolve({
    name: 'example-song',
    params: { songId: selectedSong.value.id },
  }).href
  const absoluteUrl = new URL(href, window.location.origin).toString()

  try {
    await navigator.clipboard.writeText(absoluteUrl)
    copyStatus.value = '链接已复制'
  } catch {
    copyStatus.value = '复制失败，请手动复制地址栏链接'
  }

  closeHeaderActions()

  if (copyStatusTimer !== null) {
    window.clearTimeout(copyStatusTimer)
  }

  copyStatusTimer = window.setTimeout(() => {
    copyStatus.value = ''
    copyStatusTimer = null
  }, 2000)
}

const editCurrentSong = async () => {
  if (!selectedSongData.value) return

  const normalizedLyrics = selectedSongData.value.lyrics.map((line) => ({
    japanese: line.japanese,
    furiganaMap: line.furiganaMap ?? {},
    chinese: line.chinese,
    isBreak: line.isBreak ?? false,
  }))

  localStorage.setItem(
    EDITOR_STORAGE_KEY,
    JSON.stringify({
      lyrics: normalizedLyrics,
      lastSaved: new Date().toISOString(),
    }),
  )

  await router.push({ name: 'home' })
  closeHeaderActions()
}

onUnmounted(() => {
  if (copyStatusTimer !== null) {
    window.clearTimeout(copyStatusTimer)
  }
})
</script>

<template>
  <div class="example">
    <div class="title-container">
      <!-- <h1>歌曲一览</h1> -->
      <div ref="headerActionsShellRef" class="header-actions-shell">
        <MobileHamburgerButton
          v-if="isMobileViewport"
          class="mobile-toggle"
          :active="showHeaderActions"
          controls="example-header-actions"
          open-label="展开页面操作"
          close-label="收起页面操作"
          @click="toggleHeaderActions"
        />
        <div
          id="example-header-actions"
          class="header-actions"
          :class="{ 'is-open': !isMobileViewport || showHeaderActions }"
        >
          <router-link to="/" class="back-btn" @click="closeHeaderActions">返回编辑器</router-link>
          <button v-if="selectedSong" class="copy-link-btn" @click="copySongLink">
            复制当前歌曲链接
          </button>
          <button v-if="selectedSongData" class="edit-song-btn" @click="editCurrentSong">
            编辑当前歌曲
          </button>
        </div>
      </div>
    </div>

    <div class="content">
      <aside class="song-list">
        <div class="song-list-title">歌曲列表</div>
        <div class="song-list-links">
          <router-link
            v-for="song in songs"
            :key="song.id"
            class="song-link"
            :class="{ active: song.id === selectedSongId }"
            :to="{ name: 'example-song', params: { songId: song.id } }"
          >
            {{ song.title }}
          </router-link>
        </div>
      </aside>

      <section class="preview-panel">
        <div v-if="!selectedSongId" class="empty-state">请先从左侧选择一首歌曲</div>
        <div v-else-if="!selectedSongData" class="empty-state">未找到对应歌曲，请重新选择</div>
        <template v-else>
          <!--<h2 class="song-title">{{ selectedSong?.title }}</h2>-->
          <LyricsEditor ref="editorRef" :isEditMode="false" />
        </template>
      </section>
    </div>

    <ScrollJumpButtons />

    <div
      v-show="copyStatus"
      class="copy-toast"
      :class="{ 'is-error': isCopyToastError }"
      role="status"
      aria-live="polite"
    >
      {{ copyStatus }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.example {
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.example .title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.header-actions-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.example h1 {
  text-align: center;
  color: var(--text-primary);
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.3rem);
  font-family: 'Noto Serif JP', 'Noto Serif', serif;
}

.back-btn,
.copy-link-btn,
.edit-song-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-btn {
  text-decoration: none;
}

.back-btn:hover,
.copy-link-btn:hover,
.edit-song-btn:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.content {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 1rem;
}

.song-list {
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface);
  box-shadow: var(--panel-shadow);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  height: fit-content;
  max-height: min(68vh, 34rem);
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.song-list-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.song-list-title {
  font-weight: 600;
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
}

.song-link {
  text-decoration: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  overflow-wrap: anywhere;
}

.song-link:hover {
  background: var(--surface-soft);
}

.song-link.active {
  border-color: var(--border-strong);
  background: var(--surface-soft);
  color: var(--text-primary);
}

.preview-panel {
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface);
  box-shadow: var(--panel-shadow);
  padding: 1rem;
  min-width: 0;
}

.song-title {
  margin: 0 0 1rem;
  color: var(--text-primary);
  text-align: center;
}

.empty-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.copy-toast {
  position: fixed;
  top: 5.4rem;
  right: 1.25rem;
  z-index: 60;
  max-width: min(70vw, 420px);
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--success-border);
  border-radius: 0.5rem;
  background: var(--success-bg);
  color: var(--success-text);
  font-size: 0.875rem;
  line-height: 1.35;
  box-shadow: var(--success-shadow);
}

.copy-toast.is-error {
  border-color: var(--error-border);
  background: var(--error-bg);
  color: var(--error-text);
  box-shadow: var(--error-shadow);
}

@media (max-width: 768px) {
  .example {
    padding: 1rem;
  }

  .example .title-container {
    margin-bottom: 1.25rem;
  }

  .header-actions-shell {
    width: 100%;
    align-items: flex-start;
  }

  .header-actions {
    display: none;
    align-self: stretch;
    width: 100%;
    justify-content: flex-start;
    gap: 0.45rem;
    padding: 0.6rem;
    border: 1px solid var(--border-strong);
    border-radius: 1rem;
    background: var(--surface-strong);
    box-shadow: var(--toolbar-shadow);
  }

  .header-actions.is-open {
    display: flex;
  }

  .content {
    grid-template-columns: minmax(0, 1fr);
  }

  .song-list {
    gap: 0.45rem;
    padding: 0.7rem;
    max-height: none;
    overflow: visible;
    scrollbar-gutter: auto;
  }

  .song-list-links {
    flex-direction: row;
    gap: 0.45rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.1rem;
    scroll-snap-type: x proximity;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .song-list-links::-webkit-scrollbar {
    display: none;
  }

  .preview-panel {
    padding: 0.85rem;
  }

  .back-btn,
  .copy-link-btn,
  .edit-song-btn {
    min-height: 2.2rem;
    padding: 0.35rem 0.65rem;
    font-size: 0.82rem;
  }

  .song-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-height: 2.2rem;
    padding: 0.4rem 0.75rem;
    white-space: nowrap;
    scroll-snap-align: start;
  }

  .copy-toast {
    top: 4.85rem;
    right: 0.75rem;
    max-width: calc(100vw - 1.5rem);
  }
}

@media (max-width: 640px) {
  .example .title-container {
    align-items: stretch;
    gap: 0.6rem;
  }

  .example h1 {
    width: 100%;
  }

  .back-btn,
  .copy-link-btn,
  .edit-song-btn {
    width: auto;
    flex: 0 1 auto;
    max-width: 100%;
  }

  .song-list-title {
    padding: 0 0 0.25rem;
  }

  .copy-toast {
    top: auto;
    right: 0.75rem;
    left: 0.75rem;
    bottom: 4.75rem;
    max-width: none;
  }
}
</style>

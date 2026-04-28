<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LyricsEditor from '@/components/LyricsEditor.vue'
import { getSongById, getSongs } from '@/lib/songCatalog'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const editorRef = ref<InstanceType<typeof LyricsEditor> | null>(null)
const songs = getSongs()
const copyStatus = ref('')
const EDITOR_STORAGE_KEY = 'japanese-lyrics-editor-state'
const showBackToTop = ref(false)
const showGoToBottom = ref(false)
const isCopyToastError = computed(() => copyStatus.value.includes('失败'))
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
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 240
  const distanceToBottom =
    document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)
  showGoToBottom.value = distanceToBottom > 240
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollToBottom = () => {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (copyStatusTimer !== null) {
    window.clearTimeout(copyStatusTimer)
  }
})
</script>

<template>
  <div class="example">
    <div class="title-container">
      <h1>歌曲一览</h1>
      <router-link to="/" class="back-btn">返回编辑器</router-link>
      <button v-if="selectedSong" class="copy-link-btn" @click="copySongLink">
        复制当前歌曲链接
      </button>
      <button v-if="selectedSongData" class="edit-song-btn" @click="editCurrentSong">
        编辑当前歌曲
      </button>
    </div>

    <div class="content">
      <aside class="song-list">
        <div class="song-list-title">歌曲列表</div>
        <router-link
          v-for="song in songs"
          :key="song.id"
          class="song-link"
          :class="{ active: song.id === selectedSongId }"
          :to="{ name: 'example-song', params: { songId: song.id } }"
        >
          {{ song.title }}
        </router-link>
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
  padding: 2rem;
}

.example .title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.example h1 {
  text-align: center;
  color: var(--text-primary);
  margin: 0;
  font-family: 'Noto Serif JP', 'Noto Serif', serif;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.copy-link-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-link-btn:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.edit-song-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-accent);
  border-radius: 0.375rem;
  background: var(--surface-accent);
  color: var(--accent);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.edit-song-btn:hover {
  background: var(--surface-accent-strong);
  color: var(--accent-hover);
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
  gap: 0.4rem;
  height: fit-content;
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

.back-to-top-btn {
  position: fixed;
  right: 1.5rem;
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

.go-to-bottom-btn {
  position: fixed;
  left: 1.5rem;
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

.go-to-bottom-btn:hover {
  transform: translateY(-2px);
  background: var(--floating-bg-hover);
}

.back-to-top-btn:hover {
  transform: translateY(-2px);
  background: var(--floating-bg-hover);
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
  .back-to-top-btn {
    right: 1rem;
    bottom: 1rem;
  }

  .go-to-bottom-btn {
    left: 1rem;
    bottom: 1rem;
  }

  .copy-toast {
    top: 4.85rem;
    right: 0.75rem;
    max-width: calc(100vw - 1.5rem);
  }
}
</style>

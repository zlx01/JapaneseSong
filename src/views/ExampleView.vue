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
  color: #2c2418;
  margin: 0;
  font-family: 'Noto Serif JP', 'Noto Serif', serif;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid #d4cbbf;
  border-radius: 0.375rem;
  background: transparent;
  color: #6b5c4d;
  text-decoration: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: #f0ebe3;
  color: #3a3028;
}

.copy-link-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid #d4cbbf;
  border-radius: 0.375rem;
  background: transparent;
  color: #6b5c4d;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-link-btn:hover {
  background: #f0ebe3;
  color: #3a3028;
}

.edit-song-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(139, 107, 74, 0.35);
  border-radius: 0.375rem;
  background: rgba(139, 107, 74, 0.08);
  color: #7a5c3e;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.edit-song-btn:hover {
  background: rgba(139, 107, 74, 0.15);
  color: #5f472f;
}

.content {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 1rem;
}

.song-list {
  border: 1px solid #e0d8cc;
  border-radius: 0.5rem;
  background: #fffdf9;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  height: fit-content;
}

.song-list-title {
  font-weight: 600;
  color: #2c2418;
  padding: 0.25rem 0.5rem;
}

.song-link {
  text-decoration: none;
  color: #5a4f42;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
}

.song-link:hover {
  background: #f5f0e8;
}

.song-link.active {
  border-color: #d4cbbf;
  background: #f0ebe3;
  color: #2c2418;
}

.preview-panel {
  border: 1px solid #e0d8cc;
  border-radius: 0.5rem;
  background: #fffdf9;
  padding: 1rem;
}

.song-title {
  margin: 0 0 1rem;
  color: #2c2418;
  text-align: center;
}

.empty-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b5c4d;
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
  border: 1px solid rgba(139, 107, 74, 0.35);
  border-radius: 9999px;
  background: rgba(139, 107, 74, 0.92);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
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
  border: 1px solid rgba(139, 107, 74, 0.35);
  border-radius: 9999px;
  background: rgba(139, 107, 74, 0.92);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
  transition: all 0.2s ease;
}

.go-to-bottom-btn:hover {
  transform: translateY(-2px);
  background: #7a5c3e;
}

.back-to-top-btn:hover {
  transform: translateY(-2px);
  background: #7a5c3e;
}

.copy-toast {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 60;
  max-width: min(70vw, 420px);
  padding: 0.625rem 0.875rem;
  border: 1px solid rgba(35, 114, 72, 0.28);
  border-radius: 0.5rem;
  background: #f0faf4;
  color: #1f5f3d;
  font-size: 0.875rem;
  line-height: 1.35;
  box-shadow: 0 8px 18px rgba(31, 95, 61, 0.14);
}

.copy-toast.is-error {
  border-color: rgba(185, 63, 63, 0.28);
  background: #fff5f5;
  color: #9f2f2f;
  box-shadow: 0 8px 18px rgba(159, 47, 47, 0.14);
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
    top: 0.75rem;
    right: 0.75rem;
    max-width: calc(100vw - 1.5rem);
  }
}
</style>

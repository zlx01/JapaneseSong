<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LyricsEditor from '@/components/LyricsEditor.vue'
import { getSongById, getSongs } from '@/lib/songCatalog'

const route = useRoute()
const router = useRouter()
const editorRef = ref<InstanceType<typeof LyricsEditor> | null>(null)
const songs = getSongs()
const copyStatus = ref('')

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

  window.setTimeout(() => {
    copyStatus.value = ''
  }, 2000)
}
</script>

<template>
  <div class="example">
    <div class="title-container">
      <h1>示例预览</h1>
      <router-link to="/" class="back-btn">返回编辑器</router-link>
      <button v-if="selectedSong" class="copy-link-btn" @click="copySongLink">复制当前歌曲链接</button>
      <span v-if="copyStatus" class="copy-status">{{ copyStatus }}</span>
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

.copy-status {
  color: #6b5c4d;
  font-size: 0.875rem;
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
</style>

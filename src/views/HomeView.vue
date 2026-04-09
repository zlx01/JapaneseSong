<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import LyricsEditor from '@/components/LyricsEditor.vue'
import { Eye, Edit2, Upload, Download, Camera } from 'lucide-vue-next'
import html2canvas from 'html2canvas'

const isEditMode = ref(true)
const editorRef = ref<InstanceType<typeof LyricsEditor> | null>(null)
let autoSaveTimer: number | null = null
const fileInput = ref<HTMLInputElement | null>(null)

// 开始自动保存
const startAutoSave = () => {
  autoSaveTimer = window.setInterval(() => {
    editorRef.value?.saveToLocalStorage()
  }, 30000) // 30秒
}

// 停止自动保存
const stopAutoSave = () => {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

const togglePreview = () => {
  isEditMode.value = !isEditMode.value
}

// 导出歌词功能
const exportLyrics = () => {
  editorRef.value?.exportLyrics()
}

// 导入歌词功能
const importLyrics = (event: Event) => {
  editorRef.value?.importLyrics(event)
}

// 导出预览为图片功能
const exportPreviewAsImage = async () => {
  const previewContainer = document.querySelector('.preview-container')
  if (!previewContainer) return

  try {
    const canvas = await html2canvas(previewContainer as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高图片质量
      logging: false,
    })

    // 将canvas转换为图片并下载
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = '歌词预览.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('导出图片失败:', error)
    alert('导出图片失败，请重试')
  }
}

// 监听组件挂载
onMounted(() => {
  editorRef.value?.restoreFromLocalStorage()
  startAutoSave()
})

// 监听组件卸载
onUnmounted(() => {
  stopAutoSave()
  editorRef.value?.saveToLocalStorage() // 卸载前保存一次
})

// 监听页面关闭
window.addEventListener('beforeunload', () => {
  editorRef.value?.saveToLocalStorage()
})
</script>

<template>
  <div class="home">
    <div class="title-container">
      <h1>日语歌词编辑器</h1>
      <div class="controls-container">
        <button
          @click="togglePreview"
          class="icon-btn preview-btn"
          :title="isEditMode ? '切换到预览模式' : '切换到编辑模式'"
        >
          <Edit2 v-if="isEditMode" class="h-4 w-4" />
          <Eye v-else class="h-4 w-4" />
        </button>
        <button @click="exportLyrics" class="icon-btn" title="导出歌词">
          <Download class="h-4 w-4" />
        </button>
        <button @click="fileInput?.click()" class="icon-btn" title="导入歌词">
          <Upload class="h-4 w-4" />
        </button>
        <button @click="exportPreviewAsImage" class="icon-btn" title="保存预览为图片">
          <Camera class="h-4 w-4" />
        </button>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="importLyrics" />
      </div>
    </div>
    <LyricsEditor ref="editorRef" :isEditMode="isEditMode" />
  </div>
</template>

<style>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.controls-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h1 {
  text-align: center;
  color: #2c2418;
  margin: 0;
  font-family: 'Noto Serif JP', 'Noto Serif', serif;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid #d4cbbf;
  border-radius: 0.375rem;
  background: transparent;
  color: #6b5c4d;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: #f0ebe3;
  color: #3a3028;
}

.preview-btn {
  color: #8b6b4a;
  border-color: rgba(139, 107, 74, 0.3);
}

.preview-btn:hover {
  background: rgba(139, 107, 74, 0.1);
  border-color: rgba(139, 107, 74, 0.4);
}

.hidden {
  display: none;
}

/* 隐藏文件选择组件的文本提示 */
input[type='file'] {
  color: transparent;
  width: 0;
  height: 0;
  padding: 0;
  border: none;
  overflow: hidden;
}

input[type='file']::-webkit-file-upload-button {
  visibility: hidden;
}
</style>

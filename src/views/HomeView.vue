<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import LyricsEditor from '@/components/LyricsEditor.vue'
import MobileHamburgerButton from '@/components/ui/MobileHamburgerButton.vue'
import ScrollJumpButtons from '@/components/ui/ScrollJumpButtons.vue'
import { useMobileActionPanel } from '@/composables/useMobileActionPanel'
import { Eye, Edit2, Upload, Download, RotateCcw, Camera, BookOpen } from 'lucide-vue-next'
import html2canvas from 'html2canvas'

const router = useRouter()

const isEditMode = ref(true)
const editorRef = ref<InstanceType<typeof LyricsEditor> | null>(null)
let autoSaveTimer: number | null = null
const fileInput = ref<HTMLInputElement | null>(null)
const {
  shellRef: controlsShellRef,
  isMobileViewport,
  isOpen: showControlsPanel,
  toggle: toggleControlsPanel,
  close: closeControlsPanel,
} = useMobileActionPanel()

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

const handleBeforeUnload = () => {
  editorRef.value?.saveToLocalStorage()
}

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
  closeControlsPanel()
}

// 导出歌词功能
const exportLyrics = () => {
  editorRef.value?.exportLyrics()
  closeControlsPanel()
}

const resetLyrics = () => {
  if (!editorRef.value?.lyrics.length) return

  const confirmed = window.confirm('确认重置吗？这会清空当前所有歌词。')
  if (!confirmed) return

  editorRef.value.resetLyrics()
  closeControlsPanel()
}

// 导入歌词功能
const importLyrics = (event: Event) => {
  editorRef.value?.importLyrics(event)
}

const triggerImportLyrics = () => {
  fileInput.value?.click()
  closeControlsPanel()
}

// 导出预览为图片功能
const exportPreviewAsImage = async () => {
  const previewStage = document.querySelector('.preview-stage')
  if (!(previewStage instanceof HTMLElement)) return

  previewStage.classList.add('preview-stage--exporting')
  try {
    await waitForNextFrame()

    const { width, height } = previewStage.getBoundingClientRect()
    const canvas = await html2canvas(previewStage, {
      backgroundColor: null,
      scale: Math.max(window.devicePixelRatio, 2),
      width: Math.ceil(width),
      height: Math.ceil(height),
      logging: false,
      useCORS: true,
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
  } finally {
    previewStage.classList.remove('preview-stage--exporting')
    closeControlsPanel()
  }
}

// 打开示例页面
const openExample = () => {
  const route = router.resolve({ name: 'example' })
  window.open(route.href, '_blank')
  closeControlsPanel()
}

// 监听组件挂载
onMounted(() => {
  editorRef.value?.restoreFromLocalStorage()
  startAutoSave()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 监听组件卸载
onUnmounted(() => {
  stopAutoSave()
  editorRef.value?.saveToLocalStorage() // 卸载前保存一次
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="home">
    <div class="title-container">
      <h1>日语歌词编辑器</h1>
      <div ref="controlsShellRef" class="controls-shell">
        <MobileHamburgerButton
          v-if="isMobileViewport"
          class="mobile-toggle"
          :active="showControlsPanel"
          controls="home-controls-panel"
          open-label="展开操作菜单"
          close-label="收起操作菜单"
          @click="toggleControlsPanel"
        />
        <div
          id="home-controls-panel"
          class="controls-container"
          :class="{ 'is-open': !isMobileViewport || showControlsPanel }"
        >
          <button
            @click="togglePreview"
            class="icon-btn preview-btn"
            :title="isEditMode ? '切换到预览模式' : '切换到编辑模式'"
          >
            <Edit2 v-if="isEditMode" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
          <button v-if="isEditMode" @click="resetLyrics" class="icon-btn" title="重置歌词">
            <RotateCcw class="h-4 w-4" />
          </button>
          <button @click="exportLyrics" class="icon-btn" title="导出歌词">
            <Download class="h-4 w-4" />
          </button>
          <button @click="triggerImportLyrics" class="icon-btn" title="导入歌词">
            <Upload class="h-4 w-4" />
          </button>
          <button
            v-if="!isEditMode"
            @click="exportPreviewAsImage"
            class="icon-btn"
            title="保存预览为图片"
          >
            <Camera class="h-4 w-4" />
          </button>
          <button @click="openExample" class="icon-btn" title="查看示例">
            <BookOpen class="h-4 w-4" />
          </button>
          <input ref="fileInput" type="file" accept=".json" class="hidden" @change="importLyrics" />
        </div>
      </div>
    </div>
    <LyricsEditor ref="editorRef" :isEditMode="isEditMode" />
    <ScrollJumpButtons />
  </div>
</template>

<style>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.title-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.controls-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.controls-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

h1 {
  text-align: center;
  color: var(--text-primary);
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.3rem);
  /* font-family: 'Noto Serif JP', 'Noto Serif', serif; */
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.preview-btn {
  color: var(--accent);
  border-color: var(--border-accent);
}

.preview-btn:hover {
  background: var(--accent-soft);
  border-color: var(--border-accent-strong);
}

.hidden {
  display: none;
}

@media (max-width: 768px) {
  .title-container {
    margin-bottom: 1.25rem;
    gap: 0.9rem;
  }

  .controls-shell {
    width: 100%;
    align-items: flex-start;
    margin-top: -3.4rem;
  }

  .controls-container {
    display: none;
    align-self: stretch;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-strong);
    border-radius: 1rem;
    background: var(--toolbar-bg);
    box-shadow: var(--toolbar-shadow);
  }

  .controls-container.is-open {
    display: flex;
  }

  .icon-btn {
    width: 2.5rem;
    height: 2.5rem;
  }
}

@media (max-width: 480px) {
  .home {
    padding: 0.9rem;
  }

  .title-container {
    align-items: stretch;
  }

  h1 {
    width: 100%;
  }
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

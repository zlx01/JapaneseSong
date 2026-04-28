<template>
  <div class="lyrics-editor" :class="{ 'preview-only': !isEditMode }">
    <div class="editor-container" v-show="isEditMode">
      <div class="editor-header">
        <div class="header-controls">
          <!-- 导入导出按钮已移除 -->
        </div>
      </div>

      <div v-for="(line, index) in lyrics" :key="index" class="lyrics-row">
        <div class="lyrics-line">
          <div
            class="drag-handle"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover.prevent
            @dragenter.prevent
            @drop="handleDrop(index)"
            @dblclick="moveLineToBottom(index)"
            title="双击可置底"
          >
            <div class="drag-dots"></div>
            <span class="drag-hover-tip">双击可置底</span>
          </div>
          <div class="lyrics-content">
            <div class="japanese-text">
              <div v-if="line.isEditing" class="edit-mode">
                <input
                  v-model="line.editingText"
                  class="edit-input"
                  @keyup.enter="saveEdit(index)"
                  @blur="saveEdit(index)"
                  :ref="
                    (el) => {
                      if (el) editInputs[index] = el as HTMLInputElement
                    }
                  "
                />
              </div>
              <div v-else>
                <span
                  v-for="(char, charIndex) in line.japanese"
                  :key="charIndex"
                  @click="handleCharClick($event, index, charIndex)"
                  class="char-wrapper"
                >
                  <ruby
                    >{{ char
                    }}<rt v-if="line.furiganaMap[charIndex]">{{
                      line.furiganaMap[charIndex]
                    }}</rt></ruby
                  >
                </span>
              </div>
              <div class="line-controls">
                <button
                  @click="startEdit(index)"
                  class="icon-btn"
                  v-if="!line.isEditing"
                  title="编辑"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button @click="copyLine(index)" class="icon-btn" title="复制">
                  <Copy class="h-4 w-4" />
                </button>
                <button @click="insertLineBelow(index)" class="icon-btn" title="在下方插入行">
                  <Plus class="h-4 w-4" />
                </button>
                <button
                  @click="toggleBreak(index)"
                  class="icon-btn"
                  :class="{ active: line.isBreak }"
                  title="在此处分段"
                >
                  <SplitSquareHorizontal class="h-4 w-4" />
                </button>
                <button @click="deleteLine(index)" class="icon-btn delete" title="删除">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
            <input v-model="line.chinese" class="chinese-input" placeholder="输入中文翻译" />
          </div>

          <!-- 假名编辑弹窗 -->
          <div v-if="line.showFuriganaEditor" class="furigana-editor" :style="line.editorStyle">
            <input
              v-model="line.currentFurigana"
              class="furigana-input"
              placeholder="输入假名"
              @blur="handleFuriganaBlur(index)"
              @keyup.enter="handleFuriganaBlur(index)"
              :ref="
                (el) => {
                  if (el) furiganaInputs[index] = el as HTMLInputElement
                }
              "
            />
          </div>
          <div v-if="line.isBreak" class="break-line"></div>
        </div>

        <div class="preview-line inline-preview">
          <div class="japanese-text" :class="{ 'song-name': index === 0 }">
            <template v-for="(char, charIndex) in line.japanese" :key="charIndex">
              <ruby v-if="previewPreferences.showFurigana">
                {{ char
                }}<rt v-if="line.furiganaMap[charIndex]">{{ line.furiganaMap[charIndex] }}</rt>
              </ruby>
              <span v-else>{{ char }}</span>
            </template>
          </div>
          <div
            v-if="previewPreferences.showChinese"
            class="chinese-text"
            :class="{ 'song-name': index === 0 }"
          >
            {{ line.chinese }}
          </div>
          <div v-if="line.isBreak" class="preview-break"></div>
        </div>
      </div>

      <div class="add-line">
        <input
          v-model="newLine"
          class="new-line-input"
          placeholder="输入新的歌词行"
          @keyup.enter="addNewLine"
        />
        <button @click="addNewLine" class="add-btn">
          <Plus class="h-4 w-4 mr-1" />
          添加
        </button>
      </div>
    </div>

    <div class="preview-container" v-show="!isEditMode">
      <div class="preview-toolbar preview-mode-toolbar">
        <div class="preview-toolbar-copy">
          <span class="preview-toolbar-label">预览显示</span>
          <span class="preview-toolbar-hint">可单独隐藏假名或中文</span>
        </div>
        <MobileHamburgerButton
          v-if="isMobileViewport"
          class="preview-mobile-toggle"
          :active="showPreviewOptions"
          controls="preview-toggle-panel"
          open-label="展开预览设置"
          close-label="收起预览设置"
          @click="togglePreviewOptions"
        />
        <div
          id="preview-toggle-panel"
          class="preview-toggle-group"
          :class="{ 'is-open': !isMobileViewport || showPreviewOptions }"
          role="group"
          aria-label="预览显示选项"
        >
          <button
            type="button"
            class="preview-toggle"
            :class="{ active: previewPreferences.showFurigana }"
            :aria-pressed="previewPreferences.showFurigana"
            title="切换假名显示"
            @click="togglePreviewPreference('showFurigana')"
          >
            <span class="preview-toggle-text">假名</span>
            <span class="preview-toggle-state">{{
              previewPreferences.showFurigana ? '开' : '关'
            }}</span>
          </button>
          <button
            type="button"
            class="preview-toggle"
            :class="{ active: previewPreferences.showChinese }"
            :aria-pressed="previewPreferences.showChinese"
            title="切换中文显示"
            @click="togglePreviewPreference('showChinese')"
          >
            <span class="preview-toggle-text">中文</span>
            <span class="preview-toggle-state">{{
              previewPreferences.showChinese ? '开' : '关'
            }}</span>
          </button>
        </div>
      </div>

      <div class="preview-stage">
        <div v-for="(line, index) in lyrics" :key="'preview-' + index" class="preview-line">
          <div class="japanese-text" :class="{ 'song-name': index === 0 }">
            <template v-for="(char, charIndex) in line.japanese" :key="charIndex">
              <ruby v-if="previewPreferences.showFurigana">
                {{ char
                }}<rt v-if="line.furiganaMap[charIndex]">{{ line.furiganaMap[charIndex] }}</rt>
              </ruby>
              <span v-else>{{ char }}</span>
            </template>
          </div>
          <div
            v-if="previewPreferences.showChinese"
            class="chinese-text"
            :class="{ 'song-name': index === 0 }"
          >
            {{ line.chinese }}
          </div>
          <div v-if="line.isBreak" class="preview-break"></div>
        </div>
      </div>
      <!-- <img class="poster" src="@/assets/poster/ichigo_hakusho.gif" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import MobileHamburgerButton from '@/components/ui/MobileHamburgerButton.vue'
import { Pencil, Copy, Trash2, Plus, SplitSquareHorizontal } from 'lucide-vue-next'

defineProps<{
  isEditMode?: boolean
}>()

interface LyricLine {
  japanese: string
  furiganaMap: { [key: number]: string }
  chinese: string
  showFuriganaEditor: boolean
  editorStyle: {
    top: string
    left: string
  }
  currentFurigana: string
  selectedCharIndex: number
  isEditing: boolean
  editingText: string
  isBreak: boolean
}

const lyrics = ref<LyricLine[]>([])
const newLine = ref('')
const selectedLineIndex = ref(-1)
const furiganaInputs: (HTMLInputElement | null)[] = []
const editInputs: (HTMLInputElement | null)[] = []
const draggedIndex = ref<number>(-1)

const STORAGE_KEY = 'japanese-lyrics-editor-state'
const PREVIEW_PREFERENCES_STORAGE_KEY = 'japanese-lyrics-preview-preferences'
const previewPreferences = ref({
  showChinese: true,
  showFurigana: true,
})
const isMobileViewport = ref(false)
const showPreviewOptions = ref(false)
let mobileQuery: MediaQueryList | null = null

const syncMobileState = () => {
  isMobileViewport.value = mobileQuery?.matches ?? false
  if (!isMobileViewport.value) {
    showPreviewOptions.value = false
  }
}

const togglePreviewOptions = () => {
  showPreviewOptions.value = !showPreviewOptions.value
}

const togglePreviewPreference = (key: 'showChinese' | 'showFurigana') => {
  previewPreferences.value[key] = !previewPreferences.value[key]
}

const savePreviewPreferences = () => {
  localStorage.setItem(PREVIEW_PREFERENCES_STORAGE_KEY, JSON.stringify(previewPreferences.value))
}

const restorePreviewPreferences = () => {
  const savedPreferences = localStorage.getItem(PREVIEW_PREFERENCES_STORAGE_KEY)
  if (!savedPreferences) return

  try {
    const parsedPreferences = JSON.parse(savedPreferences) as Partial<
      typeof previewPreferences.value
    >
    previewPreferences.value = {
      showChinese: parsedPreferences.showChinese ?? true,
      showFurigana: parsedPreferences.showFurigana ?? true,
    }
  } catch (error) {
    console.error('Failed to restore preview preferences:', error)
  }
}

watch(previewPreferences, savePreviewPreferences, { deep: true })

onMounted(() => {
  restorePreviewPreferences()
  mobileQuery = window.matchMedia('(max-width: 768px)')
  syncMobileState()
  mobileQuery.addEventListener('change', syncMobileState)
})

onUnmounted(() => {
  mobileQuery?.removeEventListener('change', syncMobileState)
})

const addNewLine = () => {
  if (newLine.value.trim()) {
    lyrics.value.push({
      japanese: newLine.value,
      furiganaMap: {},
      chinese: '',
      showFuriganaEditor: false,
      editorStyle: {
        top: '0px',
        left: '0px',
      },
      currentFurigana: '',
      selectedCharIndex: -1,
      isEditing: false,
      editingText: '',
      isBreak: false,
    })
    newLine.value = ''
  }
}

const startEdit = (index: number) => {
  const line = lyrics.value[index]
  line.isEditing = true
  line.editingText = line.japanese
  nextTick(() => {
    editInputs[index]?.focus()
  })
}

const saveEdit = (index: number) => {
  const line = lyrics.value[index]
  if (line.editingText.trim()) {
    const oldText = line.japanese
    const newText = line.editingText
    const newFuriganaMap: { [key: number]: string } = {}

    // 使用最长公共子序列算法找出保留的字符
    let i = 0 // 新文本的索引
    let j = 0 // 旧文本的索引

    while (i < newText.length && j < oldText.length) {
      if (newText[i] === oldText[j]) {
        // 如果字符相同，保留原来的假名
        if (line.furiganaMap[j]) {
          newFuriganaMap[i] = line.furiganaMap[j]
        }
        i++
        j++
      } else {
        // 如果字符不同，在旧文本中寻找下一个匹配
        let found = false
        let k = j + 1
        while (k < oldText.length && !found) {
          if (newText[i] === oldText[k]) {
            // 找到匹配，保留假名
            if (line.furiganaMap[k]) {
              newFuriganaMap[i] = line.furiganaMap[k]
            }
            j = k
            found = true
          }
          k++
        }
        if (!found) {
          // 如果没找到匹配，说明是新添加的字符
          i++
        } else {
          i++
          j++
        }
      }
    }

    line.japanese = newText
    line.furiganaMap = newFuriganaMap
  }
  line.isEditing = false
}

const handleDragStart = (index: number) => {
  draggedIndex.value = index
}

const handleDrop = (index: number) => {
  if (draggedIndex.value === -1) return

  const draggedLine = lyrics.value[draggedIndex.value]
  lyrics.value.splice(draggedIndex.value, 1)
  lyrics.value.splice(index, 0, draggedLine)
  draggedIndex.value = -1
}

const handleCharClick = (event: MouseEvent, lineIndex: number, charIndex: number) => {
  // 关闭其他行的假名编辑器
  lyrics.value.forEach((line, i) => {
    if (i !== lineIndex) {
      line.showFuriganaEditor = false
    }
  })

  const targetElement = event.target as HTMLElement
  const rect = targetElement.getBoundingClientRect()
  const parentElement = targetElement.closest('.japanese-text') as HTMLElement
  const parentRect = parentElement.getBoundingClientRect()

  lyrics.value[lineIndex].editorStyle = {
    top: `${rect.top - parentRect.top - 30}px`,
    left: `${rect.left - parentRect.left}px`,
  }
  lyrics.value[lineIndex].showFuriganaEditor = true
  lyrics.value[lineIndex].selectedCharIndex = charIndex
  lyrics.value[lineIndex].currentFurigana = lyrics.value[lineIndex].furiganaMap[charIndex] || ''
  selectedLineIndex.value = lineIndex

  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    furiganaInputs[lineIndex]?.focus()
  })
}

const handleFuriganaBlur = (index: number) => {
  const line = lyrics.value[index]
  if (line.selectedCharIndex !== -1) {
    if (line.currentFurigana.trim()) {
      line.furiganaMap[line.selectedCharIndex] = line.currentFurigana
    } else {
      delete line.furiganaMap[line.selectedCharIndex]
    }
  }
  line.showFuriganaEditor = false
  line.selectedCharIndex = -1
}

const copyLine = (index: number) => {
  const line = lyrics.value[index]
  lyrics.value.splice(index + 1, 0, {
    japanese: line.japanese,
    furiganaMap: { ...line.furiganaMap },
    chinese: line.chinese,
    showFuriganaEditor: false,
    editorStyle: {
      top: '0px',
      left: '0px',
    },
    currentFurigana: '',
    selectedCharIndex: -1,
    isEditing: false,
    editingText: '',
    isBreak: false,
  })
}

const moveLineToBottom = (index: number) => {
  if (index < 0 || index >= lyrics.value.length - 1) return
  const [line] = lyrics.value.splice(index, 1)
  lyrics.value.push(line)
}

const insertLineBelow = (index: number) => {
  lyrics.value.splice(index + 1, 0, {
    japanese: '',
    furiganaMap: {},
    chinese: '',
    showFuriganaEditor: false,
    editorStyle: {
      top: '0px',
      left: '0px',
    },
    currentFurigana: '',
    selectedCharIndex: -1,
    isEditing: false,
    editingText: '',
    isBreak: false,
  })
}

const deleteLine = (index: number) => {
  lyrics.value.splice(index, 1)
}

const resetLyrics = () => {
  lyrics.value = []
  newLine.value = ''
  selectedLineIndex.value = -1
  draggedIndex.value = -1
  localStorage.removeItem(STORAGE_KEY)
}

const toggleBreak = (index: number) => {
  lyrics.value[index].isBreak = !lyrics.value[index].isBreak
}

interface ExportLyricLine {
  japanese: string
  furiganaMap: { [key: number]: string }
  chinese: string
  isBreak: boolean
}

interface ExportData {
  version: string
  lyrics: ExportLyricLine[]
}

const exportLyrics = async () => {
  const exportData: ExportData = {
    version: '1.0',
    lyrics: lyrics.value.map((line) => ({
      japanese: line.japanese,
      furiganaMap: line.furiganaMap,
      chinese: line.chinese,
      isBreak: line.isBreak,
    })),
  }

  const content = JSON.stringify(exportData, null, 2)
  const firstLineTitle = exportData.lyrics[0]?.japanese?.trim() ?? ''
  const safeBaseName = firstLineTitle
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .trim()
    .replace(/[. ]+$/g, '')
  const fileName = `${safeBaseName || 'lyrics'}.json`

  // 支持的浏览器中弹出系统保存对话框，让用户选择保存路径
  if ('showSaveFilePicker' in window) {
    try {
      const pickerWindow = window as Window & {
        showSaveFilePicker?: (options?: {
          suggestedName?: string
          types?: Array<{
            description?: string
            accept: Record<string, string[]>
          }>
        }) => Promise<{
          createWritable: () => Promise<{
            write: (data: string) => Promise<void>
            close: () => Promise<void>
          }>
        }>
      }

      const fileHandle = await pickerWindow.showSaveFilePicker?.({
        suggestedName: fileName,
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })

      if (fileHandle) {
        const writable = await fileHandle.createWritable()
        await writable.write(content)
        await writable.close()
        return
      }
    } catch (error) {
      const isCancelError = error instanceof DOMException && error.name === 'AbortError'
      if (isCancelError) return
      console.error('使用系统保存对话框失败，已回退到浏览器下载：', error)
    }
  }

  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const importLyrics = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as ExportData
      if (data.version && Array.isArray(data.lyrics)) {
        // 将导入的数据转换为完整的 LyricLine 结构
        lyrics.value = data.lyrics.map((line) => ({
          japanese: line.japanese,
          furiganaMap: line.furiganaMap,
          chinese: line.chinese,
          isBreak: line.isBreak,
          showFuriganaEditor: false,
          editorStyle: {
            top: '0px',
            left: '0px',
          },
          currentFurigana: '',
          selectedCharIndex: -1,
          isEditing: false,
          editingText: '',
        }))
      } else {
        alert('无效的歌词文件格式')
      }
    } catch {
      alert('导入失败：文件格式错误')
    }
  }

  reader.readAsText(file)
  input.value = '' // 重置 input，允许导入相同的文件
}

// 保存数据
const saveToLocalStorage = () => {
  const state = {
    lyrics: lyrics.value,
    lastSaved: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// 恢复数据
const restoreFromLocalStorage = () => {
  const savedState = localStorage.getItem(STORAGE_KEY)
  if (savedState) {
    try {
      const { lyrics: savedLyrics } = JSON.parse(savedState)
      lyrics.value = savedLyrics.map((line: ExportLyricLine) => ({
        ...line,
        showFuriganaEditor: false,
        editorStyle: {
          top: '0px',
          left: '0px',
        },
        currentFurigana: '',
        selectedCharIndex: -1,
        isEditing: false,
        editingText: '',
      }))
    } catch (error) {
      console.error('Failed to restore from localStorage:', error)
    }
  }
}

// 从导入数据加载
const loadData = (data: ExportData) => {
  if (data.version && Array.isArray(data.lyrics)) {
    lyrics.value = data.lyrics.map((line) => ({
      japanese: line.japanese,
      furiganaMap: line.furiganaMap,
      chinese: line.chinese,
      isBreak: line.isBreak,
      showFuriganaEditor: false,
      editorStyle: {
        top: '0px',
        left: '0px',
      },
      currentFurigana: '',
      selectedCharIndex: -1,
      isEditing: false,
      editingText: '',
    }))
  }
}

// 导出方法供父组件使用
defineExpose({
  lyrics,
  saveToLocalStorage,
  restoreFromLocalStorage,
  resetLyrics,
  exportLyrics,
  importLyrics,
  loadData,
})
</script>

<style scoped>
.lyrics-editor {
  display: flex;
  align-items: flex-start;
  gap: clamp(1rem, 3vw, 2rem);
  padding: clamp(1rem, 3vw, 2rem);
}

.lyrics-editor.preview-only {
  justify-content: center;
}

.editor-container {
  flex: 1;
  max-width: 600px;
  min-width: 0;
}

.lyrics-editor:not(.preview-only) .editor-container {
  max-width: none;
  width: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-controls {
  display: flex;
  gap: 0.5rem;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border-strong);
  border-radius: 1rem;
  background: var(--toolbar-bg);
  box-shadow: var(--toolbar-shadow);
  backdrop-filter: blur(10px);
}

.preview-mode-toolbar {
  margin-bottom: 1.5rem;
}

.preview-toolbar-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}

.preview-toolbar-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-toolbar-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.preview-toggle-group {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.preview-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  min-width: 7rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.55rem 0.5rem 0.85rem;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface-strong);
  color: var(--text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    color 0.15s ease;
}

.preview-toggle-text {
  font-size: 0.88rem;
  font-weight: 600;
}

.preview-toggle-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.9rem;
  height: 1.5rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.preview-toggle:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring-strong);
}

.preview-toggle.active {
  background: var(--accent-soft);
  border-color: var(--border-accent-strong);
  color: var(--accent);
}

.preview-toggle.active .preview-toggle-state {
  background: var(--accent);
  color: var(--text-contrast);
}

@media (hover: hover) and (pointer: fine) {
  .preview-toggle:hover {
    transform: translateY(-1px);
    background: var(--surface-soft);
    border-color: var(--border-accent);
    color: var(--text-primary);
    box-shadow: var(--panel-shadow);
  }
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.hidden {
  display: none;
}

.preview-container {
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.preview-only .preview-container {
  max-width: 800px;
  margin: 0 auto;
}

.preview-stage {
  padding: 1.5rem 1.75rem;
  border-radius: 1.5rem;
  background: linear-gradient(
    180deg,
    var(--preview-gradient-start) 0%,
    var(--preview-gradient-end) 100%
  );
  box-shadow: inset 0 1px 0 var(--preview-highlight);
  overflow: hidden;
}

.preview-stage.preview-stage--exporting {
  border-radius: 0;
  box-shadow: none;
}

.preview-stage.preview-stage--exporting .preview-line:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .preview-toolbar {
    align-items: flex-start;
  }

  .preview-mobile-toggle {
    margin-left: auto;
  }

  .preview-toggle-group {
    display: none;
    align-self: stretch;
    width: 100%;
  }

  .preview-toggle-group.is-open {
    display: flex;
  }

  .preview-toggle {
    flex: 1 1 9rem;
  }
}

.lyrics-line {
  margin-bottom: 1rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  position: relative;
  background: var(--surface-strong);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  display: flex;
}

.lyrics-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.drag-handle {
  position: relative;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  border-right: 1px solid var(--border);
  padding: 1rem 0;
}

.drag-hover-tip {
  position: absolute;
  left: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
  padding: 0.2rem 0.45rem;
  border-radius: 0.35rem;
  border: 1px solid var(--border-strong);
  background: var(--surface-strong);
  color: var(--text-secondary);
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 5;
}

.drag-handle:hover .drag-hover-tip {
  opacity: 1;
}

.drag-dots {
  width: 0.25rem;
  height: 1rem;
  background-image: radial-gradient(circle, var(--drag-dot) 1px, transparent 1.5px);
  background-size: 0.25rem 0.25rem;
}

.lyrics-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.japanese-text {
  position: relative;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  min-height: 2rem;
  line-height: 2;
  transition: border-color 0.15s ease;
  /* font-family: 'Noto Serif JP', 'Noto Serif'; */
  margin-top: 20px;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.japanese-text:focus-within {
  border-color: var(--drag-dot);
}

.line-controls {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  vertical-align: middle;
  margin-left: 0.5rem;
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

.icon-btn.delete {
  color: var(--danger);
  border-color: var(--danger-border);
}

.icon-btn.delete:hover {
  background: var(--danger-soft);
  border-color: var(--danger-border);
}

.char-wrapper {
  cursor: pointer;
  display: inline-block;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s ease;
}

.char-wrapper:hover {
  background-color: var(--surface-soft);
}

ruby {
  ruby-position: over;
}

rt {
  font-size: 0.75em;
  color: var(--text-secondary);
}

.chinese-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--surface-strong);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.chinese-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}

.furigana-editor {
  position: absolute;
  z-index: 100;
}

.furigana-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface-strong);
  min-width: 100px;
  color: var(--text-primary);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.furigana-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}

.add-line {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin-top: 1rem;
}

.new-line-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text-primary);
  background: var(--surface-strong);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.new-line-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}

.add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: var(--accent);
  color: var(--text-contrast);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease;
}

.add-btn:hover {
  background: var(--accent-hover);
}

.preview-line {
  margin-bottom: 0;
}

.inline-preview {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface-strong);
  margin-bottom: 1rem;
}

.inline-preview .japanese-text {
  margin-top: 20px;
}

.inline-preview .preview-break {
  height: 1rem;
  margin: 1rem 0;
  border-bottom: 1px dashed var(--border-strong);
}

.preview-line:last-child {
  margin-bottom: 20px;
}

.preview-line .japanese-text {
  font-size: 1.2rem;
  border: none;
  padding: 0;
  color: var(--text-primary);
}

.preview-line .japanese-text rt {
  color: var(--text-secondary);
}

.japanese-text.song-name {
  font-weight: bold;
  color: var(--text-primary);
}

.preview-line .chinese-text {
  color: var(--text-secondary);
  font-size: 1rem;
  /* font-family: 'Noto Serif SC', 'Noto Serif'; */
  overflow-wrap: anywhere;
}

.chinese-text.song-name {
  font-weight: bold;
  color: var(--text-primary);
}

.poster {
  width: 600px;
}

.edit-mode {
  flex: 1;
  margin-right: 1rem;
}

.edit-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--accent);
  border-radius: 0.5rem;
  background: var(--surface-strong);
  color: var(--text-primary);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}

.icon-btn.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.break-line {
  height: 1rem;
  margin: 1rem 0;
  border-bottom: 1px dashed var(--border-strong);
}

.preview-break {
  height: 0.5rem;
  margin: 0.5rem 0;
}

@media (max-width: 1024px) {
  .lyrics-editor:not(.preview-only) {
    flex-direction: column;
  }

  .lyrics-editor:not(.preview-only) .editor-container,
  .lyrics-editor:not(.preview-only) .preview-container {
    max-width: none;
  }
}

@media (max-width: 960px) {
  .lyrics-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.85rem;
  }

  .inline-preview {
    margin-bottom: 1.25rem;
  }
}

@media (max-width: 768px) {
  .lyrics-editor {
    padding: 0.75rem 0;
  }

  .lyrics-line {
    border-radius: 0.85rem;
  }

  .drag-handle {
    width: 2.25rem;
    padding: 0.85rem 0;
  }

  .drag-hover-tip {
    display: none;
  }

  .lyrics-content {
    padding: 0.85rem;
  }

  .japanese-text,
  .chinese-input,
  .edit-input,
  .new-line-input {
    font-size: 16px;
  }

  .add-line {
    flex-direction: column;
  }

  .add-btn {
    width: 100%;
    min-height: 2.75rem;
  }

  .preview-stage {
    padding: 1.1rem 1rem;
    border-radius: 1.1rem;
  }

  .preview-line .japanese-text {
    font-size: 1.05rem;
  }
}

@media (max-width: 480px) {
  .lyrics-line {
    flex-direction: column;
  }

  .drag-handle {
    width: 100%;
    min-height: 2.5rem;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .line-controls {
    display: flex;
    margin-left: 0;
    margin-top: 0.65rem;
  }

  .preview-toggle {
    min-width: 0;
    width: 100%;
  }
}
</style>

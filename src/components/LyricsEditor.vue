<template>
  <div class="lyrics-editor" :class="{ 'preview-only': !isEditMode }">
    <div class="editor-container" v-show="isEditMode">
      <div class="editor-header">
        <div class="header-controls">
          <!-- 导入导出按钮已移除 -->
        </div>
      </div>

      <div v-for="(line, index) in lyrics" :key="index" class="lyrics-line">
        <div
          class="drag-handle"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent
          @dragenter.prevent
          @drop="handleDrop(index)"
        >
          <div class="drag-dots"></div>
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
              <button
                @click="toggleBreak(index)"
                class="icon-btn"
                :class="{ active: line.isBreak }"
                title="分段"
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

    <div class="preview-container">
      <div v-for="(line, index) in lyrics" :key="'preview-' + index" class="preview-line">
        <div class="japanese-text">
          <ruby v-for="(char, charIndex) in line.japanese" :key="charIndex">
            {{ char }}<rt v-if="line.furiganaMap[charIndex]">{{ line.furiganaMap[charIndex] }}</rt>
          </ruby>
        </div>
        <div class="chinese-text">{{ line.chinese }}</div>
        <div v-if="line.isBreak" class="preview-break"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, defineExpose, defineProps } from 'vue'
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

const deleteLine = (index: number) => {
  lyrics.value.splice(index, 1)
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

const exportLyrics = () => {
  const exportData: ExportData = {
    version: '1.0',
    lyrics: lyrics.value.map((line) => ({
      japanese: line.japanese,
      furiganaMap: line.furiganaMap,
      chinese: line.chinese,
      isBreak: line.isBreak,
    })),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lyrics.json'
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

// 导出方法供父组件使用
defineExpose({
  lyrics,
  saveToLocalStorage,
  restoreFromLocalStorage,
  exportLyrics,
  importLyrics,
})
</script>

<style scoped>
.lyrics-editor {
  display: flex;
  gap: 2rem;
  padding: 2rem;
}

.lyrics-editor.preview-only {
  justify-content: center;
}

.editor-container {
  flex: 1;
  max-width: 600px;
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

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(240 4.9% 33.9%);
  margin: 0;
}

.hidden {
  display: none;
}

.preview-container {
  flex: 1;
  max-width: 600px;
  text-align: center;
}

.preview-only .preview-container {
  max-width: 800px;
  margin: 0 auto;
}

.lyrics-line {
  margin-bottom: 1rem;
  padding: 0;
  border: 1px solid hsl(240 5.9% 90%);
  border-radius: 0.5rem;
  position: relative;
  background: #fff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  display: flex;
}

.drag-handle {
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  border-right: 1px solid hsl(240 5.9% 90%);
  padding: 1rem 0;
}

.drag-dots {
  width: 0.25rem;
  height: 1rem;
  background-image: radial-gradient(circle, hsl(240 4.9% 83.9%) 1px, transparent 1.5px);
  background-size: 0.25rem 0.25rem;
}

.lyrics-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.japanese-text {
  position: relative;
  padding: 0.75rem;
  border: 1px solid hsl(240 5.9% 90%);
  border-radius: 0.5rem;
  min-height: 2rem;
  line-height: 2;
  transition: border-color 0.15s ease;
}

.japanese-text:focus-within {
  border-color: hsl(240 5.9% 83.9%);
}

.line-controls {
  display: inline-flex;
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
  border: 1px solid hsl(240 5.9% 90%);
  border-radius: 0.375rem;
  background: transparent;
  color: hsl(240 4.9% 43.9%);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: hsl(240 5.9% 96.9%);
  color: hsl(240 4.9% 33.9%);
}

.icon-btn.delete {
  color: hsl(0 84.2% 60.2%);
  border-color: hsl(0 84.2% 60.2% / 0.2);
}

.icon-btn.delete:hover {
  background: hsl(0 84.2% 60.2% / 0.1);
  border-color: hsl(0 84.2% 60.2% / 0.3);
}

.char-wrapper {
  cursor: pointer;
  display: inline-block;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s ease;
}

.char-wrapper:hover {
  background-color: hsl(240 5.9% 96.9%);
}

ruby {
  ruby-position: over;
}

rt {
  font-size: 0.75em;
  color: hsl(240 4.9% 43.9%);
}

.chinese-input {
  padding: 0.75rem;
  border: 1px solid hsl(240 5.9% 90%);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.chinese-input:focus {
  outline: none;
  border-color: hsl(142.1 76.2% 36.3%);
  box-shadow: 0 0 0 2px hsl(142.1 76.2% 36.3% / 0.2);
}

.furigana-editor {
  position: absolute;
  z-index: 100;
}

.furigana-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid hsl(240 5.9% 90%);
  border-radius: 0.5rem;
  background: #fff;
  min-width: 100px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.furigana-input:focus {
  outline: none;
  border-color: hsl(142.1 76.2% 36.3%);
  box-shadow: 0 0 0 2px hsl(142.1 76.2% 36.3% / 0.2);
}

.add-line {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.new-line-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid hsl(240 5.9% 90%);
  border-radius: 0.5rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.new-line-input:focus {
  outline: none;
  border-color: hsl(142.1 76.2% 36.3%);
  box-shadow: 0 0 0 2px hsl(142.1 76.2% 36.3% / 0.2);
}

.add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: hsl(142.1 76.2% 36.3%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease;
}

.add-btn:hover {
  background: hsl(142.1 76.2% 33.3%);
}

.preview-line {
  margin-bottom: 0;
}

.preview-line .japanese-text {
  font-size: 1.2rem;
  border: none;
  padding: 0;
}

.preview-line .chinese-text {
  color: hsl(240 4.9% 43.9%);
  font-size: 1rem;
}

.edit-mode {
  flex: 1;
  margin-right: 1rem;
}

.edit-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid hsl(142.1 76.2% 36.3%);
  border-radius: 0.5rem;
  background: #fff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.edit-input:focus {
  outline: none;
  border-color: hsl(142.1 76.2% 36.3%);
  box-shadow: 0 0 0 2px hsl(142.1 76.2% 36.3% / 0.2);
}

.icon-btn.active {
  background: hsl(142.1 76.2% 36.3% / 0.1);
  border-color: hsl(142.1 76.2% 36.3%);
  color: hsl(142.1 76.2% 36.3%);
}

.break-line {
  height: 1rem;
  margin: 1rem 0;
  border-bottom: 1px dashed hsl(240 5.9% 90%);
}

.preview-break {
  height: 0.5rem;
  margin: 0.5rem 0;
}
</style>

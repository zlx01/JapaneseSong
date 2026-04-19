<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LyricsEditor from '@/components/LyricsEditor.vue'
import exampleData from '@/assets/幸せになろう.json'

const editorRef = ref<InstanceType<typeof LyricsEditor> | null>(null)

onMounted(() => {
  editorRef.value?.loadData(exampleData as any)
})
</script>

<template>
  <div class="example">
    <div class="title-container">
      <h1>示例预览</h1>
      <router-link to="/" class="back-btn">返回编辑器</router-link>
    </div>
    <LyricsEditor ref="editorRef" :isEditMode="false" />
  </div>
</template>

<style>
.example {
  max-width: 1200px;
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
</style>

<template>
  <div class="summary-card">
    <div class="markdown-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{
  content: string
}>()

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content) as string
})
</script>

<style scoped>
.summary-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: left;
  box-shadow: var(--shadow);
}

.markdown-content {
  line-height: 1.7;
}

/* Markdown Styling */
.markdown-content :deep(h1) {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--primary);
  border-bottom: 2px solid var(--border);
  padding-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--primary);
}

.markdown-content :deep(h3) {
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
  color: var(--text-main);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.markdown-content :deep(strong) {
  color: var(--primary-light);
  font-weight: 600;
}

.markdown-content :deep(em) {
  color: var(--text-muted);
  font-style: italic;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}

/* Table Styling for Action Items */
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.markdown-content :deep(th) {
  background: var(--bg-elevated);
  color: var(--primary);
  text-align: left;
  padding: 0.75rem;
  border-bottom: 2px solid var(--border);
}

.markdown-content :deep(td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.markdown-content :deep(tr:hover td) {
  background: rgba(6, 182, 212, 0.05);
}

/* Code blocks (if any) */
.markdown-content :deep(code) {
  background: var(--bg-elevated);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background: var(--bg-elevated);
  padding: 1rem;
  border-radius: var(--radius);
  overflow-x: auto;
}

/* Blockquotes */
.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--primary);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--text-muted);
  font-style: italic;
}
</style>

<template>
  <div class="container summary">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Memuat ringkasan...</p>
    </div>

    <template v-else-if="meeting">
      <header>
        <h1>📝 {{ meeting.title || 'Hasil Rapat' }}</h1>
        <p class="meta">
          {{ formatDate(meeting.startedAt) }}
          <span v-if="meeting.durationSeconds"> • {{ formatDuration(meeting.durationSeconds) }}</span>
        </p>
      </header>

      <div v-if="meeting.state === 'PROCESSING'" class="processing-notice card">
        <p>⏳ Ringkasan sedang diproses...</p>
        <NuxtLink :to="`/processing/${meetingId}`" class="btn">Lihat Progress</NuxtLink>
      </div>

      <template v-else>
        <div v-if="meeting.state !== 'COMPLETED'" class="mode-selector">
          <button 
            v-for="mode in modes" 
            :key="mode.value"
            @click="regenerate(mode.value)"
            class="mode-btn"
            :class="{ active: currentMode === mode.value }"
            :disabled="regenerating"
          >
            {{ mode.label }}
          </button>
        </div>

        <div class="summary-card card">
          <div v-if="regenerating" class="regenerating-overlay">
            <div class="spinner"></div>
            <p>Memperbaharui ringkasan...</p>
          </div>
          <div class="summary-content" v-html="summaryHtml"></div>
        </div>

        <div class="actions">
          <template v-if="meeting.state === 'SUMMARY_READY'">
            <button @click="completeMeeting" class="btn btn-success btn-lg" :disabled="completing">
              ✅ Selesai & Tutup Sesi
            </button>
          </template>
          <NuxtLink v-else to="/history" class="btn">
            Kembali ke Riwayat
          </NuxtLink>
        </div>
      </template>
    </template>

    <div v-else class="error">
      <p>⚠️ Rapat tidak ditemukan</p>
      <NuxtLink to="/" class="btn">Kembali</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const meetingId = route.params.id as string

const meeting = ref<any>(null)
const summary = ref<any>(null)
const loading = ref(true)
const regenerating = ref(false)
const completing = ref(false)
const currentMode = ref('STANDARD')

const modes = [
  { value: 'STANDARD', label: 'Standar' },
  { value: 'IMPORTANT', label: 'Poin Penting' },
  { value: 'DETAILED', label: 'Detail' }
]

const summaryHtml = computed(() => {
  if (!summary.value?.content) return '<p>Tidak ada ringkasan</p>'
  
  const content = summary.value.content
  
  // If content is object (structured summary), render as HTML
  if (typeof content === 'object' && content !== null) {
    let html = ''
    
    if (content.ringkasan_umum) {
      html += `<h2>📋 Ringkasan Umum</h2><p>${content.ringkasan_umum}</p>`
    }
    
    if (content.agenda && Array.isArray(content.agenda)) {
      html += `<h2>📌 Agenda</h2><ul>${content.agenda.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
    }
    
    if (content.keputusan && Array.isArray(content.keputusan)) {
      html += `<h2>✅ Keputusan</h2><ul>${content.keputusan.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
    }
    
    if (content.tindak_lanjut && Array.isArray(content.tindak_lanjut)) {
      html += `<h2>📝 Tindak Lanjut</h2><ul>${content.tindak_lanjut.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
    }
    
    return html || '<p>Tidak ada data ringkasan</p>'
  }
  
  // If content is string, parse as markdown
  return marked.parse(content) as string
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins} menit ${secs} detik`
  return `${secs} detik`
}

const fetchData = async () => {
  loading.value = true
  try {
    // Fetch meeting status
    const statusRes = await apiFetch(`/api/meetings/${meetingId}/status`)
    if (statusRes.success) {
      meeting.value = statusRes.data
      currentMode.value = 'STANDARD'
      
      // Fetch summary if available
      if (['SUMMARY_READY', 'COMPLETED'].includes(statusRes.data.state)) {
        const summaryRes = await apiFetch(`/api/meetings/${meetingId}/summary`)
        if (summaryRes.success) {
          summary.value = summaryRes.data
          currentMode.value = summaryRes.data.mode
        }
      }
    }
  } catch (e: any) {
    console.error('Failed to fetch:', e)
  } finally {
    loading.value = false
  }
}

const regenerate = async (mode: string) => {
  regenerating.value = true
  try {
    // Call resume-summary which transitions to PROCESSING and starts AI job
    await apiFetch(`/api/meetings/${meetingId}/resume-summary`, {
      method: 'POST',
      body: JSON.stringify({ mode })
    })
    // Redirect to processing page to show progress
    router.push(`/processing/${meetingId}`)
  } catch (e) {
    console.error('Failed to regenerate:', e)
    alert('Gagal memperbaharui ringkasan')
    regenerating.value = false
  }
}

const completeMeeting = async () => {
  completing.value = true
  try {
    await apiFetch(`/api/meetings/${meetingId}/complete`, { method: 'POST' })
    router.push('/history')
  } catch (e) {
    console.error('Failed to complete:', e)
    alert('Gagal menutup sesi')
  } finally {
    completing.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.summary {
  padding-top: 3rem;
  padding-bottom: 4rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: var(--text-muted);
}

header {
  margin-bottom: 2rem;
}

.meta {
  color: var(--text-muted);
}

.processing-notice {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.mode-selector {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.mode-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.mode-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.mode-btn:disabled {
  opacity: 0.5;
}

.summary-card {
  position: relative;
  min-height: 200px;
}

.regenerating-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.8);
  border-radius: var(--radius);
  gap: 1rem;
  z-index: 10;
}

.summary-content {
  line-height: 1.8;
}

.summary-content :deep(h1),
.summary-content :deep(h2),
.summary-content :deep(h3) {
  color: var(--primary);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.summary-content :deep(ul),
.summary-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.summary-content :deep(li) {
  margin: 0.3rem 0;
}

.summary-content :deep(strong) {
  color: var(--primary-light);
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.error {
  text-align: center;
  padding: 4rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
</style>

<template>
  <div class="container processing">
    <header>
      <h1>⏳ Memproses Rapat</h1>
      <p class="meta">{{ meeting?.title || 'Rapat' }}</p>
    </header>

    <div class="progress-section">
      <div class="spinner"></div>
      <p class="status">{{ statusText }}</p>
      <div v-if="progress" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
      <p v-if="progress" class="progress-text">{{ progress.processedChunks }} / {{ progress.totalChunks }} chunk</p>
    </div>

    <div v-if="streamContent" class="stream-preview card">
      <h3>Preview Ringkasan</h3>
      <div class="preview-content" v-html="streamContent"></div>
    </div>

    <div v-if="error" class="error-section card">
      <p class="error-text">⚠️ {{ errorMessage }}</p>
      <button @click="resumeSummary" class="btn" :disabled="resuming">
        {{ resuming ? 'Melanjutkan...' : '🔄 Lanjutkan Proses' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { apiFetch, apiBase } = useApi()
const meetingId = route.params.id as string

const meeting = ref<any>(null)
const progress = ref<{ processedChunks: number; totalChunks: number } | null>(null)
const statusText = ref('Menghubungkan ke server...')
const streamContent = ref('')
const error = ref<string | null>(null)
const errorMessage = ref('')
const resuming = ref(false)

let eventSource: EventSource | null = null

const progressPercent = computed(() => {
  if (!progress.value || !progress.value.totalChunks) return 0
  return Math.round((progress.value.processedChunks / progress.value.totalChunks) * 100)
})

const fetchMeeting = async () => {
  try {
    const res = await apiFetch(`/api/meetings/${meetingId}/status`)
    if (res.success) {
      meeting.value = res.data
      
      // Check if already done
      if (res.data.state === 'SUMMARY_READY' || res.data.state === 'COMPLETED') {
        router.push(`/summary/${meetingId}`)
        return
      }
    }
  } catch (e) {
    console.error('Failed to fetch meeting:', e)
  }
}

const connectSSE = () => {
  eventSource = new EventSource(`${apiBase}/api/meetings/${meetingId}/summary/stream`)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log('SSE message:', data)
    } catch (e) {
      console.error('Failed to parse SSE:', e)
    }
  }
  
  eventSource.addEventListener('progress', (event) => {
    const data = JSON.parse(event.data)
    progress.value = data
    statusText.value = `Memproses audio...`
  })
  
  eventSource.addEventListener('section', (event) => {
    const data = JSON.parse(event.data)
    streamContent.value += `<strong>${data.type}:</strong> ${data.content}<br/>`
    statusText.value = `Menyusun ${data.type}...`
  })
  
  eventSource.addEventListener('info', (event) => {
    const data = JSON.parse(event.data)
    statusText.value = data.message
  })
  
  eventSource.addEventListener('done', () => {
    statusText.value = 'Selesai!'
    eventSource?.close()
    router.push(`/summary/${meetingId}`)
  })
  
  eventSource.addEventListener('error', (event: any) => {
    try {
      const data = JSON.parse(event.data)
      error.value = data.code
      errorMessage.value = getErrorMessage(data.code)
    } catch {
      error.value = 'CONNECTION_ERROR'
      errorMessage.value = 'Koneksi terputus'
    }
    eventSource?.close()
  })
  
  eventSource.onerror = () => {
    statusText.value = 'Menunggu proses...'
  }
}

const getErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    AI_QUOTA_EXCEEDED: 'Kuota AI habis. Silakan coba lagi nanti.',
    FAILED_THIRD_PARTY: 'Layanan AI tidak tersedia. Silakan coba lagi.',
    INTERNAL_ERROR: 'Terjadi kesalahan sistem.'
  }
  return messages[code] || 'Terjadi kesalahan'
}

const resumeSummary = async () => {
  resuming.value = true
  error.value = null
  
  try {
    await apiFetch(`/api/meetings/${meetingId}/resume-summary`, {
      method: 'POST',
      body: JSON.stringify({ mode: 'STANDARD' })
    })
    statusText.value = 'Melanjutkan proses...'
    connectSSE()
  } catch (e) {
    console.error('Failed to resume:', e)
    errorMessage.value = 'Gagal melanjutkan proses'
    error.value = 'RESUME_FAILED'
  } finally {
    resuming.value = false
  }
}

onMounted(async () => {
  await fetchMeeting()
  if (meeting.value?.state === 'PROCESSING') {
    connectSSE()
  }
})

onUnmounted(() => {
  eventSource?.close()
})
</script>

<style scoped>
.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  gap: 2rem;
}

.meta {
  color: var(--text-muted);
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.status {
  color: var(--text-muted);
  font-size: 1rem;
}

.progress-bar {
  width: 300px;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}

.progress-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.stream-preview {
  width: 100%;
  max-width: 600px;
  text-align: left;
}

.stream-preview h3 {
  color: var(--primary);
  margin-bottom: 1rem;
}

.preview-content {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-text {
  color: var(--danger);
}
</style>

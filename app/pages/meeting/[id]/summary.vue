<template>
  <div class="container summary-container">
    <header>
      <div class="title-section">
        <h1 v-if="!isEditingTitle" @click="startEditTitle" class="editable-title">
          {{ meeting?.title || 'Hasil Rapat' }}
          <span class="edit-icon">✏️</span>
        </h1>
        <div v-else class="title-input-wrapper">
          <input 
            ref="titleInput"
            v-model="editTitleValue" 
            @blur="saveTitle" 
            @keyup.enter="saveTitle"
            @keyup.esc="cancelEditTitle"
            class="title-input"
            placeholder="Ketik judul rapat..."
          />
        </div>
      </div>
      <div v-if="meeting" class="meta">
        {{ new Date(meeting.startedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        <span v-if="meeting.durationSeconds"> • Durasi: {{ formatDuration(meeting.durationSeconds) }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Sedang menyusun ringkasan cerdas...</p>
      <small>Mohon tunggu sebentar.</small>
    </div>

    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="generateSummary('STANDARD')" class="btn">Coba Lagi</button>
    </div>

    <div v-else class="content-wrapper">
      <div class="toolbar" v-if="meeting?.status === 'ACTIVE'">
        <button 
          v-for="m in modes" 
          :key="m.value"
          @click="generateSummary(m.value)"
          class="mode-btn"
          :class="{ active: currentMode === m.value }"
          :disabled="streaming"
        >
          {{ m.label }}
        </button>
      </div>

      <div class="summary-content-wrapper">
        <div v-if="streaming" class="streaming-indicator">
          <span class="streaming-dot"></span>
          <span>Sedang menulis...</span>
        </div>
        <SummaryCard v-if="summaryContent" :content="summaryContent" />
        <div v-else-if="!streaming" class="empty-state">
          <p>Belum ada ringkasan. Pilih mode di atas untuk memulai.</p>
        </div>
      </div>

      <div class="footer-actions">
        <template v-if="meeting?.status === 'ACTIVE'">
          <div v-if="!confirmingClose" class="primary-action">
            <button @click="confirmingClose = true" class="btn btn-finish" :disabled="streaming">
              ✅ Selesai & Tutup Sesi
            </button>
          </div>
          <div v-else class="confirmation-action">
            <p>Tutup sesi ini? Anda tidak bisa mengubah ringkasan setelah ditutup.</p>
            <div class="confirm-buttons">
              <button @click="closeMeeting" class="btn btn-danger">Ya, Tutup Sesi</button>
              <button @click="confirmingClose = false" class="btn btn-secondary">Batal</button>
            </div>
          </div>
        </template>
        
        <NuxtLink v-else to="/history" class="btn">
          Kembali ke Riwayat
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SummaryCard from '~/components/SummaryCard.vue'

const route = useRoute()
const router = useRouter()
const meetingId = route.params.id as string

const meeting = ref<any>(null)
const loading = ref(true)
const streaming = ref(false)
const error = ref<string | null>(null)
const currentMode = ref('STANDARD')
const confirmingClose = ref(false)
const summaryContent = ref('')

const isEditingTitle = ref(false)
const editTitleValue = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

const startEditTitle = () => {
  editTitleValue.value = meeting.value?.title || 'Hasil Rapat'
  isEditingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
  })
}

const cancelEditTitle = () => {
  isEditingTitle.value = false
}

const saveTitle = async () => {
  if (!isEditingTitle.value) return
  
  const originalTitle = meeting.value?.title
  const newTitle = editTitleValue.value.trim() || 'Hasil Rapat'
  
  if (newTitle === originalTitle) {
    isEditingTitle.value = false
    return
  }

  try {
    const data = await $fetch(`/api/meetings/${meetingId}`, {
      method: 'PATCH',
      body: { title: newTitle }
    })
    meeting.value = data
    isEditingTitle.value = false
  } catch (e) {
    alert('Gagal mengubah judul')
  }
}

const modes = [
  { value: 'STANDARD', label: 'Standar' },
  { value: 'IMPORTANT', label: 'Poin Penting' },
  { value: 'DETAILED', label: 'Detail' }
]

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`
  } else if (minutes > 0) {
    return `${minutes} menit ${secs} detik`
  } else {
    return `${secs} detik`
  }
}

const fetchMeeting = async () => {
  try {
    const data = await $fetch(`/api/meetings/${meetingId}`)
    meeting.value = data
    if (data && data.summary) {
      currentMode.value = data.summary.mode
      summaryContent.value = data.summary.content
    }
  } catch (e) {
    console.error('Failed to fetch meeting:', e)
    error.value = 'Gagal memuat data rapat'
  }
}

const generateSummary = async (mode: string) => {
  streaming.value = true
  error.value = null
  currentMode.value = mode
  summaryContent.value = ''
  
  try {
    // Use EventSource for SSE streaming
    const eventSource = new EventSource(`/api/meetings/${meetingId}/summarize-stream?mode=${mode}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.error) {
          error.value = 'Gagal membuat ringkasan'
          eventSource.close()
          streaming.value = false
          return
        }
        
        if (data.done) {
          eventSource.close()
          streaming.value = false
          // Refresh meeting data to get updated summary from DB
          fetchMeeting()
          return
        }
        
        if (data.chunk) {
          summaryContent.value += data.chunk
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', e)
      }
    }
    
    eventSource.onerror = (e) => {
      console.error('SSE Error:', e)
      error.value = 'Koneksi terputus'
      eventSource.close()
      streaming.value = false
    }
    
  } catch (e: any) {
    console.error('Failed to generate summary:', e)
    error.value = e.data?.message || e.message || 'Gagal membuat ringkasan'
    streaming.value = false
  }
}

const closeMeeting = async () => {
  try {
    await $fetch(`/api/meetings/${meetingId}/close`, { method: 'POST' })
    router.push('/history')
  } catch (e) {
    alert('Gagal menutup sesi')
  }
}

onMounted(async () => {
  loading.value = true
  error.value = null
  
  try {
    await fetchMeeting()
    
    if (meeting.value && !meeting.value.summary) {
      // Generate initial summary if none exists
      loading.value = false
      await generateSummary('STANDARD')
    } else {
      loading.value = false
    }
  } catch (e: any) {
    error.value = e.message || 'Gagal memuat data rapat'
    loading.value = false
  }
})
</script>

<style scoped>
.summary-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 4rem;
}

.meta {
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editable-title {
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.editable-title:hover {
  opacity: 0.8;
}

.edit-icon {
  font-size: 1.2rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.editable-title:hover .edit-icon {
  opacity: 1;
}

.title-input {
  background: var(--bg-card);
  border: 2px solid var(--primary);
  color: white;
  font-size: 2rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius);
  width: 100%;
  outline: none;
}

.summary-content-wrapper {
  position: relative;
  min-height: 200px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.streaming-dot {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse-dot 1s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border-radius: var(--radius);
}

.toolbar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.mode-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.mode-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.mode-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-actions {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.confirmation-action {
  text-align: center;
  background: rgba(30, 41, 59, 0.5);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.confirm-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-finish {
  background: #10b981;
}
.btn-finish:hover {
  background: #059669;
}

.btn-danger {
  background: var(--danger, #ef4444);
}
.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
}
</style>

<template>
  <div class="container history">
    <header>
      <h1>📋 Riwayat Rapat</h1>
      <p class="subtitle">Semua sesi rapat yang pernah Anda buat</p>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Memuat riwayat...</p>
    </div>

    <div v-else-if="meetings.length === 0" class="empty">
      <p>Belum ada riwayat rapat.</p>
      <NuxtLink to="/" class="btn">Mulai Rapat Baru</NuxtLink>
    </div>

    <div v-else class="meeting-list">
      <div v-for="m in meetings" :key="m.id" class="meeting-item card">
        <div class="meeting-info">
          <!-- Editable title -->
          <div class="title-row">
            <template v-if="editingId === m.id">
              <input 
                v-model="editTitle"
                @keyup.enter="saveRename(m.id)"
                @keyup.escape="cancelEdit"
                @blur="saveRename(m.id)"
                class="title-input"
                ref="titleInput"
                autofocus
              />
            </template>
            <template v-else>
              <h3 @click="startEdit(m)" class="editable-title">
                {{ m.title || 'Rapat Tanpa Judul' }}
              </h3>
              <button 
                v-if="canManage(m.state)" 
                @click="startEdit(m)" 
                class="edit-btn"
                title="Ubah nama"
              >
                ✏️
              </button>
            </template>
          </div>
          <p class="meeting-meta">
            {{ formatDate(m.createdAt) }}
            <span v-if="m.durationSeconds"> • {{ formatDuration(m.durationSeconds) }}</span>
          </p>
          <span class="state-badge" :class="m.state.toLowerCase()">{{ stateLabel(m.state) }}</span>
        </div>
        <div class="meeting-actions">
          <NuxtLink 
            v-if="m.state === 'RECORDING'" 
            :to="`/recording/${m.id}`" 
            class="btn"
          >
            Lanjut Rekam
          </NuxtLink>
          <NuxtLink 
            v-else-if="m.state === 'PROCESSING'" 
            :to="`/processing/${m.id}`" 
            class="btn"
          >
            Lihat Progress
          </NuxtLink>
          <NuxtLink 
            v-else 
            :to="`/summary/${m.id}`" 
            class="btn"
          >
            Lihat Ringkasan
          </NuxtLink>
          
          <!-- Delete button -->
          <button 
            v-if="canManage(m.state)"
            @click="confirmDelete(m)"
            class="btn btn-danger-outline"
            title="Hapus rapat"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div class="back-home">
      <NuxtLink to="/" class="home-link">← Kembali ke Beranda</NuxtLink>
    </div>

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      :title="deleteTarget?.title || 'Rapat'"
      :loading="deleting"
      @confirm="executeDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
const { apiFetch } = useApi()
const meetings = ref<any[]>([])
const loading = ref(true)

// Rename state
const editingId = ref<string | null>(null)
const editTitle = ref('')

// Delete state
const showDeleteModal = ref(false)
const deleteTarget = ref<any>(null)
const deleting = ref(false)

const canManage = (state: string) => {
  // Allow rename/delete in: CREATED, SUMMARY_READY, COMPLETED
  // Block in: RECORDING, PROCESSING
  return !['RECORDING', 'PROCESSING'].includes(state)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    return `${hrs} jam ${mins % 60} menit`
  }
  if (mins > 0) return `${mins} menit`
  return `${seconds} detik`
}

const stateLabel = (state: string) => {
  const labels: Record<string, string> = {
    CREATED: 'Dibuat',
    RECORDING: 'Merekam',
    PROCESSING: 'Memproses',
    SUMMARY_READY: 'Selesai'
  }
  return labels[state] || state
}

// Rename functions
const startEdit = (meeting: any) => {
  if (!canManage(meeting.state)) return
  editingId.value = meeting.id
  editTitle.value = meeting.title || ''
}

const cancelEdit = () => {
  editingId.value = null
  editTitle.value = ''
}

const saveRename = async (id: string) => {
  if (!editTitle.value.trim()) {
    cancelEdit()
    return
  }
  
  try {
    const res = await apiFetch(`/api/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editTitle.value.trim() })
    })
    
    if (res.success) {
      // Update local state
      const idx = meetings.value.findIndex(m => m.id === id)
      if (idx !== -1) {
        meetings.value[idx].title = editTitle.value.trim()
      }
    }
  } catch (e) {
    console.error('Failed to rename:', e)
  } finally {
    cancelEdit()
  }
}

// Delete functions
const confirmDelete = (meeting: any) => {
  deleteTarget.value = meeting
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
}

const executeDelete = async () => {
  if (!deleteTarget.value) return
  
  deleting.value = true
  try {
    const res = await apiFetch(`/api/meetings/${deleteTarget.value.id}`, {
      method: 'DELETE'
    })
    
    if (res.success) {
      // Remove from local state
      meetings.value = meetings.value.filter(m => m.id !== deleteTarget.value.id)
    }
  } catch (e) {
    console.error('Failed to delete:', e)
    alert('Gagal menghapus rapat')
  } finally {
    deleting.value = false
    cancelDelete()
  }
}

const fetchMeetings = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/meetings')
    if (res.success) {
      meetings.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch meetings:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMeetings)
</script>

<style scoped>
.history {
  padding-top: 3rem;
  padding-bottom: 4rem;
}

header {
  margin-bottom: 2rem;
}

.subtitle {
  color: var(--text-muted);
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 1rem;
  color: var(--text-muted);
}

.meeting-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meeting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.meeting-info {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.editable-title {
  font-size: 1.1rem;
  color: var(--text-main);
  cursor: pointer;
  margin: 0;
}

.editable-title:hover {
  color: var(--primary);
}

.title-input {
  font-size: 1.1rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg);
  border: 1px solid var(--primary);
  border-radius: 4px;
  color: var(--text-main);
  width: 200px;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.edit-btn:hover {
  opacity: 1;
}

.meeting-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.state-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.state-badge.recording {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.state-badge.processing {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.state-badge.summary_ready {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.meeting-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-danger-outline {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 0.5rem 0.75rem;
}

.btn-danger-outline:hover {
  background: rgba(239, 68, 68, 0.2);
}

.back-home {
  margin-top: 3rem;
  text-align: center;
}

.home-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.home-link:hover {
  color: var(--primary);
}

@media (max-width: 600px) {
  .meeting-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .meeting-actions {
    width: 100%;
  }
  
  .meeting-actions .btn {
    flex: 1;
  }
}
</style>

<template>
  <div class="container">
    <header class="header">
      <h1>Riwayat Rapat</h1>
      <NuxtLink to="/" class="btn-back">← Kembali ke Beranda</NuxtLink>
    </header>

    <div v-if="loading" class="loading">Memuat...</div>

    <div v-else-if="meetings.length === 0" class="empty-state">
      <p>Belum ada riwayat rapat.</p>
      <NuxtLink to="/" class="btn">Mulai Rapat Baru</NuxtLink>
    </div>

    <div v-else class="meeting-list">
      <div v-for="meeting in meetings" :key="meeting.id" class="card meeting-card">
        <div class="meeting-info">
          <h3>{{ meeting.title || 'Rapat Tanpa Judul' }}</h3>
          <div class="meta">
            {{ new Date(meeting.startedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }} • {{ formatDuration(meeting.durationSeconds) }}
          </div>
          <div class="status" :class="meeting.status.toLowerCase()">
            {{ meeting.status }}
          </div>
        </div>
        
        <div class="actions">
          <NuxtLink :to="`/meeting/${meeting.id}/summary`" class="btn btn-sm">
            Lihat Ringkasan
          </NuxtLink>
          <button @click="confirmDelete(meeting.id)" class="btn btn-sm btn-outline-danger">
            🗑️ Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="meetingToDelete" class="modal-overlay">
      <div class="modal-content">
        <h3>Hapus Riwayat?</h3>
        <p>Tindakan ini akan menghapus data rapat dan file audio terkait secara permanen.</p>
        <div class="modal-actions">
          <button @click="deleteMeeting" class="btn btn-danger" :disabled="deleting">
            {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
          <button @click="meetingToDelete = null" class="btn btn-secondary">
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const meetings = ref<any[]>([])
const loading = ref(true)
const deleting = ref(false)
const meetingToDelete = ref<string | null>(null)

const fetchMeetings = async () => {
  try {
    const data = await $fetch('/api/meetings')
    meetings.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (id: string) => {
  meetingToDelete.value = id
}

const deleteMeeting = async () => {
  if (!meetingToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/meetings/${meetingToDelete.value}`, {
      method: 'DELETE'
    })
    await fetchMeetings()
    meetingToDelete.value = null
  } catch (e) {
    alert('Gagal menghapus riwayat')
  } finally {
    deleting.value = false
  }
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '0 detik'
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

onMounted(() => {
  fetchMeetings()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back {
  color: var(--text-muted);
  text-decoration: none;
}
.btn-back:hover {
  color: var(--text-main);
}

.meeting-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meeting-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.status {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  background: var(--bg-dark);
}

.status.active {
  color: yellow;
  border: 1px solid yellow;
}

.status.completed {
  color: #10b981;
  border: 1px solid #10b981;
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
}
.btn-outline-danger:hover {
  background: #ef4444;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius);
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid var(--border);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  margin-bottom: 1rem;
  color: white;
}

.modal-content p {
  color: var(--text-muted);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-sm {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}
</style>

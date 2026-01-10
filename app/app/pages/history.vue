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
          <h3>{{ m.title || 'Rapat Tanpa Judul' }}</h3>
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
        </div>
      </div>
    </div>

    <div class="back-home">
      <NuxtLink to="/" class="home-link">← Kembali ke Beranda</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { apiFetch } = useApi()
const meetings = ref<any[]>([])
const loading = ref(true)

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
    SUMMARY_READY: 'Siap',
    COMPLETED: 'Selesai'
  }
  return labels[state] || state
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

.meeting-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
  color: var(--text-main);
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
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.state-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
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
    width: 100%;
  }
}
</style>

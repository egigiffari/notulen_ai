<template>
  <div class="container home">
    <header>
      <h1>📝 Notulen AI</h1>
      <p class="subtitle">Rekam rapat, dapatkan notulen otomatis</p>
    </header>

    <main class="hero">
      <button 
        @click="startMeeting" 
        class="btn-start"
        :disabled="loading"
      >
        <span v-if="loading">Memulai...</span>
        <span v-else>Mulai Rekam</span>
      </button>
      <p class="hint">Klik untuk memulai sesi rapat baru</p>
    </main>

    <NuxtLink to="/history" class="history-link">
      Lihat Riwayat Rapat →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { apiFetch } = useApi()
const loading = ref(false)

const startMeeting = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({ title: 'Rapat Baru' })
    })
    
    if (res.success && res.data?.meetingId) {
      router.push(`/recording/${res.data.meetingId}`)
    }
  } catch (error) {
    console.error('Failed to create meeting:', error)
    alert('Gagal membuat sesi rapat')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  gap: 2rem;
}

header {
  margin-bottom: 1rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.btn-start {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  font-size: 1.3rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 40px rgba(6, 182, 212, 0.3);
}

.btn-start:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 15px 50px rgba(6, 182, 212, 0.4);
}

.btn-start:disabled {
  opacity: 0.7;
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.history-link {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.95rem;
  transition: opacity 0.2s;
}

.history-link:hover {
  opacity: 0.8;
}
</style>

<template>
  <div class="home-container">
    <header class="hero">
      <h1 class="title">Notulen AI</h1>
      <p class="subtitle">Rekam rapat, dapatkan ringkasan cerdas.</p>
    </header>

    <div class="main-action">
      <button @click="startMeeting" class="btn-start" :disabled="loading">
        <span v-if="loading" class="loading-text">Memuat...</span>
        <span v-else class="start-text">Mulai</span>
      </button>
      <p class="hint">Tekan untuk mulai merekam</p>
    </div>

    <NuxtLink to="/history" class="link-history">
      Lihat Riwayat Rapat →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const loading = ref(false)

const startMeeting = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/meetings', {
      method: 'POST',
      body: { title: 'Rapat Baru' }
    })
    
    if (data && data.id) {
       router.push(`/meeting/${data.id}/record`)
    }
  } catch (error) {
    alert('Gagal membuat sesi rapat')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 2rem;
  padding: 2rem;
}

.hero {
  margin-bottom: 1rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.main-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.btn-start {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  box-shadow: 
    0 0 0 0 rgba(6, 182, 212, 0.4),
    0 10px 40px -10px rgba(6, 182, 212, 0.5);
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

.btn-start:hover {
  transform: scale(1.05);
  box-shadow: 
    0 0 0 0 rgba(6, 182, 212, 0.4),
    0 15px 50px -10px rgba(6, 182, 212, 0.6);
}

.btn-start:active {
  transform: scale(0.98);
}

.btn-start:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  animation: none;
}

@keyframes pulse {
  0% {
    box-shadow: 
      0 0 0 0 rgba(6, 182, 212, 0.4),
      0 10px 40px -10px rgba(6, 182, 212, 0.5);
  }
  70% {
    box-shadow: 
      0 0 0 20px rgba(6, 182, 212, 0),
      0 10px 40px -10px rgba(6, 182, 212, 0.5);
  }
  100% {
    box-shadow: 
      0 0 0 0 rgba(6, 182, 212, 0),
      0 10px 40px -10px rgba(6, 182, 212, 0.5);
  }
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.link-history {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.link-history:hover {
  color: var(--text-main);
  border-color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
}
</style>

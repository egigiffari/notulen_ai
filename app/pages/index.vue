<template>
  <div class="container home-container">
    <header class="hero">
      <h1 class="title">Notulen AI</h1>
      <p class="subtitle">Rekam rapat, dapatkan ringkasan cerdas dalam sekejap.</p>
    </header>

    <div class="actions">
      <button @click="startMeeting" class="btn btn-lg" :disabled="loading">
        {{ loading ? 'Memuat...' : '🎙️ Mulai Rekam Rapat' }}
      </button>
      
      <NuxtLink to="/history" class="link-history">
        Lihat Riwayat Rapat →
      </NuxtLink>
    </div>

    <div class="features">
      <div class="card feature-card">
        <h3>⚡ Cepat</h3>
        <p>Ringkasan otomatis tanpa menunggu lama.</p>
      </div>
      <div class="card feature-card">
        <h3>🧠 Cerdas</h3>
        <p>AI memisahkan agenda, keputusan, dan aksi.</p>
      </div>
      <div class="card feature-card">
        <h3>🔒 Privat</h3>
        <p>Data tersimpan lokal di perangkat Anda.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const loading = ref(false)

const startMeeting = async () => {
  loading.value = true
  try {
    const { data } = await useFetch('/api/meetings', {
      method: 'POST',
      body: { title: 'Rapat Baru' } // Optional title input can be added later
    })
    
    if (data.value && data.value.id) {
       router.push(`/meeting/${data.value.id}/record`)
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
  gap: 3rem;
}

.title {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 500px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.btn-lg {
  font-size: 1.25rem;
  padding: 1rem 2rem;
}

.link-history {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.link-history:hover {
  color: var(--text-main);
}

.features {
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
}

.feature-card {
  text-align: left;
  width: 250px;
  background: rgba(30, 41, 59, 0.5); /* Glassy */
  backdrop-filter: blur(10px);
}

.feature-card h3 {
  margin-top: 0;
  color: var(--primary);
}
</style>

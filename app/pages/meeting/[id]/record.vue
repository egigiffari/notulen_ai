<template>
  <div class="record-container">
    <header>
      <h1>Rapat Sedang Berlangsung</h1>
    </header>
    
    <div class="timer-section">
      <div class="timer">{{ formatTime(duration) }}</div>
      <p v-if="isRecording" class="status">🔴 Merekam...</p>
    </div>

    <div class="visualizer-wrapper">
      <AudioVisualizer :stream="stream" />
    </div>

    <div class="controls">
      <button v-if="isRecording" @click="stopRecording" class="btn-stop">
        <span class="icon">⏹️</span>
        <span>Selesai Rekam</span>
      </button>
      <div v-else class="post-recording">
        <div class="options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="saveAudio">
            <span>Simpan Audio</span>
          </label>
        </div>
        <button @click="processRecording" class="btn-primary-lg" :disabled="processing">
          {{ processing ? 'Memproses...' : '📝 Buat Ringkasan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AudioVisualizer from '~/components/AudioVisualizer.vue'
const route = useRoute()
const router = useRouter()
const meetingId = route.params.id as string

const stream = ref<MediaStream | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const isRecording = ref(true)
const duration = ref(0)
const timerInterval = ref<any>(null)
const saveAudio = ref(false)
const processing = ref(false)
const audioBlob = ref<Blob | null>(null)

onMounted(async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value = new MediaRecorder(stream.value)
    
    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data)
    }
    
    mediaRecorder.value.onstop = () => {
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/webm' })
    }
    
    mediaRecorder.value.start()
    startTimer()
  } catch (err) {
    console.warn('Microphone access denied or error: ' + err + '. Switch to MOCK mode.')
    isRecording.value = true
    startTimer()
    audioBlob.value = new Blob(['mock-audio-data'], { type: 'audio/webm' })
  }
})

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    duration.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) clearInterval(timerInterval.value)
}

const stopRecording = () => {
  if (isRecording.value) {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
        mediaRecorder.value.stop()
    }
    isRecording.value = false
    stopTimer()
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
  }
}

const processRecording = async () => {
  if (!audioBlob.value) return 
  processing.value = true
  
  const formData = new FormData()
  formData.append('audio', audioBlob.value, 'recording.webm')
  formData.append('saveAudio', saveAudio.value.toString())
  formData.append('duration', duration.value.toString())
  
  try {
    await $fetch(`/api/meetings/${meetingId}/transcribe`, {
      method: 'POST',
      body: formData
    })
    
    router.push(`/meeting/${meetingId}/summary`)
  } catch (error) {
    alert('Gagal memproses audio')
    console.error(error)
    processing.value = false
  }
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
</script>

<style scoped>
.record-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2rem;
  text-align: center;
  padding: 2rem;
}

.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.timer {
  font-size: 4rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: white;
}

.status {
  color: #ef4444;
  font-size: 1rem;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

.visualizer-wrapper {
  width: 100%;
  max-width: 500px;
}

.controls {
  margin-top: 1rem;
}

.btn-stop {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-stop:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.btn-primary-lg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(6, 182, 212, 0.5);
}

.btn-primary-lg:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.post-recording {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #06b6d4;
}
</style>

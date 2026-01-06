<template>
  <div class="container record-container">
    <header>
      <h1>Rapat Sedang Berlangsung</h1>
      <div class="timer">{{ formatTime(duration) }}</div>
    </header>
    
    <div class="visualizer-wrapper">
      <AudioVisualizer :stream="stream" />
    </div>

    <div class="controls">
      <button v-if="isRecording" @click="stopRecording" class="btn btn-danger">
        ⏹️ Selesai Rekam
      </button>
      <div v-else class="post-recording">
        <div class="options">
          <label>
            <input type="checkbox" v-model="saveAudio"> Simpan Audio
          </label>
        </div>
        <button @click="processRecording" class="btn btn-primary" :disabled="processing">
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
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/webm' }) // Use webm for simplicity
    }
    
    mediaRecorder.value.start()
    startTimer()
  } catch (err) {
    console.warn('Microphone access denied or error: ' + err + '. Switch to MOCK mode.')
    // Mock mode
    isRecording.value = true
    startTimer()
    // Create a dummy audio blob (1 second of silence or just empty)
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
  // Append file, using webm extension
  formData.append('audio', audioBlob.value, 'recording.webm')
  formData.append('saveAudio', saveAudio.value.toString())
  formData.append('duration', duration.value.toString())
  
  try {
    const { data } = await useFetch(`/api/meetings/${meetingId}/transcribe`, {
      method: 'POST',
      body: formData
    })
    
    // Once transcribed, go to summary page
    router.push(`/meeting/${meetingId}/summary`)
  } catch (error) {
    alert('Failed to process audio')
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
  min-height: 80vh;
  gap: 2rem;
  text-align: center;
}

.timer {
  font-size: 3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-top: 1rem;
}

.visualizer-wrapper {
  width: 100%;
  max-width: 600px;
}

.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-danger:hover {
  background: #dc2626;
}

.post-recording {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
</style>

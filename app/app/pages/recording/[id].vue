<template>
  <div class="container recording">
    <header>
      <h1>🎙️ Merekam...</h1>
      <p class="meta">{{ meeting?.title || 'Rapat Baru' }}</p>
    </header>

    <div class="timer-section">
      <div class="timer">{{ formattedTime }}</div>
      <div class="status" :class="{ 'status-error': micError }">
        <template v-if="micError">
          <span class="error-icon">⚠️</span>
          {{ micError }}
        </template>
        <template v-else>
          <span class="recording-dot"></span>
          {{ isRecording ? 'Sedang merekam' : 'Menunggu...' }}
        </template>
      </div>
    </div>

    <div class="visualizer">
      <div v-for="i in 20" :key="i" class="bar" :style="{ height: `${barHeights[i-1] || 10}%` }"></div>
    </div>

    <!-- Audio source toggle -->
    <div class="source-toggle">
      <button 
        @click="toggleSource" 
        class="btn btn-sm"
        :class="{ active: useSample }"
        :disabled="isRecording"
      >
        {{ useSample ? '📼 Menggunakan Sample Audio' : '🎤 Menggunakan Microphone' }}
      </button>
      <p class="source-hint" v-if="useSample">
        Akan menggunakan sample audio untuk demo
      </p>
    </div>

    <div class="actions">
      <button @click="stopRecording" class="btn btn-danger btn-lg" :disabled="stopping || (!isRecording && !useSample)">
        {{ stopping ? 'Memproses...' : '⏹ Selesai Rekam' }}
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
const seconds = ref(0)
const stopping = ref(false)
const isRecording = ref(false)
const useSample = ref(false)
const micError = ref<string | null>(null)
const barHeights = ref<number[]>(Array(20).fill(10))

let timer: ReturnType<typeof setInterval>
let visualizerTimer: ReturnType<typeof setInterval>
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let audioStream: MediaStream | null = null

const formattedTime = computed(() => {
  const hrs = Math.floor(seconds.value / 3600)
  const mins = Math.floor((seconds.value % 3600) / 60)
  const secs = seconds.value % 60
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const fetchMeeting = async () => {
  try {
    const res = await apiFetch(`/api/meetings/${meetingId}/status`)
    if (res.success) {
      meeting.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch meeting:', e)
  }
}

const toggleSource = () => {
  useSample.value = !useSample.value
  if (useSample.value) {
    stopMicrophone()
  } else {
    startMicrophone()
  }
}

const startMicrophone = async () => {
  try {
    micError.value = null
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder = new MediaRecorder(audioStream, { 
      mimeType: 'audio/webm;codecs=opus' 
    })
    
    audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    
    mediaRecorder.start(1000) // Collect data every second
    isRecording.value = true
    console.log('Microphone recording started')
    
  } catch (error: any) {
    console.error('Microphone error:', error)
    micError.value = 'Tidak dapat mengakses mikrofon'
    useSample.value = true
  }
}

const stopMicrophone = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop())
    audioStream = null
  }
  mediaRecorder = null
  isRecording.value = false
}

const getAudioBlob = async (): Promise<Blob> => {
  if (useSample.value) {
    // Fetch sample audio
    const response = await fetch('/samples/sample-meeting.mp3')
    return await response.blob()
  } else {
    // Use recorded audio
    return new Blob(audioChunks, { type: 'audio/webm' })
  }
}

const stopRecording = async () => {
  stopping.value = true
  stopMicrophone()
  
  try {
    // 1. Close recording to transition state
    await apiFetch(`/api/meetings/${meetingId}/close`, {
      method: 'POST',
      body: JSON.stringify({
        totalChunks: 1,
        durationSeconds: seconds.value
      })
    })

    // 2. Get audio blob
    const audioBlob = await getAudioBlob()
    console.log(`Audio blob size: ${audioBlob.size} bytes`)

    // 3. Upload audio for transcription
    const formData = new FormData()
    formData.append('audio', audioBlob, useSample.value ? 'audio.mp3' : 'audio.webm')

    const uploadRes = await fetch(`${apiBase}/api/meetings/${meetingId}/upload-audio`, {
      method: 'POST',
      body: formData
    })

    if (!uploadRes.ok) {
      throw new Error('Failed to upload audio')
    }

    // 4. Navigate to processing page
    router.push(`/processing/${meetingId}`)
    
  } catch (e) {
    console.error('Failed to stop recording:', e)
    alert('Gagal menghentikan rekaman')
    stopping.value = false
  }
}

const updateVisualizer = () => {
  barHeights.value = barHeights.value.map(() => 
    Math.random() * 60 + 10
  )
}

onMounted(() => {
  fetchMeeting()
  
  // Start timer
  timer = setInterval(() => {
    seconds.value++
  }, 1000)
  
  // Start visualizer animation
  visualizerTimer = setInterval(updateVisualizer, 200)
  
  // Start microphone by default
  startMicrophone()
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(visualizerTimer)
  stopMicrophone()
})
</script>

<style scoped>
.recording {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  gap: 1.5rem;
}

.meta {
  color: var(--text-muted);
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
  color: var(--text-main);
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--danger);
  font-size: 0.9rem;
}

.status-error {
  color: var(--warning);
}

.recording-dot {
  width: 10px;
  height: 10px;
  background: var(--danger);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.visualizer {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
  padding: 1rem;
}

.bar {
  width: 6px;
  background: linear-gradient(to top, var(--primary), var(--primary-light));
  border-radius: 3px;
  transition: height 0.15s ease;
}

.source-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.source-toggle .btn {
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.source-toggle .btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.source-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.actions {
  margin-top: 1rem;
}
</style>

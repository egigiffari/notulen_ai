<template>
  <canvas ref="canvas" class="visualizer"></canvas>
</template>

<script setup lang="ts">
const props = defineProps<{
  stream: MediaStream | null
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaStreamAudioSourceNode | null = null
let animationId: number | null = null

watch(() => props.stream, (newStream) => {
  if (newStream) {
    startVisualizer(newStream)
  } else {
    stopVisualizer()
  }
})

const startVisualizer = (stream: MediaStream) => {
  if (!canvas.value) return

  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  analyser = audioContext.createAnalyser()
  source = audioContext.createMediaStreamSource(stream)
  
  source.connect(analyser)
  analyser.fftSize = 256
  
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  const ctx = canvas.value.getContext('2d')
  
  if (!ctx) return

  const draw = () => {
    if (!analyser || !ctx || !canvas.value) return
    
    animationId = requestAnimationFrame(draw)
    analyser.getByteFrequencyData(dataArray)
    
    ctx.fillStyle = '#1e293b' // var(--bg-card)
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    
    const barWidth = (canvas.value.width / bufferLength) * 2.5
    let barHeight
    let x = 0
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2
      
      const gradient = ctx.createLinearGradient(0, CanvasGradient ? canvas.value.height : 0, 0, 0)
      gradient.addColorStop(0, '#6366f1') // var(--primary)
      gradient.addColorStop(1, '#c084fc')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.value.height - barHeight, barWidth, barHeight)
      
      x += barWidth + 1
    }
  }
  
  draw()
}

const stopVisualizer = () => {
  if (animationId) cancelAnimationFrame(animationId)
  if (audioContext) audioContext.close()
  audioContext = null
  analyser = null
  source = null
}

onUnmounted(() => {
  stopVisualizer()
})
</script>

<style scoped>
.visualizer {
  width: 100%;
  height: 100px;
  background: var(--bg-card);
  border-radius: var(--radius);
}
</style>

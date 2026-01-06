<template>
  <div class="visualizer-container">
    <div class="baseline"></div>
    <canvas ref="canvas" class="visualizer"></canvas>
  </div>
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
  analyser.fftSize = 128
  analyser.smoothingTimeConstant = 0.8
  
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  const ctx = canvas.value.getContext('2d')
  
  if (!ctx) return

  // Set canvas size
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.value.getBoundingClientRect()
  canvas.value.width = rect.width * dpr
  canvas.value.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const draw = () => {
    if (!analyser || !ctx || !canvas.value) return
    
    animationId = requestAnimationFrame(draw)
    analyser.getByteFrequencyData(dataArray)
    
    const width = rect.width
    const height = rect.height
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height)
    
    // Bar configuration
    const barCount = 40
    const barWidth = 3
    const gap = (width - (barCount * barWidth)) / (barCount - 1)
    const maxBarHeight = height - 10
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * (bufferLength / barCount))
      const value = dataArray[dataIndex]
      const barHeight = (value / 255) * maxBarHeight
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
      gradient.addColorStop(0, '#06b6d4') // cyan-500
      gradient.addColorStop(1, '#22d3ee') // cyan-400
      
      const x = i * (barWidth + gap)
      const y = height - barHeight
      
      // Draw bar with rounded top
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0])
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Add glow effect
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 8
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
.visualizer-container {
  position: relative;
  width: 100%;
  height: 120px;
  display: flex;
  align-items: flex-end;
}

.baseline {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #06b6d4, transparent);
  border-radius: 2px;
}

.visualizer {
  width: 100%;
  height: 100%;
  background: transparent;
}
</style>

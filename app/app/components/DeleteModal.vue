<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="cancel">
      <div class="modal-content">
        <h3>⚠️ Hapus Rapat</h3>
        <p>Apakah Anda yakin ingin menghapus rapat ini?</p>
        <p class="meeting-title">"{{ title }}"</p>
        <p class="warning">Tindakan ini tidak dapat dibatalkan.</p>
        
        <div class="modal-actions">
          <button @click="cancel" class="btn btn-secondary">Batal</button>
          <button @click="confirm" class="btn btn-danger" :disabled="loading">
            {{ loading ? 'Menghapus...' : 'Hapus Permanen' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const confirm = () => emit('confirm')
const cancel = () => emit('cancel')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 1rem;
  color: var(--danger);
}

.meeting-title {
  font-weight: 600;
  color: var(--text-main);
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin: 1rem 0;
}

.warning {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>

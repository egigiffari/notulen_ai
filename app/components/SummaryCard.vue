<template>
  <div class="summary-card">
    <div class="section">
      <h3>📋 Ringkasan</h3>
      <p>{{ content.ringkasan }}</p>
    </div>

    <div class="section" v-if="normalizedAgenda.length">
      <h3>📅 Agenda</h3>
      <ul>
        <li v-for="(item, i) in normalizedAgenda" :key="i">{{ item }}</li>
      </ul>
    </div>

    <div class="section" v-if="normalizedKeputusan.length">
      <h3>✅ Keputusan</h3>
      <ul>
        <li v-for="(item, i) in normalizedKeputusan" :key="i">{{ item }}</li>
      </ul>
    </div>

    <div class="section" v-if="normalizedActionItems.length">
      <h3>🚀 Action Items</h3>
      <ul>
        <li v-for="(item, i) in normalizedActionItems" :key="i">
          <template v-if="typeof item === 'object'">
            <strong>{{ item.task }}</strong>
            <span v-if="item.owner" class="owner"> — {{ item.owner }}</span>
          </template>
          <template v-else>
            {{ item }}
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  content: {
    ringkasan: string
    agenda: string[] | string
    keputusan: string[] | string
    action_items: Array<string | { task: string; owner?: string }> | string
  }
}>()

// Helper function to normalize data - convert string to array if needed
const normalizeToArray = (data: any): string[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    // If it's a string, treat it as a single item, not split by character
    return [data]
  }
  return []
}

const normalizedAgenda = computed(() => normalizeToArray(props.content.agenda))
const normalizedKeputusan = computed(() => normalizeToArray(props.content.keputusan))
const normalizedActionItems = computed(() => normalizeToArray(props.content.action_items))
</script>

<style scoped>
.summary-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: left;
  box-shadow: var(--shadow);
}

.section {
  margin-bottom: 2rem;
}

.section:last-child {
  margin-bottom: 0;
}

h3 {
  color: var(--primary);
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

ul {
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}

.owner {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>

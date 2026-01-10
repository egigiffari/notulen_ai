<template>
  <div id="app">
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --primary: #06b6d4;
  --primary-hover: #0891b2;
  --primary-light: #22d3ee;
  --bg-dark: #0f172a;
  --bg-card: #1e293b;
  --bg-elevated: #334155;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: #334155;
  --radius: 12px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --danger: #ef4444;
  --success: #10b981;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-dark);
  color: var(--text-main);
  min-height: 100vh;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-danger {
  background: var(--danger);
}

.btn-success {
  background: var(--success);
}

.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

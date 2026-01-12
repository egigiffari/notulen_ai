// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3401'
    }
  },

  nitro: {
    output: {
      dir: '../dist/frontend'
    }
  }
})

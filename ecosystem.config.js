module.exports = {
    apps: [
        // 1. BACKEND SERVICE
        {
            name: "notulen-backend",
            cwd: ".", // Run from root for better module resolution
            script: "./dist/backend/index.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
                PORT: 3401
            }
        },
        // 2. FRONTEND SERVICE (Nuxt 4)
        {
            name: "notulen-frontend",
            cwd: ".", // Run from root
            script: "./dist/frontend/server/index.mjs",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
                PORT: 3300,
                // NUXT_PUBLIC_API_BASE needs to be set to your domain in production
            }
        }
    ]
};

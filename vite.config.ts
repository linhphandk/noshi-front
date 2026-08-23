import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_URL || "http://localhost:3000"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      proxy: {
        "/auth": { target: apiTarget, changeOrigin: true },
        "/api": { target: apiTarget, changeOrigin: true },
        "/waitlist": { target: apiTarget, changeOrigin: true },
        "/profile/platforms": { target: apiTarget, changeOrigin: true },
        "/profile/public": { target: apiTarget, changeOrigin: true },
        "/profile": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => {
            // Don't rewrite /profile/edit or other SPA routes
            if (path !== "/profile") return path
            return path
          },
          bypass: (req) => {
            const u = req.url?.split("?")[0] || ""
            if (u !== "/profile") {
              return "/"
            }
          },
        },
      },
    },
    build: {
      target: "esnext",
    },
    esbuild: {
      target: "esnext",
    },
  }
})

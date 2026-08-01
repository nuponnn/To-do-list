import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    rolldownOptions: {
      output: {
        // Split stable framework code out of the app entry so the main chunk stays below Vite's warning limit.
        manualChunks(id) {
          // Keep React and routing dependencies in their own cacheable chunk instead of the app entry.
          if (["react", "react-dom", "react-router-dom"].some((pkg) => id.includes("/node_modules/" + pkg + "/"))) return "react";

          // Keep Firebase out of the app entry because it is the largest third-party dependency here.
          if (id.includes("/node_modules/firebase/")) return "firebase";
        },
      },
    },
  },
})

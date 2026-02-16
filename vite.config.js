import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ★追加: ポリフィルプラグインの読み込み
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ★追加: これを入れることで stream や buffer が使えるようになります
    nodePolyfills(),
  ],
  define: {
    // global がない問題をここでも念のため解決
    'global': {},
  },
})

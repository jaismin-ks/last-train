import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  // Draco / KTX2 decoders and large glb files are served from /public
  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.ktx2'],
})

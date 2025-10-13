import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import pkg from './package.json'

const externalDependencies = Object.keys(pkg.dependencies || {}).concat([
  'electron',
  'electron-serve',
  'electron-settings',
  'electron-store',
  'fs-extra',
  'dotenv',
])

export default defineConfig({
  root: '.', // tudo na raiz
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  plugins: [
    react(),
    electron({
      entry: [
        path.resolve(__dirname, 'main/background.ts'),
        path.resolve(__dirname, 'main/preload.ts'),
      ],
      onstart(options) {
        options.startup()
      },
      vite: {
        build: {
          outDir: 'dist-electron',
          rollupOptions: {
            external: externalDependencies,
            input: {
              background: path.resolve(__dirname, 'main/background.ts'),
              preload: path.resolve(__dirname, 'main/preload.ts'),
            },
            output: {
              format: 'cjs',
              entryFileNames: '[name].js',
            },
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@main': path.resolve(__dirname, 'main'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
  },
})

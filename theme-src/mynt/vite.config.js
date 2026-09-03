/*
 * CFMonitor MYNT Theme
 * Copyright (C) 2026 CFMonitor MYNT contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const themeDir = path.dirname(fileURLToPath(import.meta.url))
const repoDir = path.resolve(themeDir, '../..')
const outputDir = path.resolve(repoDir, 'themes/mynt')
const legalSourceDir = path.resolve(themeDir, 'public/licenses')

const createWorkerProxy = () => ({
  target: process.env.VITE_DEV_PROXY_TARGET || 'https://localhost:8787',
  changeOrigin: true,
  secure: false,
  ws: true
})

const copyLegalAssets = () => ({
  name: 'mynt-copy-legal-assets',
  closeBundle() {
    if (!fs.existsSync(legalSourceDir)) return
    const destination = path.join(outputDir, 'assets/licenses')
    fs.mkdirSync(destination, { recursive: true })
    fs.cpSync(legalSourceDir, destination, { recursive: true })
  }
})

export default defineConfig({
  root: themeDir,
  plugins: [vue(), copyLegalAssets()],
  base: './',
  publicDir: false,
  resolve: {
    alias: {
      '@mynt': path.resolve(themeDir, 'src'),
      '@cf': path.resolve(repoDir, 'src/frontend')
    }
  },
  build: {
    target: ['es2020', 'safari15'],
    cssTarget: 'safari15',
    outDir: outputDir,
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        banner: '/*! CFMonitor MYNT - GPL-3.0-or-later - Source and notices: ./assets/licenses/NOTICE.txt */'
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: { allow: [repoDir, path.resolve(repoDir, '..')] },
    proxy: {
      '/api': createWorkerProxy(),
      '/admin/api': createWorkerProxy(),
      '/flags': createWorkerProxy(),
      '/os-icons': createWorkerProxy(),
      '/files': createWorkerProxy()
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 4174,
    strictPort: true
  }
})

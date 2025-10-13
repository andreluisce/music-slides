#!/usr/bin/env bash
set -e

echo "🧹 Limpando build antigo..."
rm -rf dist dist-electron dist_electron_builder renderer/src renderer/dist-electron

echo "📦 Reorganizando estrutura para layout raiz..."

# Move tudo de src para raiz (se existir)
if [ -d "src" ]; then
  echo "📁 Movendo src/* para raiz..."
  cp -R src/* ./
  rm -rf src
fi

# Move o index.html para a raiz, caso ainda não esteja
if [ ! -f "index.html" ]; then
  if [ -f "./index.html" ]; then
    echo "✅ index.html já está na raiz."
  else
    echo "❌ ERRO: index.html não encontrado. Adicione-o na raiz antes de continuar."
    exit 1
  fi
fi

echo "⚙️ Gerando vite.config.ts..."
cat > vite.config.ts <<'EOF'
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
    electron([
      {
        entry: path.resolve(__dirname, 'main/background.ts'),
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            emptyOutDir: true,
            lib: {
              entry: path.resolve(__dirname, 'main/background.ts'),
              formats: ['cjs'],
            },
            rollupOptions: {
              external: externalDependencies,
              output: {
                entryFileNames: 'background.js',
              },
            },
          },
        },
      },
      {
        entry: path.resolve(__dirname, 'main/preload.ts'),
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            emptyOutDir: false,
            lib: {
              entry: path.resolve(__dirname, 'main/preload.ts'),
              formats: ['cjs'],
            },
            rollupOptions: {
              external: externalDependencies,
              output: {
                entryFileNames: 'preload.js',
              },
            },
          },
        },
      },
    ]),
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
EOF

echo "🧩 Gerando tsconfig.json..."
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["DOM", "ESNext"],
    "jsx": "react-jsx",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"],
      "@main/*": ["main/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": [
    ".",
    "main",
    "shared",
    "vite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "dist-electron",
    "dist_electron_builder"
  ]
}
EOF

echo "🧾 Gerando electron-builder.yml..."
cat > electron-builder.yml <<'EOF'
appId: com.andrevangelista.lyricslideshow
productName: Slides Lyrics
copyright: Copyright © 2022 André Evangelista

directories:
  output: dist_electron_builder
  buildResources: resources

files:
  - dist/**
  - dist-electron/**
  - package.json
  - node_modules/**/*

asar: true
asarUnpack:
  - "**/*.node"

extraResources:
  - from: resources
    to: resources

artifactName: "${productName}-${version}-${os}-${arch}.${ext}"

mac:
  target:
    - dmg
    - zip
  category: public.app-category.music
  icon: resources/icon.icns

win:
  target:
    - nsis
    - portable
  icon: resources/icon.ico

linux:
  target:
    - AppImage
    - deb
  category: Audio
  icon: resources/icon.png

extraMetadata:
  main: dist-electron/background.js
EOF

echo "✅ Estrutura finalizada!"
echo ""
echo "👉 Agora execute:"
echo "   pnpm install"
echo "   pnpm run build"
echo ""
echo "Se tudo estiver correto, o build vai gerar:"
echo "   dist/"
echo "   dist-electron/"
echo "   dist_electron_builder/"

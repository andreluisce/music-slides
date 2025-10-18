# Mapeamento Completo de Eventos IPC

## Convenção de Nomenclatura
- **Emissores (Main → Renderer)**: `namespace:on-event-name`
- **Receptores (Renderer → Main)**: `namespace:action-name`

## Eventos de Apresentação (Presentation)

### Main Process → Presentation Window

| Evento Enviado | Arquivo Emissor | Linha | Listener no Renderer | Arquivo Listener | Status |
|----------------|-----------------|-------|---------------------|------------------|--------|
| `presentation:on-loaded-lyrics` | background.ts | 621, 629 | `onLoadedLyrics` | presentation.tsx | ✅ OK |
| `presentation:on-song-info` | background.ts | 622, 630 | `onSongInfo` | presentation.tsx | ✅ OK |
| `presentation:on-slide-changed` | background.ts | 652 | `onSlideChanged` | presentation.tsx | ✅ OK |
| `presentation:on-theme-update` | background.ts | 123, 659 | `onThemeUpdate` | presentation.tsx | ✅ FIXED |
| `presentation:on-custom-background` | background.ts | 126 | `onCustomBackground` | presentation.tsx | ✅ OK |
| `presentation:on-transition-update` | background.ts | 129 | `onTransitionUpdate` | presentation.tsx | ✅ OK |
| `presentation:on-control-received` | background.ts | 114 | `onControlReceived` | presentation.tsx | ✅ OK |

### Renderer → Main Process

| Evento Enviado | Componente Emissor | Arquivo | Handler no Main | Arquivo Handler | Status |
|----------------|-------------------|---------|-----------------|-----------------|--------|
| `presentation:open` | api.openPresentationWindow | electron-api.ts | ipcMain.handle | background.ts:587 | ✅ OK |
| `presentation:close` | api.closePresentationWindow | electron-api.ts | ipcMain.handle | background.ts:640 | ✅ OK |
| `presentation:send-slide-change` | presentation.sendSlideChange | preload/api/presentation.ts | ipcMain.on | background.ts:647 | ✅ OK |
| `presentation:send-theme-update` | presentation.sendThemeUpdate | preload/api/presentation.ts | ipcMain.on | background.ts:656 | ✅ OK |
| `presentation:send-control` | presentation.sendControl | preload/api/presentation.ts | ipcMain.on | background.ts:106 | ✅ OK |
| `presentation:set-fullscreen` | presentation.setFullscreen | preload/api/presentation.ts | ipcMain.on | background.ts:663 | ✅ OK |

## Eventos de Busca de Letras (AI)

### Main Process → Main Window

| Evento Enviado | Arquivo Emissor | Linha | Listener no Renderer | Arquivo Listener | Status |
|----------------|-----------------|-------|---------------------|------------------|--------|
| `search-progress` | background.ts | 273, 282, 291 | ❌ NÃO USADO | - | ⚠️ DEPRECADO |
| `ai:on-search-progress` | background.ts | 582 | `onSearchProgress` | preload/api/ai.ts | ✅ OK |

### Renderer → Main Process

| Evento Enviado | Componente Emissor | Arquivo | Handler no Main | Arquivo Handler | Status |
|----------------|-------------------|---------|-----------------|-----------------|--------|
| `ai:fast-lyrics-search` | api.ai.fastLyricsSearch | electron-api.ts | ipcMain.handle | background.ts:278 | ✅ OK |
| `ai:fetch-lyrics-by-url` | api.ai.fetchLyricsByUrl | electron-api.ts | ipcMain.handle | background.ts:287 | ✅ OK |

## Problemas Identificados e Corrigidos

### 1. ✅ FIXO: Inconsistência em `loaded-lyrics`
- **Problema**: Linha 627 enviava `loaded-lyrics` (sem prefixo)
- **Correção**: Alterado para `presentation:on-loaded-lyrics`
- **Arquivo**: background.ts:627-630

### 2. ✅ FIXO: Inconsistência em `theme-update`
- **Problema**: Linha 659 enviava `theme-update` (sem prefixo)
- **Correção**: Alterado para `presentation:on-theme-update`
- **Arquivo**: background.ts:659

### 3. ⚠️ DEPRECADO: Evento `search-progress`
- **Problema**: background.ts envia `search-progress` mas não há listener correspondente
- **Recomendação**: Remover linhas 273, 282, 291 ou adicionar `presentation:` como prefixo
- **Status**: Não afeta funcionamento atual pois `ai:on-search-progress` funciona

## Verificações de Consistência

### Todos os eventos seguem o padrão:
✅ Main → Renderer: `namespace:on-event-name`
✅ Renderer → Main: `namespace:action-name`

### Todos os listeners têm emissores correspondentes:
✅ `presentation:on-loaded-lyrics` ← backend.ts
✅ `presentation:on-song-info` ← backend.ts
✅ `presentation:on-slide-changed` ← backend.ts
✅ `presentation:on-theme-update` ← backend.ts (FIXED)
✅ `presentation:on-custom-background` ← backend.ts
✅ `presentation:on-transition-update` ← backend.ts

## Fluxo Completo: Abrir Apresentação com Letra

1. **User clica em música** → MusicLibrary.tsx:handleSongClick
2. **Renderer envia** → `presentation:open` com {artist, title, filePath}
3. **Main recebe** → background.ts:587 (ipcMain.handle)
4. **Main cria janela** → presentation-window.ts
5. **Main lê arquivo** → fileSystem.readSong(artist, title)
6. **Main envia letra** → `presentation:on-loaded-lyrics` (linha 621 ou 629)
7. **Main envia info** → `presentation:on-song-info` (linha 622 ou 630)
8. **Renderer recebe** → presentation.tsx:202 (onLoadedLyrics)
9. **Renderer atualiza** → setSlides(parsedSlides)
10. **UI renderiza** → AnimatePresence com slides

## Testes Necessários

- [ ] Abrir apresentação com música local
- [ ] Verificar se letra aparece na janela de apresentação
- [ ] Trocar de slide usando setas
- [ ] Alterar tema e verificar atualização
- [ ] Alterar background e verificar atualização
- [ ] Fechar apresentação

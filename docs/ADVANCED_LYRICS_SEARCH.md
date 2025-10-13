# 🎵 Sistema de Busca Avançada de Letras

Sistema inteligente com 3 níveis de fallback + scraping + AI.

## 🔍 Arquitetura do Sistema

```
Query do Usuário
    ↓
🤖 Interpretação com AI (Gemini)
    ↓
1️⃣ Supabase Storage (cloud cache) ⚡ instant
    ↓ não encontrou
2️⃣ Cache Local (file system) ⚡ instant
    ↓ não encontrou
3️⃣ Web Scraping (Playwright)
    - Letras.mus.br
    - CifraClub
    ↓ encontrou! ✅
4️⃣ Salvamento Automático
    - Supabase Storage (cloud)
    - Local file system (com metadata)
```

## 🚀 Como Usar

### No Console do DevTools do Renderer:

```javascript
// Busca inteligente com fallback automático
const result = await window.api.advancedLyricsSearch('Diante do Trono Preciso de Ti');

console.log(result);
```

### Resultado Esperado:

```json
{
  "title": "Preciso de Ti",
  "artist": "Diante do Trono",
  "lyrics": "Preciso de Ti\nComo a flor precisa do orvalho...",
  "source": "letrasmusic",
  "metadata": {
    "genre": "Gospel",
    "language": "pt-BR",
    "source": "letrasmusic",
    "fetchedAt": "2025-10-12T..."
  }
}
```

## 📦 Fontes de Busca

### Nível 1: Cache Cloud (Supabase Storage)
- ⚡ **Velocidade**: Instantâneo
- 📁 **Local**: Bucket `songs` no Supabase Storage
- 💾 **Formato**: Arquivo `.txt` com frontmatter (metadata)

### Nível 2: Cache Local
- ⚡ **Velocidade**: Instantâneo
- 📁 **Local**: `~/Documents/lyrics-slide-show/songs/{artist}/{title}.txt`
- 💾 **Formato**: Arquivo `.txt` com frontmatter (metadata)

### Nível 3: Web Scraping (Playwright)
- 🌐 **Letras.mus.br**: Maior banco de letras do Brasil
- 🎸 **CifraClub**: Letras + cifras
- ⏱️ **Tempo**: 3-8 segundos
- 🤖 **Navegador**: Chromium (headless)


## 🧠 Inteligência AI

O sistema usa **Google Gemini** para:
- Interpretar queries vagas ("preciso de ti diante do trono")
- Corrigir erros de digitação
- Sugerir alternativas
- Calcular confiança da interpretação

## 💾 Salvamento Automático

Quando uma letra é encontrada via scraping ou API:

1. **Supabase Storage** → `songs/{artist}/{title}.txt`
2. **Local** → `~/Documents/lyrics-slide-show/songs/{artist}/{title}.txt`
3. Ambos com metadata completa (gênero, idioma, fonte, data)

## 🎨 Exemplos de Uso

### Busca Simples
```javascript
await window.api.advancedLyricsSearch('Preciso de Ti')
```

### Busca com Artista
```javascript
await window.api.advancedLyricsSearch('Diante do Trono Preciso de Ti')
```

### Busca com Erro de Digitação
```javascript
await window.api.advancedLyricsSearch('Ocens Hillsong')
// AI corrige para: "Oceans - Hillsong"
```

### Busca Vaga
```javascript
await window.api.advancedLyricsSearch('aquela música de adoração sobre confiar')
// AI interpreta e busca músicas relevantes
```

## 📊 Performance

| Fonte | Tempo Médio | Taxa de Sucesso |
|-------|-------------|-----------------|
| Supabase Cache | <100ms | 100% (se existe) |
| Local Cache | <50ms | 100% (se existe) |
| Letras.mus.br | 3-5s | ~85% |
| CifraClub | 3-6s | ~80% |

## 🔧 Troubleshooting

### Se não encontrar letras:
1. Verifique se o nome do artista/música está correto
2. Tente com termos em inglês (para músicas internacionais)
3. Verifique os logs no console do Electron main process

### Se o Playwright falhar:
```bash
# Reinstalar navegador Chromium
npx playwright install chromium --with-deps
```

### Se o Supabase falhar:
- Verifique as credenciais no `.env.local`
- Confirme que o bucket `songs` existe no Supabase Storage

## 🧪 Testando

1. Abra o DevTools do Electron (View → Toggle Developer Tools)
2. Execute no console:

```javascript
// Teste básico
const test1 = await window.api.advancedLyricsSearch('Oceans Hillsong');
console.log('Test 1:', test1);

// Teste com música brasileira
const test2 = await window.api.advancedLyricsSearch('Diante do Trono Preciso de Ti');
console.log('Test 2:', test2);

// Teste com query vaga
const test3 = await window.api.advancedLyricsSearch('musica sobre esperança');
console.log('Test 3:', test3);
```

## 📝 Logs

O sistema gera logs detalhados no console do main process:

```
🔍 Starting intelligent lyrics search for: Oceans Hillsong
🤖 AI interpretation (95% confidence): { artist: 'Hillsong', title: 'Oceans' }
1️⃣ Checking Supabase cache...
2️⃣ Checking local cache...
3️⃣ Trying web scraping...
🌐 Trying Letras.mus.br...
✅ Letras.mus.br found lyrics
💾 Saved to local file system
☁️ Saved to Supabase Storage
```

## 🎯 Próximos Passos

- [ ] Cache inteligente com TTL (expiração)
- [ ] Suporte para mais sites (Vagalume web scraping)
- [ ] Tradução automática de letras
- [ ] Busca por tema/sentimento
- [ ] Integração com Spotify/YouTube para metadata

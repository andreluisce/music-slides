# MCP Lyrics Integration Guide

Este documento descreve como usar o MCP (Model Context Protocol) com FireCrawl e AI para buscar letras de músicas no aplicativo Lyrics Slide Show.

## 📋 Visão Geral

A implementação MCP substitui o scraping direto com Playwright por uma solução mais robusta que combina:

- **FireCrawl MCP**: Para scraping inteligente de páginas web
- **Google Gemini**: Para extração e análise de conteúdo com IA
- **Playwright MCP**: Como alternativa para scraping tradicional

## 🚀 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# FireCrawl Configuration  
FIRECRAWL_API_KEY=fc-77eeb671a72741ea85ed92b32f41e8b9

# Outras configurações...
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Dependências

As seguintes dependências foram adicionadas:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/node-fetch": "^2.6.13"
  }
}
```

**Nota:** O Gemini já está configurado no projeto, então não precisamos de SDKs adicionais para IA.

## 🔧 Arquitetura

### Componentes Principais

1. **MCP Service** (`main/helpers/mcp-service.ts`)
   - Gerencia conexões com servidores MCP
   - Inicializa FireCrawl MCP automaticamente
   - Fornece interface para chamar ferramentas MCP

2. **FireCrawl Lyrics Provider** (`main/helpers/lyrics-providers/firecrawl-lyrics-provider.ts`)
   - Usa FireCrawl para scraping inteligente
   - Integração com Gemini AI para extração de letras
   - Suporte a múltiplos sites de letras

3. **MCP Lyrics Provider** (`main/helpers/lyrics-providers/mcp-lyrics-provider.ts`)
   - Alternativa usando Playwright MCP
   - Compatível com a implementação existente

4. **API IPC** (`main/preload/api/mcp-lyrics.ts`)
   - Interface entre renderer e main process
   - Funções para busca e extração de letras

5. **UI Component** (`components/MCPLyricsSearchPanel.tsx`)
   - Interface React para testar funcionalidades MCP
   - Status dos servidores MCP
   - Comparação entre métodos de busca

### Fluxo de Dados

```
Frontend (React) → IPC → Main Process → MCP Service → FireCrawl/Playwright → AI Analysis → Results
```

## 📚 APIs Disponíveis

### No Renderer Process

```typescript
// Buscar com FireCrawl + AI
const results = await window.mcpLyrics.searchWithFireCrawl(artist, title);

// Obter letras com FireCrawl + AI  
const lyrics = await window.mcpLyrics.getLyricsWithFireCrawl(url);

// Buscar com Playwright MCP
const results = await window.mcpLyrics.searchWithPlaywright(artist, title);

// Status dos serviços MCP
const status = await window.mcpLyrics.getMCPStatus();
```

### No Main Process

```typescript
// Inicializar serviços MCP
await initializeMCP();

// Usar provider FireCrawl
const provider = new FireCrawlLyricsProvider(anthropicApiKey);
const results = await provider.searchByTitleAndArtist({ artist, title });
```

## 🎯 Vantagens da Implementação MCP

### Sobre Playwright Direto

1. **Confiabilidade**: MCP gerencia o ciclo de vida do browser
2. **Performance**: Reutilização de conexões e otimizações
3. **Manutenibilidade**: Separação clara de responsabilidades
4. **Robustez**: Melhor tratamento de erros e recovery

### FireCrawl + AI vs Scraping Tradicional

1. **Inteligência**: AI extrai dados estruturados automaticamente
2. **Adaptabilidade**: Funciona com diferentes layouts de sites
3. **Qualidade**: Filtragem inteligente de conteúdo irrelevante
4. **Escalabilidade**: Suporte a múltiplos sites sem código específico

## 🔍 Sites Suportados

A implementação atual funciona com:

- Letras.mus.br
- Vagalume.com.br  
- CifraClub.com.br
- Qualquer site com estrutura similar

O AI é capaz de se adaptar a novos sites automaticamente.

## 🧪 Testando a Implementação

### 1. Via Interface

Use o componente `MCPLyricsSearchPanel`:

```tsx
import { MCPLyricsSearchPanel } from './components/MCPLyricsSearchPanel';

// Adicione ao seu layout
<MCPLyricsSearchPanel />
```

### 2. Via DevTools

```javascript
// No console do navegador
await window.mcpLyrics.getMCPStatus();
await window.mcpLyrics.searchWithFireCrawl('Legião Urbana', 'Tempo Perdido');
```

### 3. Logs do Console

Monitore os logs no terminal para debug:

```
[MCP] Starting server: firecrawl-mcp
[MCP] Server firecrawl-mcp started successfully
[FireCrawlLyricsProvider] Searching for: Legião Urbana - Tempo Perdido
```

## 🔧 Configuração Avançada

### Personalizando FireCrawl Options

```typescript
const crawlResult = await mcpService.callTool('firecrawl-mcp', 'crawl_url', {
  url,
  options: {
    formats: ['markdown', 'html'],
    includeTags: ['p', 'div', 'span', 'h1', 'h2', 'h3'],
    excludeTags: ['script', 'style', 'nav', 'footer', 'aside', 'ad'],
    waitFor: 2000,
    removeBase64Images: true
  }
});
```

### Configurando AI Prompts

Edite os prompts em `firecrawl-lyrics-provider.ts` para melhorar a extração:

```typescript
const prompt = `
Extract lyrics and song information from this webpage content.
// Customize prompt here...
`;
```

## 🐛 Troubleshooting

### MCP Server Não Inicia

1. Verifique se `FIRECRAWL_API_KEY` está configurada
2. Execute: `npx -y firecrawl-mcp` manualmente para testar
3. Monitore logs de erro no console

### AI Não Funciona

1. Verifique `ANTHROPIC_API_KEY` no `.env`
2. Teste com provider simples sem AI
3. Monitore rate limits da API

### Performance Lenta

1. Ajuste `waitFor` nas opções do FireCrawl
2. Use cache para resultados repetidos
3. Implemente timeout personalizado

## 🚀 Próximos Passos

1. **Cache Inteligente**: Armazenar resultados de busca
2. **Mais Sites**: Adicionar suporte a sites internacionais
3. **Batch Processing**: Buscar múltiplas letras simultaneamente
4. **Analytics**: Tracking de performance e usage
5. **Fallback Chain**: Múltiplos providers em cascata

## 💡 Contribuindo

Para adicionar novos providers ou melhorar a implementação:

1. Crie um novo provider em `main/helpers/lyrics-providers/`
2. Implemente a interface padrão (`SearchResult`, `LyricsResult`)
3. Adicione handlers IPC em `background.ts`
4. Exponha via `preload/api/`
5. Teste com o componente de UI

---

Esta implementação MCP representa uma evolução significativa na busca de letras, combinando o melhor de scraping moderno com inteligência artificial para resultados superiores.
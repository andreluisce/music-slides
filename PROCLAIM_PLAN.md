# Plano: App Estilo Proclaim Online

## 🎯 Visão Geral
Sistema de apresentação de slides para igrejas, similar ao Proclaim Online, com funcionalidades simplificadas e interface moderna.

## 📋 Funcionalidades Principais

### 1. **Biblioteca (Library)**
- ✅ Músicas do banco de dados (Supabase)
- ✅ Músicas locais (.txt)
- ✅ Busca de letras online (Vagalume)
- 🔄 Organização por categorias/tags
- 🔄 Favoritos
- 🔄 Histórico de apresentações

### 2. **Editor de Apresentações (Presentations)**
- 🔄 Criar/editar apresentações
- 🔄 Adicionar músicas à apresentação
- 🔄 Reordenar slides
- 🔄 Adicionar slides personalizados (texto, imagem)
- 🔄 Salvar apresentações no Supabase

### 3. **Controle ao Vivo (Live Control)**
- ✅ Exibição de slides em tela cheia
- ✅ Navegação com setas do teclado
- 🔄 Preview do próximo slide
- 🔄 Controle remoto via interface web
- 🔄 Timer/cronômetro
- 🔄 Tela de espera/logo

### 4. **Vídeos de Fundo (Backgrounds)**
- ✅ Lista de vídeos locais
- 🔄 Upload de vídeos para Supabase Storage
- 🔄 Preview de vídeos
- 🔄 Aplicar vídeo a slides específicos
- 🔄 Biblioteca de vídeos online

### 5. **Temas (Themes)**
- 🔄 Criar/editar temas
- 🔄 Personalizar fonte (família, tamanho, peso)
- 🔄 Cores do texto
- 🔄 Sombra e outline
- 🔄 Posicionamento (centro, inferior, superior)
- 🔄 Animações de transição
- 🔄 Aplicar tema a apresentações

### 6. **Configurações (Settings)**
- 🔄 Configuração de telas (principal, projetor)
- 🔄 Atalhos de teclado
- 🔄 Integração Supabase
- 🔄 Exportar/importar dados

## 🎨 Estrutura de Páginas

```
/                          → Home/Biblioteca (atual index.tsx)
/library                   → Biblioteca completa
/presentations             → Lista de apresentações
/presentations/new         → Criar nova apresentação
/presentations/[id]        → Editar apresentação
/presentations/[id]/live   → Controle ao vivo
/videos                    → Gerenciador de vídeos
/themes                    → Gerenciador de temas
/settings                  → Configurações
/lyrics                    → Exibição de slides (já existe)
/lyrics-settings           → Controle de slides (já existe)
```

## 🗄️ Schema Supabase (Ampliado)

```sql
-- Já criadas:
✅ songs
✅ video_backgrounds
✅ themes

-- Novas tabelas necessárias:
🔄 presentations (id, name, created_at, updated_at)
🔄 presentation_items (id, presentation_id, song_id, order, theme_id, video_id)
🔄 custom_slides (id, type, content, background_color, image_url)
🔄 tags (id, name, color)
🔄 song_tags (song_id, tag_id)
```

## 🚀 Roadmap de Implementação

### Fase 1: Navegação e Estrutura ✅
- [x] Layout principal com sidebar
- [x] Menu de navegação
- [ ] Páginas básicas criadas

### Fase 2: Biblioteca Completa
- [ ] Filtros avançados
- [ ] Sistema de tags
- [ ] Favoritos
- [ ] Edição de letras

### Fase 3: Sistema de Apresentações
- [ ] CRUD de apresentações
- [ ] Editor drag & drop
- [ ] Preview em tempo real

### Fase 4: Controle ao Vivo Avançado
- [ ] Split screen (controle + preview)
- [ ] Atalhos de teclado
- [ ] Timer/cronômetro
- [ ] Controle remoto

### Fase 5: Temas e Personalização
- [ ] Editor visual de temas
- [ ] Preview em tempo real
- [ ] Biblioteca de temas prontos

### Fase 6: Vídeos e Mídia
- [ ] Upload para Supabase Storage
- [ ] Gerenciador de mídia
- [ ] Otimização de vídeos

## 🎯 Próximos Passos Imediatos

1. **Criar Layout com Sidebar**
   - Menu lateral com navegação
   - Header com breadcrumb
   - Design moderno e responsivo

2. **Criar Páginas Base**
   - /library
   - /presentations
   - /videos
   - /themes
   - /settings

3. **Implementar Sistema de Apresentações**
   - Tabela no Supabase
   - CRUD básico
   - Editor simples

Legenda:
✅ Implementado
🔄 Em desenvolvimento
❌ Não iniciado

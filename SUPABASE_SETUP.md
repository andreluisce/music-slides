# Configuração do Supabase

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"** ou **"New Project"**
3. Crie uma organização (se necessário)
4. Crie um novo projeto:
   - Nome: `lyrics-slideshow`
   - Database Password: (escolha uma senha forte)
   - Region: Escolha a mais próxima (ex: South America - São Paulo)
5. Aguarde ~2 minutos para o projeto ser criado

## Passo 2: Obter Credenciais

1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Você verá:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (uma chave longa começando com `eyJ...`)

## Passo 3: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` e cole suas credenciais:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

## Passo 4: Criar Tabelas no Banco de Dados

1. No dashboard do Supabase, vá em **SQL Editor** (ícone de banco de dados)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Verifique se apareceu "Success. No rows returned"

## Passo 5: Verificar Tabelas

1. Vá em **Table Editor** no menu lateral
2. Você deve ver as tabelas:
   - `songs` - Músicas
   - `video_backgrounds` - Vídeos de fundo
   - `themes` - Temas/Estilos

## Estrutura do Banco

### Tabela `songs`
- `id` - UUID único
- `title` - Título da música
- `artist` - Nome do artista
- `lyrics` - Array de linhas da letra
- `is_local` - Se é uma música local
- `created_at` / `updated_at` - Timestamps

### Tabela `video_backgrounds`
- `id` - UUID único
- `name` - Nome do vídeo
- `url` - URL do vídeo
- `thumbnail_url` - URL da thumbnail (opcional)
- `created_at` - Timestamp

### Tabela `themes`
- `id` - UUID único
- `name` - Nome do tema
- `font_family` - Família da fonte
- `font_size` - Tamanho da fonte
- `font_weight` - Peso da fonte
- `text_color` - Cor do texto
- `text_shadow` - Sombra do texto
- `text_outline` - Outline do texto
- `background_position` - Posição do background
- `animation_type` - Tipo de animação
- `is_default` - Se é o tema padrão
- `created_at` - Timestamp

## Segurança

⚠️ **IMPORTANTE**:
- Nunca commite o arquivo `.env.local` no git
- O arquivo `.gitignore` já está configurado para ignorá-lo
- As políticas RLS estão abertas para todos - ajuste conforme necessário para produção

## Próximos Passos

Após configurar, reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

O Supabase client está configurado em `renderer/lib/supabase.ts` e pronto para uso!

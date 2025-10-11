# Music Slides - Sistema de Apresentação de Letras

Sistema completo para apresentação de letras de músicas em cultos e eventos, similar ao Proclaim Online, construído com Electron, Next.js, React e Supabase.

## 🎯 Funcionalidades

- **Biblioteca de Músicas**: Gerencie músicas com letras, artistas e tags
- **Apresentações**: Crie e organize apresentações com músicas e slides customizados
- **Editor Drag & Drop**: Arraste e solte itens para reorganizar apresentações
- **Vídeos de Fundo**: Upload e gerenciamento de vídeos para usar como fundo
- **Temas Visuais**: Customize fontes, cores, sombras e animações
- **Favoritos**: Marque músicas e apresentações favoritas para acesso rápido
- **Histórico**: Acompanhe as apresentações exibidas recentemente

## 🚀 Instalação

### Pré-requisitos

- Node.js 16+
- pnpm (recomendado) ou npm
- Conta no Supabase

### Configuração

1. Clone o repositório:
```bash
git clone <repository-url>
cd music-slides
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure o Supabase:

   a. Crie um projeto no [Supabase](https://supabase.com)

   b. Execute o script SQL `supabase-schema.sql` no SQL Editor do Supabase

   c. Execute também o script `supabase-new-tables-only.sql` para as tabelas adicionais

   d. Crie um bucket chamado `videos` em Storage > Buckets (público, limite 500MB)

4. Configure as variáveis de ambiente:

   Crie um arquivo `.env.local` na pasta `renderer/`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

5. Execute o projeto em desenvolvimento:
```bash
pnpm dev
```

6. Compile para produção:
```bash
pnpm build
```

## 📖 Guia de Uso

### Biblioteca de Músicas

1. **Adicionar Música**:
   - Clique em "Nova Música"
   - Preencha título, artista e letras
   - Use "+" para adicionar novas linhas de letra
   - Clique em "Salvar"

2. **Editar Música**:
   - Clique no ícone de edição na música desejada
   - Faça as alterações necessárias
   - Salve as mudanças

3. **Favoritar**:
   - Clique no ícone de coração para marcar como favorito
   - Músicas favoritas aparecem destacadas

4. **Buscar**:
   - Use a barra de pesquisa para filtrar por título ou artista

### Apresentações

1. **Criar Apresentação**:
   - Vá para "Apresentações"
   - Clique em "Nova Apresentação"
   - Dê um nome à apresentação

2. **Adicionar Músicas**:
   - No editor de apresentação, use a barra lateral
   - Clique em "Adicionar" nas músicas desejadas
   - As músicas aparecerão na apresentação

3. **Adicionar Slide Customizado**:
   - Clique em "Novo Slide"
   - Digite o conteúdo do slide
   - O slide será adicionado à apresentação

4. **Reorganizar Itens**:
   - Arraste e solte itens para reordenar
   - A ordem é salva automaticamente

5. **Apresentar**:
   - Clique em "Apresentar" para iniciar
   - Use setas do teclado para navegar
   - Pressione ESC para sair

### Vídeos de Fundo

1. **Upload de Vídeo**:
   - Vá para "Vídeos"
   - Clique em "Fazer Upload"
   - Selecione um arquivo de vídeo (máx. 500MB)
   - Aguarde o upload completar

2. **Visualizar**:
   - Passe o mouse sobre o vídeo para ver preview
   - O vídeo tocará automaticamente no hover

3. **Deletar**:
   - Clique em "Deletar" no vídeo desejado
   - Confirme a exclusão

### Temas e Estilos

1. **Criar Tema**:
   - Vá para "Temas"
   - Clique em "Novo Tema"
   - Configure:
     - Nome do tema
     - Fonte (família, tamanho, peso)
     - Cor do texto
     - Sombra do texto
     - Tipo de animação
   - Veja o preview em tempo real
   - Salve o tema

2. **Definir Tema Padrão**:
   - Clique no ícone de estrela no tema desejado
   - O tema será aplicado como padrão

3. **Editar Tema**:
   - Clique no ícone de edição
   - Faça as alterações
   - Salve

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **songs**: Músicas com letras
- **video_backgrounds**: Vídeos de fundo
- **themes**: Temas visuais
- **presentations**: Apresentações criadas
- **presentation_items**: Itens dentro das apresentações
- **custom_slides**: Slides customizados
- **tags**: Tags para organização
- **song_tags**: Relacionamento músicas-tags
- **favorites**: Favoritos do usuário
- **presentation_history**: Histórico de apresentações

### Políticas RLS

Todas as tabelas possuem Row Level Security (RLS) habilitado com políticas que permitem:
- SELECT para qualquer usuário autenticado
- INSERT/UPDATE/DELETE para usuários autenticados

## 🎨 Tecnologias Utilizadas

- **Electron**: Desktop app multiplataforma
- **Next.js**: Framework React com SSR
- **React**: Interface do usuário
- **TypeScript**: Type safety
- **Supabase**: Backend (PostgreSQL + Storage)
- **Tailwind CSS**: Estilização
- **shadcn/ui**: Componentes UI
- **Framer Motion**: Animações
- **@hello-pangea/dnd**: Drag and drop
- **Lucide React**: Ícones

## 🛠️ Solução de Problemas

### Página em Branco

Se a aplicação carregar mas não mostrar nada:
1. Verifique o console do DevTools (Ctrl+Shift+I)
2. Confirme que as variáveis de ambiente estão corretas
3. Execute `pnpm dev` novamente

### Erro de Conexão Supabase

Se aparecer erro de conexão:
1. Verifique se as URLs e keys no `.env.local` estão corretas
2. Confirme que o projeto Supabase está ativo
3. Verifique as políticas RLS no Supabase Dashboard

### Upload de Vídeo Falhando

Se o upload não funcionar:
1. Confirme que o bucket `videos` existe no Supabase Storage
2. Verifique se o bucket é público
3. Confirme o limite de 500MB no bucket
4. Verifique o tamanho do arquivo (máx. 500MB)

### Erro "global is not defined"

Se aparecer esse erro no console:
1. Verifique se o polyfill está no `_app.tsx`:
```tsx
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}
```

## 📁 Estrutura de Pastas

```
music-slides/
├── main/                    # Processo principal Electron
│   ├── background.ts        # Script de inicialização
│   └── helpers/            # Helpers do Electron
├── renderer/               # Processo de renderização (Next.js)
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── Layout.tsx     # Layout principal
│   │   ├── SongModal.tsx  # Modal de músicas
│   │   └── ThemeModal.tsx # Modal de temas
│   ├── lib/               # Bibliotecas e serviços
│   │   ├── supabase.ts    # Cliente Supabase
│   │   ├── supabase-service.ts        # CRUD operations
│   │   ├── presentations-service.ts   # Serviço de apresentações
│   │   └── storage-service.ts         # Serviço de storage
│   ├── pages/             # Páginas Next.js
│   │   ├── index.tsx      # Dashboard
│   │   ├── library.tsx    # Biblioteca
│   │   ├── videos.tsx     # Vídeos
│   │   ├── themes.tsx     # Temas
│   │   └── presentations/ # Apresentações
│   └── styles/            # Estilos globais
├── supabase-schema.sql    # Schema inicial do banco
└── supabase-new-tables-only.sql  # Tabelas adicionais
```

## 🔐 Segurança

- Nunca commite o arquivo `.env.local` no git
- Use as chaves `anon` do Supabase para o client
- Mantenha a chave `service_role` segura (não use no frontend)
- As políticas RLS protegem os dados no Supabase

## 📝 Licença

Este projeto é de uso pessoal e educacional.

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas via issues.

---

Desenvolvido com ❤️ para igrejas e comunidades

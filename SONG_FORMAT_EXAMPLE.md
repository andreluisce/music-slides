# Formato dos Arquivos de Música

Os arquivos de músicas agora seguem o formato MDX com frontmatter (metadata).

## Estrutura de Pastas

```
songs/
  diante-do-trono/
    preciso-de-ti.txt
    clame-ao-senhor.txt
  hillsong/
    oceans.txt
    what-a-beautiful-name.txt
```

## Formato do Arquivo

```yaml
---
title: Preciso de Ti
artist: Diante do Trono
createdAt: 2025-10-11
updatedAt: 2025-10-11
album: Diante do Trono 15
year: 2015
genre: Gospel
language: pt-BR
source: lyrics.ovh
---

Preciso de Ti
Como a flor precisa do orvalho
Preciso de Ti
Como a manhã precisa do sol

Preciso de Ti, Senhor
Preciso de Ti, Senhor
Só em Ti vou confiar
Pois és meu supridor
```

## Metadados Suportados

### Obrigatórios (adicionados automaticamente)
- `title`: Título da música
- `artist`: Nome do artista
- `createdAt`: Data de criação (YYYY-MM-DD)
- `updatedAt`: Data da última atualização

### Opcionais
- `album`: Nome do álbum
- `year`: Ano de lançamento
- `genre`: Gênero musical (Gospel, Worship, etc.)
- `language`: Idioma (pt-BR, en-US, es, etc.)
- `source`: Fonte da letra (lyrics.ovh, genius, manual, etc.)
- `bpm`: Batidas por minuto
- `key`: Tom musical (C, G, Am, etc.)
- `tags`: Tags para busca (array)
- `ccli`: Número CCLI (se aplicável)

## Vantagens

1. **Metadados Organizados**: Todas as informações da música em um só lugar
2. **Compatibilidade**: Formato padrão usado em blogs, documentação, etc.
3. **Extensível**: Fácil adicionar novos campos
4. **Busca Avançada**: Permite buscar por álbum, ano, gênero, etc.
5. **Sincronização**: Metadados viajam junto com as letras no Supabase

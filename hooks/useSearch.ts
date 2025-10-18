import { useState } from 'react';
import { api } from '../lib/electron-api';
import { fuzzyMatch } from '../lib/normalize';
import type { DisplaySong } from '../types/song';

export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DisplaySong[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async (term: string, existing: DisplaySong[]) => {
    setError(null);
    setResults([]);
    setLoading(true);
    try {
      const existingMatch = existing.find(s =>
        fuzzyMatch(term, `${s.artist} ${s.title}`)
      );
      if (existingMatch) {
        setError('💡 Essa música já existe na sua biblioteca.');
        return [];
      }

      const fetched = await api.ai.fastLyricsSearch(term.trim());
      setResults(fetched ?? []);
      return fetched ?? [];
    } catch {
      setError('Erro ao buscar músicas.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { search, results, loading, error };
}

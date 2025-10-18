import React, { useState } from 'react';
import { useSongs } from '../../hooks/useSongs';
import { useSearch } from '../../hooks/useSearch';
import SearchForm from './SearchForm';
import SongListTable from './SongListTable';
import SongModal from './modals/SongModal';
import { Button } from '../ui/button';
import { MusicNotesPlusIcon } from '@phosphor-icons/react';
import { DisplaySong } from '../../types/song';

interface MusicLibraryProps {
  onSongSelect: (song: DisplaySong) => void;
}

export default function MusicLibrary({ onSongSelect }: MusicLibraryProps) {
  const { songs, loading: songsLoading, refreshSongs } = useSongs();
  const { search, results, loading: searchLoading, error } = useSearch();
  const [showNewSongDialog, setShowNewSongDialog] = useState(false);

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Biblioteca</h1>
        <Button 
          size='lg' 
          variant='outline'
          onClick={() => setShowNewSongDialog(true)} 
          className="bg-transparent text-white hover:bg-white/10">
          <MusicNotesPlusIcon size={32} />
          Nova Música
        </Button>
      </header>

      <SearchForm onSearch={(term) => search(term, songs)} loading={searchLoading} error={error} results={results} />
      
      <div className="mt-6">
        <SongListTable songs={[...songs, ...results]} onSongSelect={onSongSelect} />
      </div>

      <SongModal
        isOpen={showNewSongDialog}
        onClose={() => setShowNewSongDialog(false)}
        onSave={() => {
          refreshSongs();
          setShowNewSongDialog(false);
        }}
        song={null}
      />
    </div>
  );
}
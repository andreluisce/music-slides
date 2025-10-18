import React, { useState, useEffect } from 'react';
import { useStageMode } from '../hooks/useStageMode';
import CommandPalette from './library/CommandPalette';
import MusicLibraryV2 from './music-library-v2/MusicLibraryV2';
import VideoPanel from './VideoPanel';
import BiblePanel from './BiblePanel';
import ThemesPanel from './ThemesPanel';
import { api } from '../lib/electron-api';

export default function LibraryPanel() {
  const { mode, setMode } = useStageMode();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine active component based on mode
  const sections = [
    { id: 'songs', component: MusicLibraryV2 },  // Using new V2 library
    { id: 'videos', component: VideoPanel },
    { id: 'bible', component: BiblePanel },
    { id: 'themes', component: ThemesPanel },
  ];

  const ActiveComponent =
    sections.find((s) => s.id === mode)?.component || MusicLibraryV2;

  // Handlers
  const handleSongSelect = (song: any) => {
    setSelectedSong(song);
  };

  const handleOpenLyrics = async (song: any) => {
    try {
      if (song.filePath) {
        await api.openPresentationWindow(song.artist, song.title, song.filePath);
      } else if (song.url) {
        await api.openPresentationWindow(song.artist, song.title, song.url);
      }
    } catch (error) {
      console.error('Error opening lyrics:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Content - MusicLibraryV2 includes its own ArtistSidebar */}
      <main className="flex-1 overflow-auto">
        <ActiveComponent
          onSongSelect={handleSongSelect}
        />
      </main>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSong={handleSongSelect}
        onImportSong={() => { }}
      />
    </div>
  );
}

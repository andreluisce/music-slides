import React, { useState, useEffect } from 'react';
import { useStageMode } from '../hooks/useStageMode';
import { Command } from 'cmdk';
import SidebarLibrary from './library/SidebarLibrary';
import CommandPalette from './library/CommandPalette';
import SongGridPreview from './library/SongGridPreview';
import Inspector from './library/Inspector';
import PlanPanel from './library/PlanPanel';
import MusicLibrary from './MusicLibrary';
import VideoPanel from './VideoPanel';
import BiblePanel from './BiblePanel';
import ThemesPanel from './ThemesPanel';

export default function LibraryPanel() {
  const { mode, setMode } = useStageMode();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    favorites: 0,
    recent: 0,
    cloud: 0,
    local: 0,
  });

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const songs = await window.api?.getUnifiedSongList();
        if (songs && Array.isArray(songs)) {
          setStats({
            total: songs.length,
            favorites: songs.filter(s => s.metadata?.favorite).length,
            recent: songs.filter(s => {
              const updatedAt = new Date(s.metadata?.updatedAt || 0);
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return updatedAt > oneWeekAgo;
            }).length,
            cloud: songs.filter(s => s.syncStatus === 'cloud-only').length,
            local: songs.filter(s => s.syncStatus === 'local-only').length,
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

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
    { id: 'songs', component: MusicLibrary },
    { id: 'videos', component: VideoPanel },
    { id: 'bible', component: BiblePanel },
    { id: 'themes', component: ThemesPanel },
  ];

  const ActiveComponent =
    sections.find((s) => s.id === mode)?.component || MusicLibrary;

  // Handlers
  const handleSongSelect = (song: any) => {
    setSelectedSong(song);
  };

  const handleOpenLyrics = async (song: any) => {
    try {
      if (song.filePath) {
        await window.api?.openLyricsWindow(undefined, song.filePath);
      } else if (song.url) {
        await window.api?.openLyricsWindow(song.url);
      }
    } catch (error) {
      console.error('Error opening lyrics:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar: Library & Playlists */}
      <SidebarLibrary
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
        playlists={[]}
        onSelectPlaylist={() => { }}
        onCreatePlaylist={() => { }}
        onSync={() => { }}
        stats={stats}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <ActiveComponent
            onSongSelect={handleSongSelect}
            selectedSection={selectedSection}
          />
        </main>
      </div>

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

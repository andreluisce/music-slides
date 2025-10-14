
import React from 'react';
import MusicLibrary from './MusicLibrary';
import { MusicLibraryProps } from './MusicLibrary';

interface ShowPanelProps extends MusicLibraryProps {}

export default function ShowPanel({ onSongSelect, selectedSection }: ShowPanelProps) {
  return <MusicLibrary onSongSelect={onSongSelect} selectedSection={selectedSection} />;
}

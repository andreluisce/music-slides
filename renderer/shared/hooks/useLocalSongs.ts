import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';

function useLocalSongs() {
  const [foundLocalSongs, setFoundLocalSongs] = useState([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);

  useEffect(() => {
    ipcRenderer.invoke('getAllLocalSongs').then(songs => {
      setFoundLocalSongs(songs || []);
      setFilteredLocalSongs(songs.map(song => ({ filePath: song })) || []);
    });
  }, []);

  return { foundLocalSongs, filteredLocalSongs };
}

export default useLocalSongs;

import { useEffect, useState } from 'react';
const api = typeof window !== 'undefined' ? window.api : undefined;

function useLocalSongs() {
  const [foundLocalSongs, setFoundLocalSongs] = useState([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);

  useEffect(() => {
    api?.getAllLocalSongs()?.then(songs => {
      setFoundLocalSongs(songs || []);
      setFilteredLocalSongs(songs.map(song => ({ filePath: song })) || []);
    });
  }, []);

  return { foundLocalSongs, filteredLocalSongs };
}

export default useLocalSongs;

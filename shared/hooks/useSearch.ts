import stringSimilarity from 'string-similarity';
import { useState } from 'react';
const api = typeof window !== 'undefined' ? window.api : undefined;

function useSearch() {
  const [searchItem, setSearchItem] = useState('');
  const [foundRemoteSongs, setFoundRemoteSongs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);

  const submitForm = async event => {
    event.preventDefault();
    setFoundRemoteSongs([]);
    setIsSearching(true);
    const result = await api?.findLyrics('ByAnyParameter', `${searchItem}`.trim(), '');
    setIsSearching(false);
    setFoundRemoteSongs(songs => [...songs, ...result]);
  };

  const filterLocalSongs = (text, foundLocalSongs) => {
    if (text) {
      const found = stringSimilarity.findBestMatch(text, foundLocalSongs || []);

      if (found?.ratings) {
        setFilteredLocalSongs(
          found.ratings
            .filter(item => item.rating >= 0.2)
            .map(item => {
              return {
                filePath: item.target,
              };
            })
        );
      }
    } else {
      setFilteredLocalSongs(foundLocalSongs.map(song => ({ filePath: song })));
      setFoundRemoteSongs([]);
    }
  };

  return {
    searchItem,
    setSearchItem,
    submitForm,
    isSearching,
    foundRemoteSongs,
    filterLocalSongs,
    filteredLocalSongs,
  };
}

export default useSearch;

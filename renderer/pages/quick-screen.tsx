import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const api = typeof window !== 'undefined' ? window.api : undefined;

const QuickScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const response = await api.findLyrics(0, '', searchTerm);
    setResults(response);
  };

  const handleSelect = (url: string) => {
    api.openLyricsWindow(url, null, false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <div className="mt-4">
        {results.map(result => (
          <div
            key={result.id}
            className="cursor-pointer p-2 hover:bg-gray-100"
            onClick={() => handleSelect(result.url)}>
            <p className="font-bold">{result.title}</p>
            <p>{result.band}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickScreen;

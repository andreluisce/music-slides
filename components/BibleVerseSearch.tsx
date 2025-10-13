import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const api = typeof window !== 'undefined' ? window.api : undefined;

export const BibleVerseSearch = () => {
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    const response = await api.getBibleVerse(book, parseInt(chapter), parseInt(verse), 'nvi');
    setResult(response);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <Label htmlFor="book">Book</Label>
          <Input id="book" value={book} onChange={e => setBook(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="chapter">Chapter</Label>
          <Input id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="verse">Verse</Label>
          <Input id="verse" value={verse} onChange={e => setVerse(e.target.value)} />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-bold">{result.reference}</h3>
          <p>{result.text}</p>
        </div>
      )}
    </div>
  );
};

import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import { SearchType } from '../shared/types';
import TextEditor from '../components/Editor';

const api = typeof window !== 'undefined' ? window.api : undefined;

function kebabToCapitalizeText(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

function SearchForm({ isSearching, setFoundRemoteSongs, setIsSearching }) {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFoundRemoteSongs([]);
    setIsSearching(true);
    const result = await api?.findLyrics(
      SearchType.ByAnyParameter,
      `${artist}`.trim(),
      `${title}`.trim()
    );

    setIsSearching(false);

    setFoundRemoteSongs(songs => [...songs, ...result]);
  };

  return (
    <form onSubmit={submitForm} className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      <div className='flex flex-col'>
        <Label htmlFor='artist'>Artist</Label>
        <Input
          name='artist'
          id='artist'
          value={artist}
          onChange={event => {
            const text = event.target.value;
            setArtist(text);
          }}
        />
      </div>
      <div className='flex flex-col'>
        <Label htmlFor='title'>Song Title</Label>
        <Input
          name='title'
          id='title'
          value={title}
          onChange={event => {
            const text = event.target.value;
            setTitle(text);
          }}
        />
      </div>

      <Button disabled={(!artist && !title) || isSearching} type='submit'>
        Search
      </Button>
    </form>
  );
}

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

function SongListTable({ filteredLocalSongs, foundRemoteSongs, isSearching }) {
  const [allSongs, setAllSongs] = useState([]);
  const [order, setOrder] = useState('asc');

  const openLyricsWindow = (url, filePath) => {
    api?.openLyricsWindow(url, filePath);
  };

  useEffect(() => {
    setAllSongs([...filteredLocalSongs, ...foundRemoteSongs]);
  }, [filteredLocalSongs, foundRemoteSongs]);

  const sortTableData = criteria => {
    setOrder(order => (order === 'asc' ? 'desc' : 'asc'));
    const orderValue = order === 'asc' ? -1 : 1;
    const sortedData = [...allSongs].sort((a, b) => {
      if (a[criteria].toLowerCase() < b[criteria].toLowerCase()) return -1 * orderValue;
      if (a[criteria].toLowerCase() > b[criteria].toLowerCase()) return 1 * orderValue;
      return 0;
    });

    setAllSongs(sortedData);
  };

  return (
    <div className='grid grid-cols-1'>
      {filteredLocalSongs.length || foundRemoteSongs.length ? (
        <Fragment>
          <Table>
            <TableCaption>Results ({allSongs.length})</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => sortTableData('band')} className='cursor-pointer'>
                  Artist
                </TableHead>
                <TableHead onClick={() => sortTableData('title')} className='cursor-pointer'>
                  Title
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSongs.map(song => (
                <TableRow
                  key={song.url || song.filePath}
                  onClick={() => openLyricsWindow(song.url, song?.filePath)}
                  className='cursor-pointer'>
                  <TableCell className={song?.isLocal ? 'font-bold' : ''}>{song.band}</TableCell>
                  <TableCell className={song?.isLocal ? 'font-bold' : ''}>{song.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Fragment>
      ) : null}
      {isSearching ? (
        <div className='mt-4 flex items-center justify-center'>
          <Loader2 className='h-24 w-24 animate-spin' />
        </div>
      ) : null}
    </div>
  );
}

import { Loader2 } from 'lucide-react';

function Home() {
  const [foundRemoteSongs, setFoundRemoteSongs] = useState([]);

  const [defaultSlides, setDefaultSlides] = useState([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);

  const [isSearching, setIsSearching] = useState(false);

  const getAllLocalSongs = () =>
    api?.getAllLocalSongs()?.then(songs => {
      setFoundRemoteSongs([]);
      setFilteredLocalSongs(
        songs.map(song => {
          const songArray = song?.replaceAll('.txt', '')?.split?.(' - ');
          return {
            filePath: song,
            title: songArray[1],
            band: songArray[0],
            isLocal: true,
          };
        })
      );
    });

  const getDefaultSlides = () =>
    api?.getDefaultSlides()?.then(songs => {
      setDefaultSlides(songs || []);
    });

  useEffect(() => {
    getAllLocalSongs();
    getDefaultSlides();
  }, []);

  const openDefaultSlides = (url, filePath) => {
    api?.openLyricsWindow(url, filePath, true);
  };

  return (
    <section className='container mx-auto p-4'>
      <h1>Hello World</h1>
      <Head>
        <title>Lyrics Slideshow - Index</title>
      </Head>
      <SearchForm
        {...{
          isSearching,
          setFoundRemoteSongs,
          setIsSearching,
        }}
      />

      <div className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-5'>
        <Button onClick={getAllLocalSongs}>Refresh Local Songs</Button>

        {defaultSlides.map(item => {
          const fileName = kebabToCapitalizeText(item.split(' - ')[0]);
          return (
            <Button key={item} onClick={() => openDefaultSlides('', item)}>
              {fileName}
            </Button>
          );
        })}
      </div>
      <div>
        <TextEditor />
      </div>

      <SongListTable {...{ filteredLocalSongs, foundRemoteSongs, isSearching }} />
    </section>
  );
}

export default Home;

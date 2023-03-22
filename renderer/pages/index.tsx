/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, Spinner } from 'theme-ui';

import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import electron from 'electron';
import { SearchType } from '../shared/types';
import TextEditor from '../components/Editor';

const ipcRenderer = electron.ipcRenderer;

function kebabToCapitalizeText(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function SearchForm({ isSearching, setFoundRemoteSongs, setIsSearching }) {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFoundRemoteSongs([]);
    setIsSearching(true);
    const result = await ipcRenderer.invoke(
      'findLyrics',
      SearchType.ByAnyParameter,
      `${title}`.trim(),
      `${artist}`.trim()
    );

    setIsSearching(false);

    setFoundRemoteSongs(songs => [...songs, ...result]);
  };

  return (
    <form
      onSubmit={submitForm}
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr .5fr',
        gridGap: '10px',
        alignItems: 'end',
      }}
    >
      <div sx={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor='search' sx={{ variant: 'components.label' }}>
          Artist
        </label>
        <input
          name='artist'
          id='artist'
          value={artist}
          sx={{ variant: 'components.input' }}
          onChange={event => {
            const text = event.target.value;
            setArtist(text);
          }}
        />
      </div>
      <div sx={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor='search' sx={{ variant: 'components.label' }}>
          Song Title
        </label>
        <input
          name='title'
          id='title'
          value={title}
          sx={{ variant: 'components.input' }}
          onChange={event => {
            const text = event.target.value;
            setTitle(text);
          }}
        />
      </div>

      <button
        disabled={(!artist && !title) || isSearching}
        sx={{
          variant: 'components.button.success',
          cursor: 'pointer',
          ':disabled': {
            backgroundColor: '#d3d3d3',
            color: '#e9e9e9',
          },
        }}
      >
        Search
      </button>
    </form>
  );
}

function SongListTable({ filteredLocalSongs, foundRemoteSongs, isSearching }) {
  const [allSongs, setAllSongs] = useState([]);
  const [order, setOrder] = useState('asc');

  const openLyricsWindow = (url, filePath) => {
    ipcRenderer.invoke('openLyricsWindow', url, filePath);
  };

  useEffect(() => {
    setAllSongs([...filteredLocalSongs, ...foundRemoteSongs]);
  }, [filteredLocalSongs, foundRemoteSongs]);

  const sortTableData = criteria => {
    setOrder(order => (order === 'asc' ? 'desc' : 'asc'));
    const orderValue = order === 'asc' ? -1 : 1;
    const sortedData = allSongs.sort((a, b) => {
      if (a[criteria].toLowerCase() < b[criteria].toLowerCase()) return -1 * orderValue;
      if (a[criteria].toLowerCase() > b[criteria].toLowerCase()) return 1 * orderValue;
      return 0;
    });

    setAllSongs(sortedData);
  };

  return (
    <div sx={{ display: 'grid', gridTemplateColumns: '1fr' }}>
      {filteredLocalSongs.length || foundRemoteSongs.length ? (
        <Fragment>
          <table
            sx={{
              mt: 4,
              '>tr': {
                display: 'grid',
                gridTemplateColumns: '.5fr 1fr',
                p: 2,
                fontSize: 2,
              },
            }}
          >
            <thead>
              <tr
                sx={{
                  th: {
                    backgroundColor: 'header',
                    borderTopLeftRadius: 1,
                    borderTopRightRadius: 1,
                    color: 'white',
                  },
                }}
              >
                <th
                  onClick={() => sortTableData('band')}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  Artist
                </th>
                <th
                  onClick={() => sortTableData('title')}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  Title
                </th>
              </tr>
            </thead>
            <tbody>
              {allSongs.map(song => (
                <tr
                  key={song.url || song.filePath}
                  sx={{
                    cursor: 'pointer',
                    ':not(:nth-last-of-type(-n+2))': {
                      borderBottom: '1px solid lightGray',
                    },
                    ':hover': {
                      backgroundColor: 'hover',
                    },
                  }}
                  onClick={() => openLyricsWindow(song.url, song?.filePath)}
                >
                  <td
                    sx={{
                      fontWeight: song?.isLocal ? 'bold' : '',
                    }}
                  >
                    {song.band}
                  </td>
                  <td
                    sx={{
                      fontWeight: song?.isLocal ? 'bold' : '',
                    }}
                  >
                    {song.title}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot
              sx={{
                backgroundColor: 'header',
                color: 'white',

                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
              }}
            >
              <tr>
                <td colSpan={2}>Results ({allSongs.length})</td>
              </tr>
            </tfoot>
          </table>
        </Fragment>
      ) : null}
      {isSearching ? (
        <div
          sx={{
            marginTop: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spinner variant='styles.spinner' size={100} />
        </div>
      ) : null}
    </div>
  );
}

function Home() {
  const [foundRemoteSongs, setFoundRemoteSongs] = useState([]);

  const [defaultSlides, setDefaultSlides] = useState([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);

  const [isSearching, setIsSearching] = useState(false);

  const getAllLocalSongs = () =>
    ipcRenderer.invoke('getAllLocalSongs').then(songs => {
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
    ipcRenderer.invoke('getDefaultSlides').then(songs => {
      setDefaultSlides(songs || []);
    });

  useEffect(() => {
    getAllLocalSongs();
    getDefaultSlides();
  }, []);

  const openDefaultSlides = (url, filePath) => {
    ipcRenderer.invoke('openLyricsWindow', url, filePath, true);
  };

  return (
    <section
      sx={{
        variant: 'components.indexPage',
      }}
    >
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

      <div
        sx={{
          display: 'grid',
          gridTemplateColumns: '.5fr .5fr .5fr .5fr .5fr',
          mt: 3,
          button: {
            variant: 'components.button.default',
            cursor: 'pointer',
            mr: 2,
          },
        }}
      >
        <button onClick={getAllLocalSongs}>Refresh Local Songs</button>

        {defaultSlides.map(item => {
          const fileName = kebabToCapitalizeText(item.split(' - ')[0]);
          return (
            <button key={item} onClick={() => openDefaultSlides('', item)}>
              {fileName}
            </button>
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

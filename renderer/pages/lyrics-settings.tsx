/** @jsxRuntime classic */
/** @jsx jsx */

import React, { Fragment, useEffect, useState } from 'react';
import { jsx } from 'theme-ui';

import { ipcRenderer } from 'electron';
import fse from 'fs-extra';

import Head from 'next/head';
import queryString from 'query-string';

function LyricsDisplaySettingsPage() {
  const [songLyric, setSongLyric] = useState([]);
  const [backgroundVideos, setBackgroundVideos] = useState([]);
  const [documentsPath, setDocumentsPath] = useState('');
  const [windowId, setWindowId] = useState(2);

  const selectOnChange = (event: any) => {
    ipcRenderer.sendTo(windowId, 'selected-video-background', event.target.value);
  };
  useEffect(() => {
    ipcRenderer.on('loaded-lyrics', (event, loadedLyrics) => {
      setSongLyric(loadedLyrics);
    });
    setTimeout(() => {
      const { windowid } = queryString.parse(location.search);

      setWindowId(Number(windowid));
    }, 2000);

    ipcRenderer.invoke('getPath', 'documents').then(path => {
      const videosPath = `${path}/lyrics-slide-show/videos`;
      setDocumentsPath(videosPath);
      setBackgroundVideos(fse.readdirSync(videosPath));
    });
  }, []);

  return (
    <Fragment>
      <Head>
        <title>Lyrics - Slideshow Settings</title>
      </Head>
      <div
        sx={{
          margin: [3],
        }}
      >
                <div>
          <form>
            <div>
              <label>Choose the background</label>
              <select onChange={selectOnChange}>
                <option key='empty-option' value=''>
                  Select a background video
                </option>
                {backgroundVideos.map(background => (
                  <option key={background} value={`${documentsPath}/${background}`}>
                    {background}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
        <div
          sx={{
            display: 'grid',
            width: '95vw',

            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gridGap: '5px',
            color: 'lightText',
            div: {
              display: 'flex',
              fontSize: '10px',
              minHeight: '100px',
              minWidth: '100px',
              border: 'solid lightgrey 1px',
              alignItems: 'center',
              textAlign: 'center',
              justifyContent: 'center',
              background: 'darkBackground',
              cursor: 'pointer',
            },
          }}
        >
          {songLyric?.map?.((lyr, index) => (
            <div
              key={index}
              onClick={() => {
                ipcRenderer.sendTo(windowId, 'slide-clicked-index', index);
                ipcRenderer.send('focus-target-window', windowId);
              }}
            >
              {lyr}
            </div>
          ))}
        </div>
      </div>
    </Fragment>
  );
}

export default LyricsDisplaySettingsPage;

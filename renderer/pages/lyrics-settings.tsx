import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import queryString from 'query-string';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';

const api = typeof window !== 'undefined' ? window.api : undefined;

function LyricsDisplaySettingsPage() {
  const [songLyric, setSongLyric] = useState([]);
  const [backgroundVideos, setBackgroundVideos] = useState([]);
  const [documentsPath, setDocumentsPath] = useState('');
  const [windowId, setWindowId] = useState(2);

  const selectOnChange = (value: string) => {
    api?.selectVideoBackground(windowId, value);
  };

  useEffect(() => {
    api?.onLoadedLyrics(loadedLyrics => {
      setSongLyric(loadedLyrics);
    });
    setTimeout(() => {
      const { windowid } = queryString.parse(location.search);
      setWindowId(Number(windowid));
    }, 2000);

    api?.getPath('documents').then(path => {
      const videosPath = `${path}/lyrics-slide-show/videos`;
      setDocumentsPath(videosPath);
    });

    api?.getBackgroundVideos().then(videos => setBackgroundVideos(videos));
  }, []);

  return (
    <Fragment>
      <Head>
        <title>Lyrics - Slideshow Settings</title>
      </Head>
      <div className='m-4'>
        <div>
          <form>
            <div>
              <label>Choose the background</label>
              <Select onValueChange={selectOnChange}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a background video' />
                </SelectTrigger>
                <SelectContent>
                  {backgroundVideos.map(background => (
                    <SelectItem key={background} value={`${documentsPath}/${background}`}>
                      {background}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <div className='grid w-full grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1 text-gray-300'>
          {songLyric?.map?.((lyr, index) => (
            <div
              key={index}
              className='flex min-h-[100px] min-w-[100px] cursor-pointer items-center justify-center border border-solid border-gray-300 bg-gray-800 text-center text-xs'
              onClick={() => {
                api?.setActiveSlide(windowId, index);
                api?.focusTargetWindow(windowId);
              }}>
              {lyr}
            </div>
          ))}
        </div>
      </div>
    </Fragment>
  );
}

export default LyricsDisplaySettingsPage;

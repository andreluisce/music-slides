/** @jsxRuntime classic */
/** @jsx jsx */

import React, { Fragment, useEffect, useState } from 'react';
import { jsx, Spinner } from 'theme-ui';
import fs from 'fs';

import { ipcRenderer } from 'electron';
import queryString from 'query-string';

import { LogoSvg } from '../shared/Icons/Logo';
import {
  LoadingContainer,
  LyricsPage,
  LyricsPageContainer,
  LyricsPageWrapper,
} from '../components/LyricsPage';
import Head from 'next/head';

function LyricsDisplayPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [songLyric, setSongLyric] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoBackgroundPath, setVideoBackgroundPath] = useState(
    '/Users/andreluisce/Documents/lyrics-slide-show/videos/golden-particles.mp4'
  );
  const [videoSrcBlog, setVideoSrcBlog] = useState('');

  useEffect(() => {
    if (!songLyric.length) {
      setIsLoading(true);

      const { url, filePath, isDefault } = queryString.parse(location.search);

      const isDefaultBoolean = isDefault === 'true';

      if (filePath) {
        ipcRenderer.invoke('getLyricByFilePath', filePath, isDefaultBoolean).then(res => {
          setSongLyric(res);
          setIsLoading(false);
        });
      } else {
        ipcRenderer.invoke('getLyricByUrlHandle', url).then(res => {
          setSongLyric(res);
          setIsLoading(false);
        });
      }
    }

    ipcRenderer.on('slide-clicked', (event, slideIndex) => {
      setActiveIndex(slideIndex);
    });

    ipcRenderer.on('slide-clicked-index', (event, slideIndex) => {
      setActiveIndex(slideIndex);
    });

    ipcRenderer.on('selected-video-background', (event, video) => {
      setVideoBackgroundPath(video);
    });

    const handleKeyDown = event => {
      if (event.keyCode === 37) {
        setActiveIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex - 1));
      } else if (event.keyCode === 39) {
        setActiveIndex(prevIndex =>
          prevIndex === songLyric.length - 1 ? prevIndex : prevIndex + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [songLyric.length]);

  useEffect(() => {
    if (videoBackgroundPath) {
      const file = fs.readFileSync(videoBackgroundPath);
      console.log(file);
      const blob = new Blob([file], { type: 'video/mp4' });
      setVideoSrcBlog(URL.createObjectURL(blob));
    } else {
      setVideoSrcBlog('');
    }
  }, [videoBackgroundPath]);

  return (
    <Fragment>
      <Head>
        <title>Lyrics Slideshow - Lyrics</title>
      </Head>

      <LyricsPage>
        <video src={videoSrcBlog} autoPlay loop muted></video>
        <LyricsPageWrapper>
          <LyricsPageContainer>
            {songLyric?.map?.((lyr, index) => (
              <p
                key={index}
                className={
                  index === activeIndex
                    ? 'active'
                    : index === activeIndex - 1
                    ? 'prev'
                    : index === activeIndex + 1
                    ? 'next'
                    : ''
                }
              >
                {lyr}
              </p>
            ))}
          </LyricsPageContainer>
        </LyricsPageWrapper>
        {isLoading ? (
          <LoadingContainer>
            <Spinner variant='styles.spinner' size={200} />
          </LoadingContainer>
        ) : null}
        <div
          sx={{
            justifySelf: 'end',
            zIndex: 100,
            transform: 'translateY(-13rem)',
          }}
        >
          <LogoSvg sx={{ width: '100px', height: '100px' }} />
        </div>
      </LyricsPage>
    </Fragment>
  );
}

export default LyricsDisplayPage;

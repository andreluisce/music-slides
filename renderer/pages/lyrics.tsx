import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import queryString from 'query-string';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { LogoSvg } from '../shared/Icons/Logo';

const api = typeof window !== 'undefined' ? window.api : undefined;

function LyricsDisplayPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [songLyric, setSongLyric] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoBackgroundPath, setVideoBackgroundPath] = useState('');
  const [videoSrcBlog, setVideoSrcBlog] = useState('');

  useEffect(() => {
    if (!songLyric.length) {
      setIsLoading(true);

      const { url, filePath, isDefault } = queryString.parse(location.search);

      const isDefaultBoolean = isDefault === 'true';

      if (filePath) {
        api?.getLyricByFilePath(filePath as string, isDefaultBoolean).then(res => {
          setSongLyric(res);
          setIsLoading(false);
        });
      } else {
        api?.getLyricByUrlHandle(url as string).then(res => {
          setSongLyric(res);
          setIsLoading(false);
        });
      }
    }

    api?.onSlideClicked(slideIndex => setActiveIndex(slideIndex));
    api?.onSlideClickedIndex(slideIndex => setActiveIndex(slideIndex));
    api?.onSelectedVideoBackground(video => setVideoBackgroundPath(video));

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
      // Use direct file:// path to avoid loading video into memory
      setVideoSrcBlog(`file://${videoBackgroundPath}`);
    } else {
      setVideoSrcBlog('');
    }
  }, [videoBackgroundPath]);

  return (
    <Fragment>
      <Head>
        <title>Lyrics Slideshow - Lyrics</title>
      </Head>

      <div className='relative h-screen w-screen overflow-hidden'>
        <video src={videoSrcBlog} autoPlay loop muted className='absolute top-0 left-0 h-full w-full object-cover' />
        <div className='relative z-10 flex h-full w-full items-center justify-center'>
          <div className='text-center text-white'>
            <AnimatePresence>
              {songLyric?.map?.((lyr, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: index === activeIndex ? 1 : 0,
                    display: index === activeIndex ? 'block' : 'none',
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className='absolute'>
                  {lyr}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {isLoading ? (
          <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50'>
            <Loader2 className='h-32 w-32 animate-spin text-white' />
          </div>
        ) : null}
        <div className='absolute bottom-4 right-4 z-20'>
          <LogoSvg className='h-24 w-24' />
        </div>
      </div>
    </Fragment>
  );
}

export default LyricsDisplayPage;

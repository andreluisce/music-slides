import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { Global, css } from '@emotion/react';
import emotionNormalize from 'emotion-normalize';

import ThemeProvider from '../shared/theme';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <Global
        styles={css`
          ${emotionNormalize}

          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;600&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
          @import url('https://use.typekit.net/ycs4qqw.css');

          html,
          body,
          #root {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            width: 100vw;
            display: grid;
            scroll-behavior: smooth;
          }
        `}
      />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </React.Fragment>
  );
}

export default MyApp;

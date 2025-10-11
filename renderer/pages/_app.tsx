import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import Layout from '../components/Layout';

// Polyfill global for Electron
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// Pages that should NOT use the layout (fullscreen presentation pages)
const pagesWithoutLayout = ['/lyrics', '/lyrics-settings'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const useLayout = !pagesWithoutLayout.includes(router.pathname);

  return (
    <React.Fragment>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      {useLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </React.Fragment>
  );
}

export default MyApp;

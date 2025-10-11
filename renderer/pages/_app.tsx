import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

// Polyfill global for Electron
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// Pages that should NOT use the layout (fullscreen presentation pages)
const pagesWithoutLayout = ['/lyrics', '/lyrics-settings'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const useLayout = !pagesWithoutLayout.includes(router.pathname);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled Error in Renderer Process:', event.error);
      // Optionally, display a user-friendly error message
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection in Renderer Process:', event.reason);
      // Optionally, display a user-friendly error message
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <React.Fragment>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <ErrorBoundary>
        {useLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
      </ErrorBoundary>
    </React.Fragment>
  );
}

export default MyApp;

import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

// Conditionally import ipcRenderer
let ipcRenderer: Electron.IpcRenderer | undefined;
if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
  ipcRenderer = window.require('electron').ipcRenderer;
}

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
      if (ipcRenderer) { // Only send if ipcRenderer is available
        ipcRenderer.send('renderer-error', {
          message: event.message,
          stack: event.error?.stack,
          type: 'error',
        });
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection in Renderer Process:', event.reason);
      if (ipcRenderer) { // Only send if ipcRenderer is available
        ipcRenderer.send('renderer-error', {
          message: event.reason instanceof Error ? event.reason.message : String(event.reason),
          stack: event.reason instanceof Error ? event.reason.stack : undefined,
          type: 'unhandledRejection',
        });
      }
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

import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta charSet='utf-8' />
          {/* Google Fonts for Lyrics Display */}
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
          <link
            href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Roboto:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;600;700&family=DM+Sans:wght@400;500;700&family=Epilogue:wght@400;600;700&display=swap'
            rel='stylesheet'
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof global === 'undefined') {
                  window.global = window;
                }
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

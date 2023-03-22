/* eslint-disable @typescript-eslint/no-explicit-any */
import * as CSS from 'csstype';
import { Scale } from '@theme-ui/css';
import { makeTheme } from '@theme-ui/css/utils';

import rootTheme from '@theme-ui/preset-base';

type Modify<T, R> = Omit<T, keyof R> & R;

type CustomThemeType = Modify<
  ReturnType<typeof makeTheme>,
  { components: any; fontSizes?: Scale<CSS.Property.FontSize<string>> }
>;

const convertToRem = (list: number[]) =>
  (list as unknown as any[]).map<string>(f => `${f / 10}rem`);

const fontSizes = convertToRem(rootTheme.fontSizes);
const space = convertToRem(rootTheme.space);

const base: CustomThemeType = {
  ...rootTheme,
  config: {
    useColorSchemeMediaQuery: false,
  },

  breakpoints: ['600px', '1024px'],
  colors: {
    white: '#fff',
    gray: '#b5b5b5',
    black: '#000',
    text: '#282a36',
    lightText: '#f8f8f2',
    background: '#f8f8f2',
    darkBackground: '#282a36',
    primary: '#f8f8f2',
    secondary: '#9c27b0',
    currentLine: '#44475a',
    comment: '#6272a4',
    purple: '#bd93f9',
    success: '#30caa6',
    danger: '#f3667e',
    warning: '#ffb86c',
    info: '#0b96d2',
    hover: 'rgba(40, 42, 54, .1)',
    header: 'rgba(98, 144, 164, .7)',
  },
  space,
  fontSizes,
  fonts: {
    body: 'Montserrat, sans-serif',
    heading: 'Bebas Neue, sans-serif',
    monospace: 'monospace',
  },
  fontWeights: {
    light: 100,
    body: 300,
    heading: 600,
    bold: 600,
  },
  components: {
    containers: {
      mainPage: {
        padding: '2rem 4rem',
      },
    },
    defaultButton: {
      border: '0px',
      borderRadius: 0,
      padding: 2,
    },
    button: {
      info: {
        variant: 'components.defaultButton',
        backgroundColor: 'info',
        color: 'white',
      },
      success: {
        variant: 'components.defaultButton',
        backgroundColor: 'success',
        color: 'white',
      },
      default: {
        variant: 'components.defaultButton',
        backgroundColor: 'comment',
        color: 'white',
      },
    },

    input: {
      color: 'black',
      borderRadius: 0,
      border: '0px',
      padding: 2,
    },
    label: {
      fontSize: 3,
      pl: 2,
      pb: 2,
      fontWeight: 'bold',
    },
    indexPage: {
      variant: 'components.containers.mainPage',
      background: 'primary',
      color: 'black',
    },
    lyricsPage: {
      variant: 'components.containers.mainPage',
      background: 'darkBackground',
      color: 'lightText',
    },
  },
  sizes: space,
  borders: ['1px solid #000', '1px solid #999'],
  borderWidths: ['.1rem', '.2rem', '.4rem'],
  borderStyles: ['solid'],
  radii: ['.8rem', '1.5rem', '2rem', '3rem', '50%'],

  styles: {
    ...rootTheme.styles,

    spinner: {
      color: 'info',
    },
    root: {
      ...rootTheme.styles.root,
      fontSize: '62.5%',
    },
    body: {
      fontSize: [1, 2],
    },
    hr: {
      borderColor: 'background',
    },
  },
};

export default base;

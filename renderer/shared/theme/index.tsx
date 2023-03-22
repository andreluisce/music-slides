import { ReactNode } from 'react';

import { ThemeProvider as ThemeUiProvider } from 'theme-ui';

import theme from './theme';

type Props = {
  children: ReactNode;
};
const ThemeProvider = ({ children }: Props) => {
  return <ThemeUiProvider theme={theme}>{children}</ThemeUiProvider>;
};

export default ThemeProvider;

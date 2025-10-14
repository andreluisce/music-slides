export interface Theme {
  name: string;
  titleFont: string;
  bodyFont: string;
  fontSize: number;
  textColor: string;
  textShadow: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: number;
  transitionType: 'fade' | 'slide' | 'zoom';
  animation: string;
}

export const THEME_PRESETS: Theme[] = [
  {
    name: 'Padrão',
    titleFont: 'DM Sans',
    bodyFont: 'DM Sans',
    fontSize: 80,
    textColor: '#FFFFFF',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    backgroundColor: '#000000',
    textAlign: 'center',
    fontWeight: 700,
    transitionType: 'fade',
    animation: 'fade'
  },
  {
    name: 'Elegant Gold',
    titleFont: 'Epilogue',
    bodyFont: 'Epilogue',
    fontSize: 64,
    textColor: '#FFD700', // Gold color
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    backgroundColor: '#000000',
    textAlign: 'center',
    fontWeight: 600,
    transitionType: 'slide',
    animation: 'slide'
  },
  {
    name: 'Bold Impact',
    titleFont: 'Epilogue',
    bodyFont: 'Epilogue',
    fontSize: 67,
    textColor: '#FF00FF', // Magenta
    textShadow: '3px 3px 0px rgba(0,255,255,0.5)', // Cyan shadow for neon effect
    backgroundColor: '#000000',
    textAlign: 'center',
    fontWeight: 800,
    transitionType: 'zoom',
    animation: 'zoom'
  },
  {
    name: 'Neon Glow',
    titleFont: 'DM Sans',
    bodyFont: 'DM Sans',
    fontSize: 72,
    textColor: '#00FFFF', // Cyan
    textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF',
    backgroundColor: '#000000',
    textAlign: 'center',
    fontWeight: 700,
    transitionType: 'fade',
    animation: 'fade'
  }
];
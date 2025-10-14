export interface Font {
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
  url: string;
}

export const FONTS: Font[] = [
  {
    name: 'Montserrat',
    family: 'Montserrat',
    category: 'sans-serif',
    variants: ['400', '500', '600', '700', '800'],
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap'
  },
  {
    name: 'Open Sans',
    family: 'Open Sans',
    category: 'sans-serif',
    variants: ['400', '600', '700', '800'],
    url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap'
  },
  {
    name: 'Lora',
    family: 'Lora',
    category: 'serif',
    variants: ['400', '500', '600', '700'],
    url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap'
  },
  {
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'serif',
    variants: ['400', '500', '600', '700', '800'],
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap'
  },
  {
    name: 'DM Sans',
    family: 'DM Sans',
    category: 'sans-serif',
    variants: ['400', '500', '700'],
    url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap'
  },
  {
    name: 'Inter',
    family: 'Inter',
    category: 'sans-serif',
    variants: ['400', '500', '600', '700', '800'],
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
  },
  {
    name: 'Epilogue',
    family: 'Epilogue',
    category: 'sans-serif',
    variants: ['400', '500', '600', '700', '800'],
    url: 'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800&display=swap'
  },
  {
    name: 'Space Grotesk',
    family: 'Space Grotesk',
    category: 'sans-serif',
    variants: ['400', '500', '600', '700'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
  }
];
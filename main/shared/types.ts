export const SearchType = {
  ByAnyParameter: 'ByAnyParameter',
  ByTitleAndArtist: 'ByTitleAndArtist',
  ByTitleAndArtistExact: 'ByTitleAndArtistExact',
};

export interface Slide {
  text: string;
  section: string;
  emotion: string;
  layoutSuggestion: string;
  duration: number;
}

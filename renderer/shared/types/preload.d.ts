export {};

declare global {
  interface Window {
    api?: {
      openLyricsWindow: (url?: string, filePath?: string, isDefault?: boolean) => Promise<void> | void;
      getPath: (name: string) => Promise<string>;
      getAllLocalSongs: () => Promise<string[]>;
      getDefaultSlides: () => Promise<string[]>;
      getBackgroundVideos: () => Promise<string[]>;
      findLyrics: (searchType: string, artist: string, title: string) => Promise<any>;
      getLyricByFilePath: (filePath: string, isDefault?: boolean) => Promise<string[]>;
      getLyricByUrlHandle: (url: string) => Promise<string[]>;
      onSlideClicked: (cb: (idx: number) => void) => void;
      onSlideClickedIndex: (cb: (idx: number) => void) => void;
      onSelectedVideoBackground: (cb: (videoPath: string) => void) => void;
      onLoadedLyrics: (cb: (lyrics: string[]) => void) => void;
      selectVideoBackground: (windowId: number, videoPath: string) => void;
      setActiveSlide: (windowId: number, index: number) => void;
      focusTargetWindow: (windowId: number) => void;
      getSetting: (key: string) => Promise<any> | any;
      setSetting: (key: string, value: any) => Promise<void> | void;
    };
  }
}

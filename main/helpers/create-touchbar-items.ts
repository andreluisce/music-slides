import { BrowserWindow, TouchBar } from 'electron';
const { TouchBarButton, TouchBarScrubber } = TouchBar;

const CreateTouchBarLyrics = (lyrics: string[]) => {
  const touchBarItems = lyrics.map(item => {
    return new TouchBarButton({
      label: `🎸 ${item}`,
      backgroundColor: '#7851A9',
    });
  });

  return new TouchBar({
    items: [
      new TouchBarScrubber({
        items: touchBarItems,
        selectedStyle: 'background',
        overlayStyle: 'outline',
        highlight(highlightedIndex) {
          const win = BrowserWindow.getFocusedWindow();
          win.webContents.send('slide-clicked', highlightedIndex);
        },
        mode: 'free',
        showArrowButtons: true,
      }),
    ],
  });
};

export default CreateTouchBarLyrics;

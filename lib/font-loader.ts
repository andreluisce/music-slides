import { FONTS } from './fonts-service';

export function loadFonts() {
  // Create a style element
  const style = document.createElement('style');
  
  // Generate @import rules for all fonts
  const fontImports = FONTS.map(font => `@import url('${font.url}');`).join('\n');
  
  // Add the imports to the style element
  style.textContent = fontImports;
  
  // Add the style element to the document head
  document.head.appendChild(style);
}

// Load fonts when this module is imported
loadFonts();
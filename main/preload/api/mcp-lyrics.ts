import { ipcRenderer } from 'electron';

export const mcpLyricsApi = {
  // Search using FireCrawl MCP + AI
  searchWithFireCrawl: (artist: string, title: string) =>
    ipcRenderer.invoke('mcp-lyrics:search-firecrawl', { artist, title }),
  
  // Get lyrics using FireCrawl MCP + AI
  getLyricsWithFireCrawl: (url: string) =>
    ipcRenderer.invoke('mcp-lyrics:get-lyrics-firecrawl', url),
  
  // Search using Playwright MCP
  searchWithPlaywright: (artist: string, title: string) =>
    ipcRenderer.invoke('mcp-lyrics:search-playwright', { artist, title }),
  
  // Get lyrics using Playwright MCP
  getLyricsWithPlaywright: (url: string) =>
    ipcRenderer.invoke('mcp-lyrics:get-lyrics-playwright', url),
  
  // Initialize MCP services
  initializeMCP: () =>
    ipcRenderer.invoke('mcp-lyrics:initialize'),
  
  // Check MCP status
  getMCPStatus: () =>
    ipcRenderer.invoke('mcp-lyrics:status'),
  
  // Cleanup MCP services
  cleanupMCP: () =>
    ipcRenderer.invoke('mcp-lyrics:cleanup')
};
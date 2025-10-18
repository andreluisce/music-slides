import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Search, ExternalLink, Zap, Bot } from 'lucide-react';

interface SearchResult {
  artist: string;
  title: string;
  url: string;
  confidence?: number;
}

interface LyricsResult {
  artist: string;
  title: string;
  lyrics: string;
  source: string;
  metadata?: {
    album?: string;
    year?: string;
    duration?: string;
  };
}

interface MCPStatus {
  initialized: boolean;
  servers: string[];
  providers: {
    firecrawl?: boolean;
    playwright?: boolean;
  };
}

export function MCPLyricsSearchPanel() {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLyrics, setIsGettingLyrics] = useState(false);
  const [mcpStatus, setMCPStatus] = useState<MCPStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check MCP status on component mount
  useEffect(() => {
    checkMCPStatus();
  }, []);

  const checkMCPStatus = async () => {
    try {
      if (window.mcpLyrics) {
        const status = await window.mcpLyrics.getMCPStatus();
        setMCPStatus(status);
        
        if (!status.initialized) {
          // Try to initialize if not already done
          const initResult = await window.mcpLyrics.initializeMCP();
          if (initResult.success) {
            // Check status again after initialization
            const newStatus = await window.mcpLyrics.getMCPStatus();
            setMCPStatus(newStatus);
          }
        }
      }
    } catch (error) {
      console.error('Error checking MCP status:', error);
      setError('Failed to check MCP status');
    }
  };

  const searchWithFireCrawl = async () => {
    if (!artist.trim() || !title.trim()) {
      setError('Please enter both artist and title');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setLyrics(null);

    try {
      const response = await window.mcpLyrics.searchWithFireCrawl(artist.trim(), title.trim());
      
      if (response.success) {
        setSearchResults(response.results || []);
        if (response.results.length === 0) {
          setError('No results found');
        }
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('FireCrawl search error:', error);
      setError('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const searchWithPlaywright = async () => {
    if (!artist.trim() || !title.trim()) {
      setError('Please enter both artist and title');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setLyrics(null);

    try {
      const response = await window.mcpLyrics.searchWithPlaywright(artist.trim(), title.trim());
      
      if (response.success) {
        setSearchResults(response.results || []);
        if (response.results.length === 0) {
          setError('No results found');
        }
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Playwright search error:', error);
      setError('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const getLyrics = async (url: string, useFireCrawl: boolean = true) => {
    setIsGettingLyrics(true);
    setError(null);
    setLyrics(null);

    try {
      const response = useFireCrawl 
        ? await window.mcpLyrics.getLyricsWithFireCrawl(url)
        : await window.mcpLyrics.getLyricsWithPlaywright(url);
      
      if (response.success && response.result) {
        setLyrics(response.result);
      } else {
        setError(response.error || 'Failed to get lyrics');
      }
    } catch (error) {
      console.error('Get lyrics error:', error);
      setError('Failed to get lyrics: ' + error.message);
    } finally {
      setIsGettingLyrics(false);
    }
  };

  const getConfidenceColor = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 p-6">
      {/* MCP Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            MCP Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mcpStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Initialized:</span>
                <Badge variant={mcpStatus.initialized ? 'default' : 'destructive'}>
                  {mcpStatus.initialized ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Servers:</span>
                {mcpStatus.servers.map(server => (
                  <Badge key={server} variant="outline">{server}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span>Providers:</span>
                {mcpStatus.providers.firecrawl && <Badge variant="outline">FireCrawl</Badge>}
                {mcpStatus.providers.playwright && <Badge variant="outline">Playwright</Badge>}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Loading status...</div>
          )}
        </CardContent>
      </Card>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Lyrics Search</CardTitle>
          <CardDescription>
            Search for lyrics using Gemini AI-powered scraping with FireCrawl or Playwright MCP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Artist</label>
              <Input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist name"
                disabled={isSearching}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter song title"
                disabled={isSearching}
                onKeyPress={(e) => e.key === 'Enter' && searchWithFireCrawl()}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={searchWithFireCrawl}
              disabled={isSearching || !mcpStatus?.providers.firecrawl}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Search with FireCrawl + Gemini
            </Button>
            <Button
              onClick={searchWithPlaywright}
              disabled={isSearching || !mcpStatus?.providers.playwright}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search with Playwright
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-muted-foreground">{result.artist}</div>
                    {result.confidence !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">Confidence:</span>
                        <div className={`w-2 h-2 rounded-full ${getConfidenceColor(result.confidence)}`} />
                        <span className="text-xs">{Math.round(result.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => getLyrics(result.url, true)}
                      disabled={isGettingLyrics}
                      className="flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Get Lyrics (Gemini)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.url, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lyrics Display */}
      {isGettingLyrics && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Extracting lyrics with Gemini AI...
            </div>
          </CardContent>
        </Card>
      )}

      {lyrics && (
        <Card>
          <CardHeader>
            <CardTitle>{lyrics.title}</CardTitle>
            <CardDescription>
              by {lyrics.artist} • Source: {lyrics.source}
              {lyrics.metadata?.album && ` • Album: ${lyrics.metadata.album}`}
              {lyrics.metadata?.year && ` • Year: ${lyrics.metadata.year}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line font-mono text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
              {lyrics.lyrics}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Type definitions for window.mcpLyrics
declare global {
  interface Window {
    mcpLyrics?: {
      searchWithFireCrawl: (artist: string, title: string) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
      getLyricsWithFireCrawl: (url: string) => Promise<{ success: boolean; result?: LyricsResult; error?: string }>;
      searchWithPlaywright: (artist: string, title: string) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
      getLyricsWithPlaywright: (url: string) => Promise<{ success: boolean; result?: LyricsResult; error?: string }>;
      initializeMCP: () => Promise<{ success: boolean; message: string }>;
      getMCPStatus: () => Promise<MCPStatus>;
      cleanupMCP: () => Promise<{ success: boolean; message: string }>;
    };
  }
}
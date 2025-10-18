import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { 
  Play, 
  Pause, 
  Music, 
  Download, 
  RefreshCw,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  Plus
} from 'lucide-react';

interface Song {
  id?: number;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  year?: string;
  genre?: string;
  lyrics?: string;
  lyrics_source?: string;
  lyrics_updated_at?: string;
  has_lyrics?: boolean;
}

interface BatchProgress {
  processed: number;
  total: number;
  current?: Song;
  isRunning: boolean;
}

export function MusicLibraryLyricsManager() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({ processed: 0, total: 0, isRunning: false });
  const [autoProcessingActive, setAutoProcessingActive] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Mock data for demonstration - replace with your actual music library integration
  useEffect(() => {
    // Load songs from your music library
    loadSongs();
    loadStats();
  }, []);

  const loadSongs = async () => {
    // TODO: Replace with actual API call to your music library
    // Example: const response = await window.api.songs.getAll();
    const mockSongs: Song[] = [
      {
        id: 1,
        title: "Tempo Perdido",
        artist: "Legião Urbana",
        album: "Dois",
        year: "1986",
        has_lyrics: false
      },
      {
        id: 2,
        title: "Eduardo e Mônica",
        artist: "Legião Urbana",
        album: "Dois",
        year: "1986",
        has_lyrics: true,
        lyrics_source: "firecrawl-ai"
      },
      {
        id: 3,
        title: "Pais e Filhos",
        artist: "Legião Urbana",
        album: "As Quatro Estações",
        year: "1989",
        has_lyrics: false
      }
    ];
    setSongs(mockSongs);
  };

  const loadStats = async () => {
    try {
      const response = await window.lyricsIntegration.musicLibrary.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const songsWithoutLyrics = filteredSongs.filter(song => !song.has_lyrics);

  const handleSelectSong = (songId: number, checked: boolean) => {
    const newSelected = new Set(selectedSongs);
    if (checked) {
      newSelected.add(songId);
    } else {
      newSelected.delete(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSongs(new Set(filteredSongs.map(song => song.id!)));
    } else {
      setSelectedSongs(new Set());
    }
  };

  const handleGetLyricsForSong = async (song: Song) => {
    try {
      setIsLoading(true);
      const result = await window.lyricsIntegration.musicLibrary.getLyrics(song);
      
      if (result.success) {
        // Update song in local state
        setSongs(prev => prev.map(s => 
          s.id === song.id 
            ? { ...s, has_lyrics: true, lyrics: result.lyrics, lyrics_source: result.source }
            : s
        ));
        alert(`Lyrics found for ${song.artist} - ${song.title}!`);
      } else {
        alert(`Failed to find lyrics: ${result.error}`);
      }
    } catch (error) {
      console.error('Error getting lyrics:', error);
      alert('Error getting lyrics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchGetLyrics = async () => {
    const selectedSongsList = filteredSongs.filter(song => selectedSongs.has(song.id!));
    
    if (selectedSongsList.length === 0) {
      alert('Please select songs first');
      return;
    }

    try {
      setBatchProgress({ processed: 0, total: selectedSongsList.length, isRunning: true });
      
      const result = await window.lyricsIntegration.musicLibrary.batchGetLyrics(selectedSongsList);
      
      if (result.success) {
        // Update songs based on results
        const successfulSongs = result.results.filter(r => r.result.success);
        setSongs(prev => prev.map(song => {
          const successResult = successfulSongs.find(r => r.song.id === song.id);
          if (successResult) {
            return {
              ...song,
              has_lyrics: true,
              lyrics: successResult.result.lyrics,
              lyrics_source: successResult.result.source
            };
          }
          return song;
        }));

        alert(`Batch completed: ${result.successful} successful, ${result.failed} failed`);
      } else {
        alert(`Batch failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in batch processing:', error);
      alert('Error in batch processing');
    } finally {
      setBatchProgress({ processed: 0, total: 0, isRunning: false });
    }
  };

  const handleAutoFillLyrics = async () => {
    try {
      setIsLoading(true);
      const result = await window.lyricsIntegration.musicLibrary.autoFillLyrics(filteredSongs);
      
      if (result.success) {
        await loadSongs(); // Reload songs to get updated data
        alert(`Auto-fill completed: ${result.filled} filled, ${result.skipped} skipped, ${result.failed} failed`);
      } else {
        alert(`Auto-fill failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in auto-fill:', error);
      alert('Error in auto-fill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoProcessing = async () => {
    try {
      if (autoProcessingActive) {
        await window.lyricsIntegration.musicLibrary.stopAutoProcessing();
        setAutoProcessingActive(false);
      } else {
        await window.lyricsIntegration.musicLibrary.startAutoProcessing();
        setAutoProcessingActive(true);
      }
    } catch (error) {
      console.error('Error toggling auto-processing:', error);
    }
  };

  const handleAddToQueue = async () => {
    const selectedSongsList = filteredSongs.filter(song => selectedSongs.has(song.id!));
    
    if (selectedSongsList.length === 0) {
      alert('Please select songs first');
      return;
    }

    try {
      const result = await window.lyricsIntegration.musicLibrary.addToQueue(selectedSongsList);
      if (result.success) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Music Library Lyrics Manager</h1>
          <p className="text-muted-foreground">
            Manage and automatically fetch lyrics for your music library
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSongs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            onClick={handleToggleAutoProcessing}
            variant={autoProcessingActive ? "destructive" : "default"}
            size="sm"
          >
            {autoProcessingActive ? (
              <>
                <StopCircle className="h-4 w-4 mr-1" />
                Stop Auto-Processing
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-1" />
                Start Auto-Processing
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{songs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Lyrics</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {songs.filter(s => s.has_lyrics).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Without Lyrics</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {songsWithoutLyrics.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {songs.length > 0 ? Math.round((songs.filter(s => s.has_lyrics).length / songs.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Actions</CardTitle>
          <CardDescription>
            Perform actions on multiple songs at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAutoFillLyrics} disabled={isLoading}>
              <Download className="h-4 w-4 mr-1" />
              Auto-Fill All Missing Lyrics
            </Button>
            <Button onClick={handleBatchGetLyrics} disabled={selectedSongs.size === 0 || batchProgress.isRunning}>
              <Download className="h-4 w-4 mr-1" />
              Get Lyrics for Selected ({selectedSongs.size})
            </Button>
            <Button onClick={handleAddToQueue} disabled={selectedSongs.size === 0} variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add to Queue ({selectedSongs.size})
            </Button>
          </div>

          {batchProgress.isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing songs...</span>
                <span>{batchProgress.processed} / {batchProgress.total}</span>
              </div>
              <Progress value={(batchProgress.processed / batchProgress.total) * 100} />
              {batchProgress.current && (
                <p className="text-sm text-muted-foreground">
                  Current: {batchProgress.current.artist} - {batchProgress.current.title}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Songs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Songs ({filteredSongs.length})</CardTitle>
              <CardDescription>
                {songsWithoutLyrics.length} songs without lyrics
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedSongs.size === filteredSongs.length && filteredSongs.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label className="text-sm">Select All</label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSongs.map((song) => (
              <div key={song.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedSongs.has(song.id!)}
                    onCheckedChange={(checked) => handleSelectSong(song.id!, !!checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{song.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {song.artist} {song.album && `• ${song.album}`} {song.year && `• ${song.year}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {song.has_lyrics ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Has Lyrics
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      No Lyrics
                    </Badge>
                  )}
                  {song.lyrics_source && (
                    <Badge variant="outline" className="text-xs">
                      {song.lyrics_source}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleGetLyricsForSong(song)}
                    disabled={isLoading}
                  >
                    <Search className="h-3 w-3 mr-1" />
                    Get Lyrics
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Type definitions for the component
declare global {
  interface Window {
    lyricsIntegration?: {
      musicLibrary: {
        getLyrics: (song: Song) => Promise<{
          success: boolean;
          lyrics?: string;
          source?: string;
          error?: string;
        }>;
        batchGetLyrics: (songs: Song[]) => Promise<{
          success: boolean;
          processed: number;
          successful: number;
          failed: number;
          results: Array<{ song: Song; result: any }>;
          error?: string;
        }>;
        autoFillLyrics: (songs: Song[]) => Promise<{
          success: boolean;
          processed: number;
          filled: number;
          skipped: number;
          failed: number;
          error?: string;
        }>;
        searchAndReplaceLyrics: (song: Song) => Promise<any>;
        getStats: () => Promise<{ success: boolean; stats?: any }>;
        startAutoProcessing: () => Promise<{ success: boolean; message: string }>;
        stopAutoProcessing: () => Promise<{ success: boolean; message: string }>;
        addToQueue: (songs: Song[]) => Promise<{ success: boolean; message: string }>;
      };
    };
  }
}
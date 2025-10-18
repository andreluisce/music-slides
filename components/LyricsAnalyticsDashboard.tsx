import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Database, 
  Trash2, 
  Download,
  RefreshCw,
  Zap,
  Music,
  Search,
  Target
} from 'lucide-react';

interface AnalyticsStats {
  totalSearches: number;
  totalLyricsRequests: number;
  successfulSearches: number;
  successfulLyricsRequests: number;
  averageSearchDuration: number;
  averageLyricsDuration: number;
  mostSearchedArtists: Record<string, number>;
  mostSearchedSongs: Record<string, number>;
  sourcesUsage: Record<string, number>;
  errorsByType: Record<string, number>;
  dailyUsage: Record<string, number>;
  cacheEfficiency: {
    searchHitRate: number;
    lyricsHitRate: number;
  };
}

interface CacheStats {
  searchCacheSize: number;
  lyricsCacheSize: number;
  searchHitRate: number;
  lyricsHitRate: number;
  totalSearches: number;
  cacheHits: number;
  cacheMisses: number;
  totalLyricsRequests: number;
  lyricsHits: number;
  lyricsMisses: number;
}

interface PerformanceMetrics {
  searchDurations: number[];
  lyricsDurations: number[];
  errorRates: {
    search: number;
    lyrics: number;
  };
  sourcePerformance: Record<string, {
    averageDuration: number;
    successRate: number;
    totalRequests: number;
  }>;
}

interface TopSearched {
  artists: Array<{ name: string; count: number }>;
  songs: Array<{ name: string; count: number }>;
}

export function LyricsAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<{
    stats: AnalyticsStats;
    performance: PerformanceMetrics;
    topSearched: TopSearched;
  } | null>(null);
  
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [analyticsResponse, cacheResponse] = await Promise.all([
        window.lyricsIntegration.analytics.getStats(),
        window.lyricsIntegration.cache.getStats()
      ]);

      if (analyticsResponse.success) {
        setAnalyticsData(analyticsResponse.data);
      }

      if (cacheResponse.success) {
        setCacheStats(cacheResponse.stats);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const result = await window.lyricsIntegration.cache.clear();
      if (result.success) {
        await loadData();
        alert('Cache cleared successfully!');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  const handleClearAnalytics = async () => {
    try {
      const result = await window.lyricsIntegration.analytics.clear();
      if (result.success) {
        await loadData();
        alert('Analytics data cleared successfully!');
      }
    } catch (error) {
      console.error('Failed to clear analytics:', error);
      alert('Failed to clear analytics data');
    }
  };

  const handleExportData = async () => {
    try {
      const result = await window.lyricsIntegration.analytics.export();
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `lyrics-analytics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100) / 100}%`;
  };

  if (isLoading && !analyticsData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lyrics Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Performance metrics and usage statistics for lyrics search
          </p>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="top-searches">Top Searches</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.stats.totalSearches || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.stats.successfulSearches || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lyrics Requests</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.stats.totalLyricsRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.stats.successfulLyricsRequests || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Search Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(analyticsData?.stats.averageSearchDuration || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lyrics: {formatDuration(analyticsData?.stats.averageLyricsDuration || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(cacheStats?.searchHitRate || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lyrics: {formatPercentage(cacheStats?.lyricsHitRate || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sources Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Sources Usage</CardTitle>
              <CardDescription>Distribution of requests by source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analyticsData?.stats.sourcesUsage || {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{source}</Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Rates</CardTitle>
                <CardDescription>Failure rates by request type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Search Errors:</span>
                    <Badge variant={analyticsData?.performance.errorRates.search > 10 ? "destructive" : "default"}>
                      {formatPercentage(analyticsData?.performance.errorRates.search || 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Lyrics Errors:</span>
                    <Badge variant={analyticsData?.performance.errorRates.lyrics > 10 ? "destructive" : "default"}>
                      {formatPercentage(analyticsData?.performance.errorRates.lyrics || 0)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Performance metrics by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData?.performance.sourcePerformance || {}).map(([source, metrics]) => (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{source}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {metrics.totalRequests} requests
                        </span>
                      </div>
                      <div className="text-sm">
                        <span>Avg: {formatDuration(metrics.averageDuration)}</span>
                        <span className="ml-4">Success: {formatPercentage(metrics.successRate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Error Breakdown</CardTitle>
              <CardDescription>Common error types and their frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analyticsData?.stats.errorsByType || {}).map(([errorType, count]) => (
                  <div key={errorType} className="flex items-center justify-between">
                    <span className="text-sm">{errorType}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Size</CardTitle>
                <CardDescription>Current cache entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Search Cache:</span>
                    <Badge>{cacheStats?.searchCacheSize || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Lyrics Cache:</span>
                    <Badge>{cacheStats?.lyricsCacheSize || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hit Rates</CardTitle>
                <CardDescription>Cache effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Search Hits:</span>
                    <Badge variant={cacheStats?.searchHitRate > 50 ? "default" : "secondary"}>
                      {formatPercentage(cacheStats?.searchHitRate || 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Lyrics Hits:</span>
                    <Badge variant={cacheStats?.lyricsHitRate > 50 ? "default" : "secondary"}>
                      {formatPercentage(cacheStats?.lyricsHitRate || 0)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
                <CardDescription>Clear cache data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleClearCache} 
                  variant="outline" 
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Cache
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache Statistics</CardTitle>
              <CardDescription>Detailed cache performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Searches</div>
                  <div className="text-2xl">{cacheStats?.totalSearches || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Cache Hits</div>
                  <div className="text-2xl text-green-600">{cacheStats?.cacheHits || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Cache Misses</div>
                  <div className="text-2xl text-red-600">{cacheStats?.cacheMisses || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Lyrics Requests</div>
                  <div className="text-2xl">{cacheStats?.totalLyricsRequests || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Searches Tab */}
        <TabsContent value="top-searches" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Artists</CardTitle>
                <CardDescription>Most searched artists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData?.topSearched.artists.slice(0, 10).map((artist, index) => (
                    <div key={artist.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm">{artist.name}</span>
                      </div>
                      <Badge>{artist.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Songs</CardTitle>
                <CardDescription>Most searched songs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData?.topSearched.songs.slice(0, 10).map((song, index) => (
                    <div key={song.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm truncate">{song.name}</span>
                      </div>
                      <Badge>{song.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your analytics and cache data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleClearAnalytics} variant="outline">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Analytics
            </Button>
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Type definitions for window.lyricsIntegration
declare global {
  interface Window {
    lyricsIntegration?: {
      cache: {
        getStats: () => Promise<{ success: boolean; stats?: CacheStats }>;
        clear: () => Promise<{ success: boolean; message?: string }>;
      };
      analytics: {
        getStats: () => Promise<{ success: boolean; data?: { stats: AnalyticsStats; performance: PerformanceMetrics; topSearched: TopSearched } }>;
        export: () => Promise<{ success: boolean; data?: any }>;
        clear: () => Promise<{ success: boolean; message?: string }>;
        getEvents: (startTime: number, endTime: number) => Promise<{ success: boolean; events?: any }>;
      };
      musicLibrary: {
        getLyrics: (song: any) => Promise<any>;
        batchGetLyrics: (songs: any[]) => Promise<any>;
        autoFillLyrics: (songs: any[]) => Promise<any>;
        searchAndReplaceLyrics: (song: any) => Promise<any>;
        getStats: () => Promise<any>;
        startAutoProcessing: () => Promise<any>;
        stopAutoProcessing: () => Promise<any>;
        addToQueue: (songs: any[]) => Promise<any>;
      };
    };
  }
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  X, 
  Pause, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ProgressUpdate {
  id: string;
  title: string;
  message: string;
  progress: number; // 0-100
  status: 'running' | 'completed' | 'failed' | 'paused';
  details?: {
    current?: string;
    total?: number;
    processed?: number;
    successful?: number;
    failed?: number;
    eta?: number; // estimated time remaining in ms
  };
}

interface ProgressNotificationCenterProps {
  className?: string;
  maxVisible?: number;
  showCompleted?: boolean;
}

export function ProgressNotificationCenter({ 
  className, 
  maxVisible = 5, 
  showCompleted = true 
}: ProgressNotificationCenterProps) {
  const [progressItems, setProgressItems] = useState<ProgressUpdate[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load initial progress
    loadActiveProgress();

    // Set up event listeners
    if (window.lyricsIntegration?.progress) {
      const progress = window.lyricsIntegration.progress;

      progress.onProgressStarted(handleProgressStarted);
      progress.onProgressUpdated(handleProgressUpdated);
      progress.onProgressCompleted(handleProgressCompleted);
      progress.onProgressFailed(handleProgressFailed);
      progress.onProgressCancelled(handleProgressCancelled);
      progress.onProgressRemoved(handleProgressRemoved);

      // Cleanup on unmount
      return () => {
        progress.removeAllListeners();
      };
    }
  }, []);

  const loadActiveProgress = async () => {
    try {
      if (window.lyricsIntegration?.progress) {
        const activeProgress = await window.lyricsIntegration.progress.getAll();
        setProgressItems(activeProgress || []);
      }
    } catch (error) {
      console.error('Failed to load active progress:', error);
    }
  };

  const handleProgressStarted = (progress: ProgressUpdate) => {
    setProgressItems(prev => [...prev, progress]);
  };

  const handleProgressUpdated = (progress: ProgressUpdate) => {
    setProgressItems(prev => 
      prev.map(item => item.id === progress.id ? progress : item)
    );
  };

  const handleProgressCompleted = (progress: ProgressUpdate) => {
    setProgressItems(prev => 
      prev.map(item => item.id === progress.id ? progress : item)
    );
  };

  const handleProgressFailed = (progress: ProgressUpdate) => {
    setProgressItems(prev => 
      prev.map(item => item.id === progress.id ? progress : item)
    );
  };

  const handleProgressCancelled = (progress: ProgressUpdate) => {
    setProgressItems(prev => prev.filter(item => item.id !== progress.id));
  };

  const handleProgressRemoved = (data: { id: string }) => {
    setProgressItems(prev => prev.filter(item => item.id !== data.id));
  };

  const handleCancel = async (progressId: string) => {
    try {
      if (window.lyricsIntegration?.progress) {
        await window.lyricsIntegration.progress.cancel(progressId);
      }
    } catch (error) {
      console.error('Failed to cancel progress:', error);
    }
  };

  const handleClearCompleted = async () => {
    try {
      if (window.lyricsIntegration?.progress) {
        await window.lyricsIntegration.progress.clearCompleted();
        setProgressItems(prev => 
          prev.filter(item => item.status === 'running' || item.status === 'paused')
        );
      }
    } catch (error) {
      console.error('Failed to clear completed:', error);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter items based on showCompleted prop
  const filteredItems = showCompleted 
    ? progressItems 
    : progressItems.filter(item => item.status === 'running' || item.status === 'paused');

  // Limit visible items
  const visibleItems = isExpanded 
    ? filteredItems 
    : filteredItems.slice(0, maxVisible);

  const hasMoreItems = filteredItems.length > maxVisible;
  const completedCount = progressItems.filter(item => item.status === 'completed' || item.status === 'failed').length;

  if (filteredItems.length === 0) {
    return null; // Don't show the component if there are no progress items
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Progress</CardTitle>
            <CardDescription>
              {filteredItems.length} active • {completedCount} completed
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {completedCount > 0 && (
              <Button 
                onClick={handleClearCompleted}
                variant="outline" 
                size="sm"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            {hasMoreItems && (
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                size="sm"
              >
                <MoreHorizontal className="h-3 w-3" />
                {isExpanded ? 'Less' : 'More'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleItems.map((item) => (
          <div key={item.id} className="space-y-2 p-3 border rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', getStatusColor(item.status))} />
                <span className="font-medium text-sm">{item.title}</span>
                <Badge variant="outline" className="h-5">
                  {getStatusIcon(item.status)}
                  <span className="ml-1 text-xs">{item.status}</span>
                </Badge>
              </div>
              {(item.status === 'running' || item.status === 'paused') && (
                <Button
                  onClick={() => handleCancel(item.id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={item.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.progress}%</span>
                {item.details?.processed !== undefined && item.details?.total && (
                  <span>
                    {item.details.processed} / {item.details.total}
                  </span>
                )}
                {item.details?.eta && item.status === 'running' && (
                  <span>
                    {formatDuration(item.details.eta)} remaining
                  </span>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="text-sm text-muted-foreground">
              {item.message}
            </div>

            {/* Current Item */}
            {item.details?.current && item.status === 'running' && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Current: {item.details.current}
              </div>
            )}

            {/* Statistics */}
            {(item.details?.successful || item.details?.failed) && (
              <div className="flex gap-4 text-xs">
                {item.details.successful ? (
                  <span className="text-green-600">
                    ✓ {item.details.successful} successful
                  </span>
                ) : null}
                {item.details.failed ? (
                  <span className="text-red-600">
                    ✗ {item.details.failed} failed
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}
        
        {hasMoreItems && !isExpanded && (
          <div className="text-center">
            <Button
              onClick={() => setIsExpanded(true)}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Show {filteredItems.length - maxVisible} more items
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Type definitions
declare global {
  interface Window {
    lyricsIntegration?: {
      progress?: {
        getAll: () => Promise<ProgressUpdate[]>;
        get: (progressId: string) => Promise<ProgressUpdate | null>;
        cancel: (progressId: string) => Promise<boolean>;
        clearCompleted: () => Promise<{ success: boolean }>;
        updateOptions: (options: any) => Promise<{ success: boolean }>;
        onProgressStarted: (callback: (progress: ProgressUpdate) => void) => void;
        onProgressUpdated: (callback: (progress: ProgressUpdate) => void) => void;
        onProgressCompleted: (callback: (progress: ProgressUpdate) => void) => void;
        onProgressFailed: (callback: (progress: ProgressUpdate) => void) => void;
        onProgressCancelled: (callback: (progress: ProgressUpdate) => void) => void;
        onProgressRemoved: (callback: (data: { id: string }) => void) => void;
        removeAllListeners: () => void;
      };
    };
  }
}
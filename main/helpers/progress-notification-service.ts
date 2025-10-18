import { ipcMain, BrowserWindow, Notification } from 'electron';
import * as path from 'path';

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

interface NotificationOptions {
  showSystemNotifications: boolean;
  showInAppNotifications: boolean;
  soundEnabled: boolean;
  minProgressForNotification: number; // minimum progress to show notification
}

/**
 * Service for managing progress notifications during batch operations
 * Supports both system notifications and in-app progress displays
 */
export class ProgressNotificationService {
  private activeProgress: Map<string, ProgressUpdate> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private options: NotificationOptions;

  constructor() {
    this.options = {
      showSystemNotifications: true,
      showInAppNotifications: true,
      soundEnabled: true,
      minProgressForNotification: 25
    };

    this.setupHandlers();
  }

  /**
   * Set the main window for in-app notifications
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * Setup IPC handlers for progress management
   */
  private setupHandlers() {
    // Get all active progress
    ipcMain.handle('progress:get-all', () => {
      return Array.from(this.activeProgress.values());
    });

    // Get specific progress
    ipcMain.handle('progress:get', (event, progressId: string) => {
      return this.activeProgress.get(progressId) || null;
    });

    // Cancel progress
    ipcMain.handle('progress:cancel', (event, progressId: string) => {
      return this.cancelProgress(progressId);
    });

    // Update notification options
    ipcMain.handle('progress:update-options', (event, newOptions: Partial<NotificationOptions>) => {
      this.options = { ...this.options, ...newOptions };
      return this.options;
    });

    // Get notification options
    ipcMain.handle('progress:get-options', () => {
      return this.options;
    });
  }

  /**
   * Start a new progress tracking
   */
  startProgress(
    id: string,
    title: string,
    message: string,
    total?: number
  ): void {
    console.log(`[ProgressNotification] Starting progress: ${id} - ${title}`);

    const progress: ProgressUpdate = {
      id,
      title,
      message,
      progress: 0,
      status: 'running',
      details: {
        total,
        processed: 0,
        successful: 0,
        failed: 0
      }
    };

    this.activeProgress.set(id, progress);
    this.sendToRenderer('progress-started', progress);

    // Show initial notification if enabled
    if (this.options.showSystemNotifications) {
      this.showSystemNotification(title, message, 'info');
    }
  }

  /**
   * Update progress
   */
  updateProgress(
    id: string,
    updates: Partial<ProgressUpdate>
  ): void {
    const current = this.activeProgress.get(id);
    if (!current) {
      console.warn(`[ProgressNotification] Progress ${id} not found`);
      return;
    }

    const updated: ProgressUpdate = {
      ...current,
      ...updates,
      details: {
        ...current.details,
        ...updates.details
      }
    };

    // Calculate progress if not provided but we have processed/total
    if (updates.progress === undefined && updated.details?.total && updated.details?.processed !== undefined) {
      updated.progress = Math.round((updated.details.processed / updated.details.total) * 100);
    }

    // Calculate ETA
    if (updated.details?.total && updated.details?.processed && updated.progress > 5) {
      const startTime = Date.now() - (updated.details.processed * 1000); // rough estimate
      const timePerItem = (Date.now() - startTime) / updated.details.processed;
      const remaining = updated.details.total - updated.details.processed;
      updated.details.eta = remaining * timePerItem;
    }

    this.activeProgress.set(id, updated);
    this.sendToRenderer('progress-updated', updated);

    // Show milestone notifications
    this.checkMilestoneNotifications(current, updated);

    console.log(`[ProgressNotification] Progress ${id}: ${updated.progress}% (${updated.details?.processed}/${updated.details?.total})`);
  }

  /**
   * Complete progress
   */
  completeProgress(
    id: string,
    message?: string,
    details?: {
      successful?: number;
      failed?: number;
      duration?: number;
    }
  ): void {
    const current = this.activeProgress.get(id);
    if (!current) return;

    const completed: ProgressUpdate = {
      ...current,
      progress: 100,
      status: 'completed',
      message: message || current.message,
      details: {
        ...current.details,
        ...details
      }
    };

    this.activeProgress.set(id, completed);
    this.sendToRenderer('progress-completed', completed);

    // Show completion notification
    if (this.options.showSystemNotifications) {
      const completionMessage = this.formatCompletionMessage(completed);
      this.showSystemNotification(
        `${completed.title} - Completed`,
        completionMessage,
        'success'
      );
    }

    console.log(`[ProgressNotification] Progress completed: ${id}`);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      this.removeProgress(id);
    }, 30000);
  }

  /**
   * Fail progress
   */
  failProgress(
    id: string,
    error: string,
    details?: {
      successful?: number;
      failed?: number;
    }
  ): void {
    const current = this.activeProgress.get(id);
    if (!current) return;

    const failed: ProgressUpdate = {
      ...current,
      status: 'failed',
      message: error,
      details: {
        ...current.details,
        ...details
      }
    };

    this.activeProgress.set(id, failed);
    this.sendToRenderer('progress-failed', failed);

    // Show error notification
    if (this.options.showSystemNotifications) {
      this.showSystemNotification(
        `${failed.title} - Failed`,
        error,
        'error'
      );
    }

    console.error(`[ProgressNotification] Progress failed: ${id} - ${error}`);

    // Auto-remove after 60 seconds for errors
    setTimeout(() => {
      this.removeProgress(id);
    }, 60000);
  }

  /**
   * Pause progress
   */
  pauseProgress(id: string): void {
    const current = this.activeProgress.get(id);
    if (!current) return;

    const paused: ProgressUpdate = {
      ...current,
      status: 'paused'
    };

    this.activeProgress.set(id, paused);
    this.sendToRenderer('progress-paused', paused);
  }

  /**
   * Resume progress
   */
  resumeProgress(id: string): void {
    const current = this.activeProgress.get(id);
    if (!current) return;

    const resumed: ProgressUpdate = {
      ...current,
      status: 'running'
    };

    this.activeProgress.set(id, resumed);
    this.sendToRenderer('progress-resumed', resumed);
  }

  /**
   * Cancel progress
   */
  cancelProgress(id: string): boolean {
    const current = this.activeProgress.get(id);
    if (!current) return false;

    this.sendToRenderer('progress-cancelled', current);
    this.removeProgress(id);

    console.log(`[ProgressNotification] Progress cancelled: ${id}`);
    return true;
  }

  /**
   * Remove progress from tracking
   */
  removeProgress(id: string): void {
    this.activeProgress.delete(id);
    this.sendToRenderer('progress-removed', { id });
  }

  /**
   * Get all active progress
   */
  getActiveProgress(): ProgressUpdate[] {
    return Array.from(this.activeProgress.values());
  }

  /**
   * Clear all completed/failed progress
   */
  clearCompleted(): void {
    const toRemove: string[] = [];
    
    for (const [id, progress] of this.activeProgress) {
      if (progress.status === 'completed' || progress.status === 'failed') {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.removeProgress(id));
    console.log(`[ProgressNotification] Cleared ${toRemove.length} completed items`);
  }

  /**
   * Send data to renderer process
   */
  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(`progress-notification:${channel}`, data);
    }
  }

  /**
   * Show system notification
   */
  private showSystemNotification(title: string, body: string, type: 'info' | 'success' | 'error'): void {
    try {
      // Check if notifications are supported and permission is granted
      if (!Notification.isSupported()) return;

      const notification = new Notification({
        title,
        body,
        icon: this.getIconForType(type),
        silent: !this.options.soundEnabled
      });

      notification.on('click', () => {
        // Bring main window to front when notification is clicked
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore();
          }
          this.mainWindow.focus();
        }
      });

      notification.show();
    } catch (error) {
      console.error('[ProgressNotification] Failed to show system notification:', error);
    }
  }

  /**
   * Get icon path for notification type
   */
  private getIconForType(type: 'info' | 'success' | 'error'): string {
    // Return path to appropriate icon based on type
    // You can customize these paths based on your app's icon structure
    const iconMap = {
      info: 'icon.png',
      success: 'icon.png',
      error: 'icon.png'
    };

    return path.join(__dirname, '../../public/images', iconMap[type]);
  }

  /**
   * Check and show milestone notifications
   */
  private checkMilestoneNotifications(previous: ProgressUpdate, current: ProgressUpdate): void {
    if (!this.options.showSystemNotifications) return;

    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (
        previous.progress < milestone && 
        current.progress >= milestone &&
        current.progress >= this.options.minProgressForNotification
      ) {
        const eta = current.details?.eta ? this.formatDuration(current.details.eta) : '';
        const message = `${milestone}% complete${eta ? ` (${eta} remaining)` : ''}`;
        
        this.showSystemNotification(
          current.title,
          message,
          'info'
        );
        break; // Only show one milestone notification per update
      }
    }
  }

  /**
   * Format completion message
   */
  private formatCompletionMessage(progress: ProgressUpdate): string {
    const details = progress.details;
    if (!details) return 'Task completed successfully';

    const parts: string[] = [];
    
    if (details.successful) {
      parts.push(`${details.successful} successful`);
    }
    
    if (details.failed) {
      parts.push(`${details.failed} failed`);
    }
    
    if (details.duration) {
      parts.push(`in ${this.formatDuration(details.duration)}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Task completed successfully';
  }

  /**
   * Format duration in human readable form
   */
  private formatDuration(ms: number): string {
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
  }
}

// Global service instance
export const progressNotificationService = new ProgressNotificationService();
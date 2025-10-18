import { Notification, nativeTheme, app } from 'electron';
import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface NotificationTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  sounds: {
    success: string;
    warning: string;
    error: string;
    info: string;
    progress: string;
  };
  icons: {
    success: string;
    warning: string;
    error: string;
    info: string;
    progress: string;
  };
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showOnLockScreen: boolean;
  showInDarkMode: boolean;
  customTheme: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number; // milliseconds
  maxVisible: number;
  categories: {
    lyrics: boolean;
    progress: boolean;
    sync: boolean;
    errors: boolean;
  };
  urgency: 'low' | 'normal' | 'critical';
  customSounds: Record<string, string>;
}

interface CustomNotification {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'progress';
  category: 'lyrics' | 'progress' | 'sync' | 'errors';
  urgency: 'low' | 'normal' | 'critical';
  data?: any;
  timestamp: number;
  duration?: number;
  actions?: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Advanced notification customization service
 * Supports themes, custom sounds, positioning, and rich notifications
 */
export class NotificationCustomizationService {
  private settings: NotificationSettings;
  private themes: Map<string, NotificationTheme> = new Map();
  private activeNotifications: Map<string, Notification> = new Map();
  private notificationQueue: CustomNotification[] = [];
  private soundCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadBuiltInThemes();
    this.setupHandlers();
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadCustomThemes();
      await this.preloadSounds();
      
      console.log('[NotificationCustomization] Service initialized');
    } catch (error) {
      console.error('[NotificationCustomization] Failed to initialize:', error);
    }
  }

  /**
   * Setup IPC handlers
   */
  private setupHandlers(): void {
    // Get notification settings
    ipcMain.handle('notifications:get-settings', () => {
      return this.settings;
    });

    // Update notification settings
    ipcMain.handle('notifications:update-settings', async (event, newSettings: Partial<NotificationSettings>) => {
      return this.updateSettings(newSettings);
    });

    // Get available themes
    ipcMain.handle('notifications:get-themes', () => {
      return Array.from(this.themes.values());
    });

    // Create custom theme
    ipcMain.handle('notifications:create-theme', async (event, theme: NotificationTheme) => {
      return this.createCustomTheme(theme);
    });

    // Send custom notification
    ipcMain.handle('notifications:send-custom', async (event, notification: Omit<CustomNotification, 'id' | 'timestamp'>) => {
      return this.sendCustomNotification(notification);
    });

    // Test notification
    ipcMain.handle('notifications:test', async (event, type: string) => {
      return this.sendTestNotification(type);
    });

    // Clear all notifications
    ipcMain.handle('notifications:clear-all', () => {
      return this.clearAllNotifications();
    });

    // Get notification history
    ipcMain.handle('notifications:get-history', () => {
      return this.getNotificationHistory();
    });

    // Import custom sound
    ipcMain.handle('notifications:import-sound', async (event, { name, filePath }) => {
      return this.importCustomSound(name, filePath);
    });

    // Test sound
    ipcMain.handle('notifications:test-sound', async (event, soundPath: string) => {
      return this.testSound(soundPath);
    });
  }

  /**
   * Send enhanced notification
   */
  async sendEnhancedNotification(
    title: string,
    body: string,
    type: 'success' | 'warning' | 'error' | 'info' | 'progress' = 'info',
    category: 'lyrics' | 'progress' | 'sync' | 'errors' = 'lyrics',
    options?: {
      urgency?: 'low' | 'normal' | 'critical';
      duration?: number;
      data?: any;
      actions?: Array<{ type: string; text: string }>;
    }
  ): Promise<string> {
    
    // Check if notifications are enabled for this category
    if (!this.settings.enabled || !this.settings.categories[category]) {
      return '';
    }

    const notification: CustomNotification = {
      id: this.generateNotificationId(),
      title,
      body,
      type,
      category,
      urgency: options?.urgency || this.settings.urgency,
      timestamp: Date.now(),
      duration: options?.duration || this.settings.duration,
      data: options?.data,
      actions: options?.actions
    };

    return this.processNotification(notification);
  }

  /**
   * Process and display notification
   */
  private async processNotification(notification: CustomNotification): Promise<string> {
    try {
      const theme = this.themes.get(this.settings.customTheme) || this.themes.get('default')!;
      
      // Create system notification
      const systemNotification = new Notification({
        title: notification.title,
        body: notification.body,
        icon: this.getIconPath(notification.type, theme),
        silent: !this.settings.soundEnabled,
        urgency: notification.urgency,
        timeoutType: notification.urgency === 'critical' ? 'never' : 'default',
        ...(notification.actions && {
          actions: notification.actions.map(action => ({
            type: 'button',
            text: action.text
          }))
        })
      });

      // Handle notification events
      systemNotification.on('click', () => {
        this.handleNotificationClick(notification);
      });

      systemNotification.on('action', (event, index) => {
        this.handleNotificationAction(notification, index);
      });

      systemNotification.on('close', () => {
        this.activeNotifications.delete(notification.id);
      });

      // Show notification
      systemNotification.show();
      this.activeNotifications.set(notification.id, systemNotification);

      // Play custom sound
      if (this.settings.soundEnabled) {
        await this.playNotificationSound(notification.type, theme);
      }

      // Auto-dismiss after duration (if not critical)
      if (notification.urgency !== 'critical' && notification.duration) {
        setTimeout(() => {
          if (this.activeNotifications.has(notification.id)) {
            systemNotification.close();
          }
        }, notification.duration);
      }

      console.log(`[NotificationCustomization] Sent ${notification.type} notification: ${notification.title}`);
      return notification.id;

    } catch (error) {
      console.error('[NotificationCustomization] Failed to process notification:', error);
      return '';
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      
      // Apply settings immediately
      await this.applySettings();
      
      console.log('[NotificationCustomization] Settings updated');
      return true;
    } catch (error) {
      console.error('[NotificationCustomization] Failed to update settings:', error);
      return false;
    }
  }

  /**
   * Create custom theme
   */
  async createCustomTheme(theme: NotificationTheme): Promise<boolean> {
    try {
      this.themes.set(theme.id, theme);
      await this.saveCustomTheme(theme);
      
      console.log(`[NotificationCustomization] Created custom theme: ${theme.name}`);
      return true;
    } catch (error) {
      console.error('[NotificationCustomization] Failed to create theme:', error);
      return false;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(type: string): Promise<string> {
    const testMessages = {
      success: {
        title: 'Success Test',
        body: 'This is a test success notification with custom styling!'
      },
      warning: {
        title: 'Warning Test', 
        body: 'This is a test warning notification. Please review.'
      },
      error: {
        title: 'Error Test',
        body: 'This is a test error notification. Something went wrong!'
      },
      info: {
        title: 'Info Test',
        body: 'This is a test info notification with helpful information.'
      },
      progress: {
        title: 'Progress Test',
        body: 'This is a test progress notification. Task is 75% complete.'
      }
    };

    const message = testMessages[type] || testMessages.info;
    
    return this.sendEnhancedNotification(
      message.title,
      message.body,
      type as any,
      'lyrics',
      { urgency: 'normal' }
    );
  }

  /**
   * Import custom sound
   */
  async importCustomSound(name: string, filePath: string): Promise<boolean> {
    try {
      const soundsDir = path.join(app.getPath('userData'), 'notification-sounds');
      await fs.promises.mkdir(soundsDir, { recursive: true });
      
      const extension = path.extname(filePath);
      const targetPath = path.join(soundsDir, `${name}${extension}`);
      
      await fs.promises.copyFile(filePath, targetPath);
      
      // Update settings with custom sound
      this.settings.customSounds[name] = targetPath;
      await this.saveSettings();
      
      console.log(`[NotificationCustomization] Imported custom sound: ${name}`);
      return true;
    } catch (error) {
      console.error('[NotificationCustomization] Failed to import sound:', error);
      return false;
    }
  }

  /**
   * Test sound playback
   */
  async testSound(soundPath: string): Promise<boolean> {
    try {
      // For Electron main process, we'll use a different approach
      // You might want to send this to renderer process for actual playback
      console.log(`[NotificationCustomization] Testing sound: ${soundPath}`);
      return true;
    } catch (error) {
      console.error('[NotificationCustomization] Failed to test sound:', error);
      return false;
    }
  }

  /**
   * Clear all active notifications
   */
  clearAllNotifications(): boolean {
    try {
      for (const [id, notification] of this.activeNotifications) {
        notification.close();
      }
      this.activeNotifications.clear();
      
      console.log('[NotificationCustomization] Cleared all notifications');
      return true;
    } catch (error) {
      console.error('[NotificationCustomization] Failed to clear notifications:', error);
      return false;
    }
  }

  /**
   * Get notification history
   */
  getNotificationHistory(): CustomNotification[] {
    // Implement notification history storage if needed
    return [];
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(notification: CustomNotification): void {
    console.log(`[NotificationCustomization] Notification clicked: ${notification.id}`);
    
    // You can implement custom click handlers here
    // For example, bring app to foreground, navigate to specific screen, etc.
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(notification: CustomNotification, actionIndex: number): void {
    const action = notification.actions?.[actionIndex];
    if (action) {
      console.log(`[NotificationCustomization] Notification action: ${action.type}`);
      
      // Handle different action types
      switch (action.type) {
        case 'view':
          // Navigate to relevant screen
          break;
        case 'dismiss':
          // Dismiss notification
          break;
        case 'retry':
          // Retry the operation
          break;
      }
    }
  }

  /**
   * Play notification sound
   */
  private async playNotificationSound(type: string, theme: NotificationTheme): Promise<void> {
    try {
      const soundPath = this.settings.customSounds[type] || theme.sounds[type];
      if (soundPath && fs.existsSync(soundPath)) {
        // In the main process, we'll need to delegate sound playing to the renderer
        // or use a native solution
        console.log(`[NotificationCustomization] Playing sound: ${soundPath}`);
      }
    } catch (error) {
      console.error('[NotificationCustomization] Failed to play sound:', error);
    }
  }

  /**
   * Get icon path for notification type
   */
  private getIconPath(type: string, theme: NotificationTheme): string {
    const iconPath = theme.icons[type] || theme.icons.info;
    const fullPath = path.join(__dirname, '../../public/images/notifications', iconPath);
    
    // Fallback to default app icon if custom icon doesn't exist
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    
    return path.join(__dirname, '../../public/images/icon.png');
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      soundEnabled: true,
      showOnLockScreen: true,
      showInDarkMode: true,
      customTheme: 'default',
      position: 'top-right',
      duration: 5000,
      maxVisible: 3,
      categories: {
        lyrics: true,
        progress: true,
        sync: true,
        errors: true
      },
      urgency: 'normal',
      customSounds: {}
    };
  }

  /**
   * Load built-in themes
   */
  private loadBuiltInThemes(): void {
    const defaultTheme: NotificationTheme = {
      id: 'default',
      name: 'Default',
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#6b7280'
      },
      sounds: {
        success: 'success.wav',
        warning: 'warning.wav', 
        error: 'error.wav',
        info: 'info.wav',
        progress: 'progress.wav'
      },
      icons: {
        success: 'success.png',
        warning: 'warning.png',
        error: 'error.png',
        info: 'info.png',
        progress: 'progress.png'
      }
    };

    const darkTheme: NotificationTheme = {
      id: 'dark',
      name: 'Dark',
      colors: {
        primary: '#1f2937',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#4b5563'
      },
      sounds: {
        success: 'dark-success.wav',
        warning: 'dark-warning.wav',
        error: 'dark-error.wav',
        info: 'dark-info.wav',
        progress: 'dark-progress.wav'
      },
      icons: {
        success: 'dark-success.png',
        warning: 'dark-warning.png',
        error: 'dark-error.png',
        info: 'dark-info.png',
        progress: 'dark-progress.png'
      }
    };

    this.themes.set('default', defaultTheme);
    this.themes.set('dark', darkTheme);
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'notification-settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = await fs.promises.readFile(settingsPath, 'utf8');
        const savedSettings = JSON.parse(data);
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('[NotificationCustomization] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'notification-settings.json');
      await fs.promises.writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('[NotificationCustomization] Failed to save settings:', error);
    }
  }

  /**
   * Load custom themes
   */
  private async loadCustomThemes(): Promise<void> {
    try {
      const themesDir = path.join(app.getPath('userData'), 'notification-themes');
      if (fs.existsSync(themesDir)) {
        const themeFiles = await fs.promises.readdir(themesDir);
        
        for (const file of themeFiles) {
          if (file.endsWith('.json')) {
            const themePath = path.join(themesDir, file);
            const themeData = await fs.promises.readFile(themePath, 'utf8');
            const theme: NotificationTheme = JSON.parse(themeData);
            this.themes.set(theme.id, theme);
          }
        }
      }
    } catch (error) {
      console.error('[NotificationCustomization] Failed to load custom themes:', error);
    }
  }

  /**
   * Save custom theme
   */
  private async saveCustomTheme(theme: NotificationTheme): Promise<void> {
    try {
      const themesDir = path.join(app.getPath('userData'), 'notification-themes');
      await fs.promises.mkdir(themesDir, { recursive: true });
      
      const themePath = path.join(themesDir, `${theme.id}.json`);
      await fs.promises.writeFile(themePath, JSON.stringify(theme, null, 2));
    } catch (error) {
      console.error('[NotificationCustomization] Failed to save theme:', error);
    }
  }

  /**
   * Preload sounds
   */
  private async preloadSounds(): Promise<void> {
    // Implement sound preloading if needed
    console.log('[NotificationCustomization] Sounds preloaded');
  }

  /**
   * Apply current settings
   */
  private async applySettings(): Promise<void> {
    // Apply theme changes, sound preferences, etc.
    console.log('[NotificationCustomization] Settings applied');
  }

  /**
   * Send custom notification (from IPC)
   */
  private async sendCustomNotification(notificationData: Omit<CustomNotification, 'id' | 'timestamp'>): Promise<string> {
    return this.sendEnhancedNotification(
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.category,
      {
        urgency: notificationData.urgency,
        duration: notificationData.duration,
        data: notificationData.data,
        actions: notificationData.actions
      }
    );
  }
}

// Global service instance
export const notificationCustomizationService = new NotificationCustomizationService();
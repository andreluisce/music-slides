import { supabase } from '../../lib/supabase';
import { lyricsAnalyticsService } from './lyrics-analytics-service';
import { lyricsCacheService } from './lyrics-cache-service';
import { ipcMain } from 'electron';
import * as os from 'os';
import * as crypto from 'crypto';

interface SyncMetadata {
  device_id: string;
  entity_id: string;
  entity_type: 'lyrics_cache' | 'analytics_data' | 'user_preferences' | 'progress_state';
  last_synced_at: string;
  checksum: string;
  version: number;
  synced_to_cloud: boolean;
  conflict_detected: boolean;
}

interface DeviceInfo {
  device_id: string;
  device_name: string;
  platform: string;
  app_version: string;
  last_seen: string;
  is_active: boolean;
}

interface SyncConflict {
  entity_id: string;
  entity_type: string;
  local_version: number;
  remote_version: number;
  local_checksum: string;
  remote_checksum: string;
  local_data: any;
  remote_data: any;
  conflict_resolution?: 'local' | 'remote' | 'merge' | 'manual';
}

/**
 * Cross-device synchronization service for lyrics data
 * Syncs cache, analytics, preferences, and progress across devices
 */
export class CrossDeviceSyncService {
  private deviceId: string;
  private deviceInfo: DeviceInfo;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private isSyncing = false;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.deviceInfo = this.createDeviceInfo();
    this.setupHandlers();
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[CrossDeviceSync] Initializing for device: ${this.deviceId}`);
      
      // Register device
      await this.registerDevice();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      console.log('[CrossDeviceSync] Service initialized successfully');
    } catch (error) {
      console.error('[CrossDeviceSync] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Setup IPC handlers
   */
  private setupHandlers(): void {
    // Manual sync trigger
    ipcMain.handle('sync:trigger-manual-sync', async () => {
      return this.performFullSync();
    });

    // Get sync status
    ipcMain.handle('sync:get-status', async () => {
      return this.getSyncStatus();
    });

    // Get connected devices
    ipcMain.handle('sync:get-devices', async () => {
      return this.getConnectedDevices();
    });

    // Resolve sync conflict
    ipcMain.handle('sync:resolve-conflict', async (event, { conflictId, resolution, mergedData }) => {
      return this.resolveConflict(conflictId, resolution, mergedData);
    });

    // Get pending conflicts
    ipcMain.handle('sync:get-conflicts', async () => {
      return this.getPendingConflicts();
    });

    // Enable/disable sync
    ipcMain.handle('sync:set-enabled', async (event, enabled: boolean) => {
      return this.setSyncEnabled(enabled);
    });

    // Get sync settings
    ipcMain.handle('sync:get-settings', async () => {
      return this.getSyncSettings();
    });

    // Update sync settings
    ipcMain.handle('sync:update-settings', async (event, settings) => {
      return this.updateSyncSettings(settings);
    });
  }

  /**
   * Perform full synchronization
   */
  async performFullSync(): Promise<{
    success: boolean;
    syncedEntities: number;
    conflicts: number;
    errors: string[];
  }> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedEntities: 0,
        conflicts: 0,
        errors: ['Sync already in progress']
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let syncedEntities = 0;
    let conflicts = 0;
    const errors: string[] = [];

    try {
      console.log('[CrossDeviceSync] Starting full sync...');

      // Update device last seen
      await this.updateDeviceActivity();

      // Sync analytics data
      try {
        await this.syncAnalyticsData();
        syncedEntities++;
      } catch (error) {
        errors.push(`Analytics sync failed: ${error.message}`);
      }

      // Sync cache data
      try {
        await this.syncCacheData();
        syncedEntities++;
      } catch (error) {
        errors.push(`Cache sync failed: ${error.message}`);
      }

      // Sync user preferences
      try {
        await this.syncUserPreferences();
        syncedEntities++;
      } catch (error) {
        errors.push(`Preferences sync failed: ${error.message}`);
      }

      // Check for conflicts
      const pendingConflicts = await this.getPendingConflicts();
      conflicts = pendingConflicts.length;

      const duration = Date.now() - startTime;
      console.log(`[CrossDeviceSync] Sync completed in ${duration}ms: ${syncedEntities} entities, ${conflicts} conflicts`);

      return {
        success: errors.length === 0,
        syncedEntities,
        conflicts,
        errors
      };

    } catch (error) {
      console.error('[CrossDeviceSync] Full sync failed:', error);
      return {
        success: false,
        syncedEntities,
        conflicts,
        errors: [...errors, error.message]
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync analytics data
   */
  private async syncAnalyticsData(): Promise<void> {
    try {
      // Export local analytics data
      const localData = await lyricsAnalyticsService.exportData();
      const checksum = this.calculateChecksum(localData);
      
      // Check if remote data exists
      const { data: remoteMeta } = await supabase
        .from('sync_metadata')
        .select('*')
        .eq('device_id', this.deviceId)
        .eq('entity_type', 'analytics_data')
        .single();

      if (remoteMeta) {
        // Compare checksums to detect changes
        if (remoteMeta.checksum !== checksum) {
          // Data has changed, need to sync
          await this.pushAnalyticsData(localData, checksum);
        }
      } else {
        // First time sync
        await this.pushAnalyticsData(localData, checksum);
      }

      // Pull analytics data from other devices
      await this.pullAnalyticsData();

    } catch (error) {
      console.error('[CrossDeviceSync] Analytics sync failed:', error);
      throw error;
    }
  }

  /**
   * Push analytics data to cloud
   */
  private async pushAnalyticsData(data: any, checksum: string): Promise<void> {
    // Store analytics data (you might want to create a dedicated table for this)
    const { error: insertError } = await supabase
      .from('user_preferences')
      .upsert({
        device_id: this.deviceId,
        key: 'analytics_data',
        value: data,
        updated_at: new Date().toISOString()
      });

    if (insertError) throw insertError;

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert({
        device_id: this.deviceId,
        entity_id: 'analytics_data',
        entity_type: 'analytics_data',
        last_synced_at: new Date().toISOString(),
        checksum,
        version: Date.now(),
        synced_to_cloud: true,
        conflict_detected: false
      });
  }

  /**
   * Pull analytics data from other devices
   */
  private async pullAnalyticsData(): Promise<void> {
    // Get analytics data from all other devices
    const { data: otherDevicesData, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('key', 'analytics_data')
      .neq('device_id', this.deviceId);

    if (error) throw error;

    // Merge analytics data from other devices
    for (const deviceData of otherDevicesData || []) {
      try {
        // This is a simplified merge - you might want more sophisticated merging logic
        const remoteAnalytics = deviceData.value;
        
        // You could implement smart merging here
        // For now, we'll just log that we received data from another device
        console.log(`[CrossDeviceSync] Received analytics data from device: ${deviceData.device_id}`);
        
      } catch (error) {
        console.warn('[CrossDeviceSync] Failed to merge analytics from device:', deviceData.device_id, error);
      }
    }
  }

  /**
   * Sync cache data
   */
  private async syncCacheData(): Promise<void> {
    try {
      // Get cache stats and determine what to sync
      const cacheStats = lyricsCacheService.getStats();
      const cacheData = {
        stats: cacheStats,
        timestamp: Date.now()
      };
      
      const checksum = this.calculateChecksum(cacheData);

      // Push cache metadata (not the full cache content for performance)
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          device_id: this.deviceId,
          key: 'cache_stats',
          value: cacheData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update sync metadata
      await supabase
        .from('sync_metadata')
        .upsert({
          device_id: this.deviceId,
          entity_id: 'cache_data',
          entity_type: 'lyrics_cache',
          last_synced_at: new Date().toISOString(),
          checksum,
          version: Date.now(),
          synced_to_cloud: true,
          conflict_detected: false
        });

    } catch (error) {
      console.error('[CrossDeviceSync] Cache sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync user preferences
   */
  private async syncUserPreferences(): Promise<void> {
    try {
      // Get local preferences (implement based on your preference storage)
      const localPrefs = await this.getLocalPreferences();
      const checksum = this.calculateChecksum(localPrefs);

      // Push preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          device_id: this.deviceId,
          key: 'app_preferences',
          value: localPrefs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Pull preferences from other devices and merge
      await this.pullAndMergePreferences();

    } catch (error) {
      console.error('[CrossDeviceSync] Preferences sync failed:', error);
      throw error;
    }
  }

  /**
   * Get local preferences
   */
  private async getLocalPreferences(): Promise<any> {
    // Implement based on your app's preference storage
    // This is a placeholder
    return {
      notifications: {
        enabled: true,
        soundEnabled: true,
        showSystemNotifications: true
      },
      sync: {
        enabled: true,
        autoSync: true,
        syncInterval: this.SYNC_INTERVAL_MS
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Pull and merge preferences from other devices
   */
  private async pullAndMergePreferences(): Promise<void> {
    const { data: otherPrefs, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('key', 'app_preferences')
      .neq('device_id', this.deviceId)
      .order('updated_at', { ascending: false })
      .limit(1); // Get most recent from other devices

    if (error) throw error;

    if (otherPrefs && otherPrefs.length > 0) {
      const remotePrefs = otherPrefs[0].value;
      const localPrefs = await this.getLocalPreferences();
      
      // Simple merge strategy - you can implement more sophisticated merging
      const mergedPrefs = {
        ...localPrefs,
        ...remotePrefs,
        lastSynced: new Date().toISOString()
      };

      // Apply merged preferences locally
      await this.applyLocalPreferences(mergedPrefs);
    }
  }

  /**
   * Apply preferences locally
   */
  private async applyLocalPreferences(preferences: any): Promise<void> {
    // Implement based on your app's preference storage
    console.log('[CrossDeviceSync] Applied synced preferences:', preferences);
  }

  /**
   * Register device
   */
  private async registerDevice(): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        device_id: this.deviceId,
        key: 'device_info',
        value: this.deviceInfo,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Update device activity
   */
  private async updateDeviceActivity(): Promise<void> {
    this.deviceInfo.last_seen = new Date().toISOString();
    this.deviceInfo.is_active = true;

    const { error } = await supabase
      .from('user_preferences')
      .update({
        value: this.deviceInfo,
        updated_at: new Date().toISOString()
      })
      .eq('device_id', this.deviceId)
      .eq('key', 'device_info');

    if (error) throw error;
  }

  /**
   * Get connected devices
   */
  async getConnectedDevices(): Promise<DeviceInfo[]> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('key', 'device_info')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => item.value as DeviceInfo);
    } catch (error) {
      console.error('[CrossDeviceSync] Failed to get connected devices:', error);
      return [];
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isEnabled: boolean;
    isSyncing: boolean;
    lastSync: string | null;
    deviceId: string;
    conflicts: number;
  } {
    return {
      isEnabled: this.syncInterval !== null,
      isSyncing: this.isSyncing,
      lastSync: null, // You can track this
      deviceId: this.deviceId,
      conflicts: 0 // You can implement conflict tracking
    };
  }

  /**
   * Get pending conflicts
   */
  async getPendingConflicts(): Promise<SyncConflict[]> {
    // Implement conflict detection logic
    // This is a placeholder
    return [];
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId: string, resolution: string, mergedData?: any): Promise<boolean> {
    // Implement conflict resolution logic
    console.log(`[CrossDeviceSync] Resolving conflict ${conflictId} with resolution: ${resolution}`);
    return true;
  }

  /**
   * Set sync enabled/disabled
   */
  setSyncEnabled(enabled: boolean): boolean {
    if (enabled) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }
    return true;
  }

  /**
   * Get sync settings
   */
  getSyncSettings(): any {
    return {
      enabled: this.syncInterval !== null,
      interval: this.SYNC_INTERVAL_MS,
      autoSync: true
    };
  }

  /**
   * Update sync settings
   */
  updateSyncSettings(settings: any): boolean {
    // Implement settings update logic
    console.log('[CrossDeviceSync] Updated settings:', settings);
    return true;
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.performFullSync();
      } catch (error) {
        console.error('[CrossDeviceSync] Periodic sync failed:', error);
      }
    }, this.SYNC_INTERVAL_MS);

    console.log(`[CrossDeviceSync] Periodic sync started (${this.SYNC_INTERVAL_MS}ms interval)`);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('[CrossDeviceSync] Periodic sync stopped');
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const userInfo = os.userInfo();
    
    const deviceString = `${hostname}-${platform}-${arch}-${userInfo.username}`;
    return crypto.createHash('sha256').update(deviceString).digest('hex').substring(0, 16);
  }

  /**
   * Create device info
   */
  private createDeviceInfo(): DeviceInfo {
    return {
      device_id: this.deviceId,
      device_name: os.hostname(),
      platform: `${os.platform()} ${os.arch()}`,
      app_version: process.env.npm_package_version || '1.0.0',
      last_seen: new Date().toISOString(),
      is_active: true
    };
  }

  /**
   * Calculate checksum for data
   */
  private calculateChecksum(data: any): string {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('md5').update(jsonString).digest('hex');
  }

  /**
   * Cleanup on shutdown
   */
  async cleanup(): Promise<void> {
    this.stopPeriodicSync();
    
    // Mark device as inactive
    if (this.deviceInfo) {
      this.deviceInfo.is_active = false;
      await this.updateDeviceActivity();
    }
    
    console.log('[CrossDeviceSync] Service cleaned up');
  }
}

// Global sync service instance
export const crossDeviceSyncService = new CrossDeviceSyncService();
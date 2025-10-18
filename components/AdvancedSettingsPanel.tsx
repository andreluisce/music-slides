import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Settings, 
  Sync, 
  Bell, 
  Palette, 
  Database,
  Volume2,
  Monitor,
  RefreshCw,
  Check,
  AlertCircle,
  Smartphone
} from 'lucide-react';

interface SyncSettings {
  enabled: boolean;
  autoSync: boolean;
  interval: number;
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showOnLockScreen: boolean;
  customTheme: string;
  position: string;
  duration: number;
  maxVisible: number;
  categories: {
    lyrics: boolean;
    progress: boolean;
    sync: boolean;
    errors: boolean;
  };
}

interface DeviceInfo {
  device_id: string;
  device_name: string;
  platform: string;
  last_seen: string;
  is_active: boolean;
}

export function AdvancedSettingsPanel() {
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    enabled: true,
    autoSync: true,
    interval: 300000 // 5 minutes
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    showOnLockScreen: true,
    customTheme: 'default',
    position: 'top-right',
    duration: 5000,
    maxVisible: 3,
    categories: {
      lyrics: true,
      progress: true,
      sync: true,
      errors: true
    }
  });

  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load sync settings
      if (window.lyricsIntegration?.advanced?.sync) {
        const syncData = await window.lyricsIntegration.advanced.sync.getSettings();
        if (syncData) setSyncSettings(syncData);

        const status = await window.lyricsIntegration.advanced.sync.getStatus();
        if (status) setSyncStatus(status);

        const devices = await window.lyricsIntegration.advanced.sync.getDevices();
        if (devices) setConnectedDevices(devices);
      }

      // Load notification settings
      if (window.lyricsIntegration?.advanced?.notifications) {
        const notifData = await window.lyricsIntegration.advanced.notifications.getSettings();
        if (notifData) setNotificationSettings(notifData);

        const themes = await window.lyricsIntegration.advanced.notifications.getThemes();
        if (themes) setAvailableThemes(themes);
      }

    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSettingsUpdate = async (newSettings: Partial<SyncSettings>) => {
    try {
      const updated = { ...syncSettings, ...newSettings };
      setSyncSettings(updated);
      
      if (window.lyricsIntegration?.advanced?.sync) {
        await window.lyricsIntegration.advanced.sync.updateSettings(updated);
        await window.lyricsIntegration.advanced.sync.setEnabled(updated.enabled);
      }
    } catch (error) {
      console.error('Failed to update sync settings:', error);
    }
  };

  const handleNotificationSettingsUpdate = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = { ...notificationSettings, ...newSettings };
      setNotificationSettings(updated);
      
      if (window.lyricsIntegration?.advanced?.notifications) {
        await window.lyricsIntegration.advanced.notifications.updateSettings(updated);
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsLoading(true);
      if (window.lyricsIntegration?.advanced?.sync) {
        const result = await window.lyricsIntegration.advanced.sync.triggerManualSync();
        console.log('Manual sync result:', result);
        
        // Refresh status
        const status = await window.lyricsIntegration.advanced.sync.getStatus();
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async (type: string) => {
    try {
      if (window.lyricsIntegration?.advanced?.notifications) {
        await window.lyricsIntegration.advanced.notifications.test(type);
      }
    } catch (error) {
      console.error('Failed to test notification:', error);
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 5) return 'Active now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Settings</h1>
          <p className="text-muted-foreground">
            Configure sync, notifications, and advanced features
          </p>
        </div>
        <Button onClick={loadSettings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sync">
            <Sync className="h-4 w-4 mr-2" />
            Sync
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="themes">
            <Palette className="h-4 w-4 mr-2" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Smartphone className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
        </TabsList>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Device Synchronization</CardTitle>
              <CardDescription>
                Sync your lyrics cache, analytics, and preferences across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-enabled">Enable Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data across all your devices
                  </p>
                </div>
                <Switch
                  id="sync-enabled"
                  checked={syncSettings.enabled}
                  onCheckedChange={(checked) => 
                    handleSyncSettingsUpdate({ enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync">Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync automatically at regular intervals
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={syncSettings.autoSync}
                  onCheckedChange={(checked) => 
                    handleSyncSettingsUpdate({ autoSync: checked })
                  }
                  disabled={!syncSettings.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval</Label>
                <Select
                  value={syncSettings.interval.toString()}
                  onValueChange={(value) => 
                    handleSyncSettingsUpdate({ interval: parseInt(value) })
                  }
                  disabled={!syncSettings.enabled || !syncSettings.autoSync}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60000">Every minute</SelectItem>
                    <SelectItem value="300000">Every 5 minutes</SelectItem>
                    <SelectItem value="600000">Every 10 minutes</SelectItem>
                    <SelectItem value="1800000">Every 30 minutes</SelectItem>
                    <SelectItem value="3600000">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleManualSync}
                  disabled={!syncSettings.enabled || isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sync className="h-4 w-4 mr-2" />
                  )}
                  Manual Sync
                </Button>
              </div>

              {/* Sync Status */}
              {syncStatus && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Sync Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={syncStatus.isEnabled ? "default" : "secondary"} className="ml-2">
                        {syncStatus.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Device ID:</span>
                      <span className="ml-2 font-mono text-xs">{syncStatus.deviceId?.substring(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span className="ml-2">{syncStatus.lastSync || 'Never'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conflicts:</span>
                      <span className="ml-2">{syncStatus.conflicts || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Customize how notifications are displayed and behave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-enabled">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show system notifications for important events
                  </p>
                </div>
                <Switch
                  id="notif-enabled"
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) => 
                    handleNotificationSettingsUpdate({ enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sound-enabled">Sound Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds with notifications
                  </p>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={notificationSettings.soundEnabled}
                  onCheckedChange={(checked) => 
                    handleNotificationSettingsUpdate({ soundEnabled: checked })
                  }
                  disabled={!notificationSettings.enabled}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={notificationSettings.position}
                    onValueChange={(value) => 
                      handleNotificationSettingsUpdate({ position: value })
                    }
                    disabled={!notificationSettings.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={notificationSettings.duration / 1000}
                    onChange={(e) => 
                      handleNotificationSettingsUpdate({ 
                        duration: parseInt(e.target.value) * 1000 
                      })
                    }
                    disabled={!notificationSettings.enabled}
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              {/* Notification Categories */}
              <div className="space-y-3">
                <Label>Notification Categories</Label>
                {Object.entries(notificationSettings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Label htmlFor={`category-${category}`} className="capitalize">
                      {category}
                    </Label>
                    <Switch
                      id={`category-${category}`}
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        handleNotificationSettingsUpdate({
                          categories: {
                            ...notificationSettings.categories,
                            [category]: checked
                          }
                        })
                      }
                      disabled={!notificationSettings.enabled}
                    />
                  </div>
                ))}
              </div>

              {/* Test Notifications */}
              <div className="pt-4 border-t">
                <Label className="mb-3 block">Test Notifications</Label>
                <div className="flex gap-2 flex-wrap">
                  {['success', 'warning', 'error', 'info'].map((type) => (
                    <Button
                      key={type}
                      onClick={() => handleTestNotification(type)}
                      variant="outline"
                      size="sm"
                      disabled={!notificationSettings.enabled}
                    >
                      Test {type}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Themes</CardTitle>
              <CardDescription>
                Customize the appearance of notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      notificationSettings.customTheme === theme.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleNotificationSettingsUpdate({ customTheme: theme.id })}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{theme.name}</h4>
                      {notificationSettings.customTheme === theme.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      {Object.entries(theme.colors).slice(0, 4).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: color }}
                          title={key}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>
                Devices that are syncing with your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedDevices.map((device) => (
                  <div key={device.device_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{device.device_name}</div>
                        <div className="text-sm text-muted-foreground">{device.platform}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={device.is_active ? "default" : "secondary"}>
                        {device.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatLastSeen(device.last_seen)}
                      </div>
                    </div>
                  </div>
                ))}
                {connectedDevices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No connected devices found</p>
                    <p className="text-sm">Enable sync to see connected devices</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Type definitions
declare global {
  interface Window {
    lyricsIntegration?: {
      advanced?: {
        sync?: {
          triggerManualSync: () => Promise<any>;
          getStatus: () => Promise<any>;
          getDevices: () => Promise<DeviceInfo[]>;
          getSettings: () => Promise<SyncSettings>;
          updateSettings: (settings: SyncSettings) => Promise<boolean>;
          setEnabled: (enabled: boolean) => Promise<boolean>;
        };
        notifications?: {
          getSettings: () => Promise<NotificationSettings>;
          updateSettings: (settings: NotificationSettings) => Promise<boolean>;
          getThemes: () => Promise<any[]>;
          test: (type: string) => Promise<string>;
        };
      };
    };
  }
}

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { useSettings, type AppSettings } from '../contexts/SettingsContext';
import { FloppyDisk } from '@phosphor-icons/react';

export default function SettingsPanel() {
  const { settings, updateSetting, selectDataPath, selectLyricsPath, selectImagesPath, selectVideosPath } = useSettings();

  // Local state for unsaved changes
  const [isSaving, setIsSaving] = useState(false);

  const handlePresentationSettingChange = async (key: keyof AppSettings, value: any) => {
    setIsSaving(true);
    try {
      await updateSetting(key, value);
      console.log(`✅ Setting '${key}' saved successfully`);
    } catch (error) {
      console.error(`❌ Error saving setting '${key}':`, error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            <span>Salvando...</span>
          </div>
        )}
      </div>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Geral</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="language" className="text-white">Idioma</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => updateSetting('language', value)}
              >
                <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                  <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="use-24h" className="text-white">Usar relógio de 24h</Label>
              <Switch
                id="use-24h"
                checked={settings.use24Hour}
                onCheckedChange={(checked) => updateSetting('use24Hour', checked)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data-path" className="text-white">Pasta de Dados</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm flex items-center gap-2">
                  <span className="text-white/60">📁</span>
                  <span className="truncate">{settings.dataPath}</span>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={selectDataPath}
                >
                  Alterar
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lyrics-path" className="text-white">Pasta de Letras (JSON)</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm flex items-center gap-2">
                  <span className="text-white/60">🎵</span>
                  <span className="truncate">{settings.lyricsPath}</span>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={selectLyricsPath}
                >
                  Alterar
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="images-path" className="text-white">Pasta de Imagens</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm flex items-center gap-2">
                  <span className="text-white/60">🖼️</span>
                  <span className="truncate">{settings.imagesPath}</span>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={selectImagesPath}
                >
                  Alterar
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="videos-path" className="text-white">Pasta de Vídeos</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm flex items-center gap-2">
                  <span className="text-white/60">🎬</span>
                  <span className="truncate">{settings.videosPath}</span>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={selectVideosPath}
                >
                  Alterar
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Apresentação</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-pagination" className="text-white">Mostrar Paginação</Label>
              <Switch
                id="show-pagination"
                checked={settings.showPagination}
                onCheckedChange={(checked) => handlePresentationSettingChange('showPagination', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-logo" className="text-white">Mostrar Logo</Label>
              <Switch
                id="show-logo"
                checked={settings.showLogo}
                onCheckedChange={(checked) => handlePresentationSettingChange('showLogo', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="logo-upload" className="text-white">Upload Logo</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="bg-white/10 border-white/20 text-white"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // TODO: Handle logo upload
                    console.log('Logo file selected:', file.name);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Animações</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="transition-type" className="text-white">Tipo de Transição (Slide)</Label>
              <Select
                value={settings.transitionType}
                onValueChange={(value: 'fade' | 'slide' | 'zoom') =>
                  handlePresentationSettingChange('transitionType', value)
                }
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Fade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="transition-speed" className="text-white">Velocidade da Transição</Label>
              <Slider
                id="transition-speed"
                value={[settings.transitionSpeed]}
                onValueChange={([value]) =>
                  handlePresentationSettingChange('transitionSpeed', value)
                }
                max={100}
                step={1}
                className="w-[180px]"
              />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Banco de Dados</h2>
          <div className="flex items-center justify-between">
            <p className="text-white">Supabase Status</p>
            <p className="text-green-400">Conectado</p>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <p className="text-xs text-slate-400">v2.0.0 Lyrics Show</p>
          <span className="text-sm text-green-400">Configurações salvas automaticamente</span>
        </div>
      </div>
    </div>
  );
}

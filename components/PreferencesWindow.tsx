import React from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useSettings } from '../contexts/SettingsContext';

export default function PreferencesWindow() {
  const { settings, updateSetting, selectDataPath, selectLyricsPath, selectImagesPath, selectVideosPath } = useSettings();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-auto">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Preferências</h1>

        <div className="space-y-6">
          {/* General Section */}
          <section className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-purple-300 mb-4">Geral</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="language" className="text-white text-sm">Idioma</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger className="w-[220px] bg-white/10 border-white/20 text-white text-sm">
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
                <Label htmlFor="use-24h" className="text-white text-sm">Usar relógio de 24h</Label>
                <Switch
                  id="use-24h"
                  checked={settings.use24Hour}
                  onCheckedChange={(checked) => updateSetting('use24Hour', checked)}
                />
              </div>
            </div>
          </section>

          {/* Directories Section */}
          <section className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-purple-300 mb-4">Diretórios</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label className="text-white text-sm">Pasta de Dados</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-xs flex items-center gap-2">
                    <span className="text-white/60">📁</span>
                    <span className="truncate">{settings.dataPath}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    onClick={selectDataPath}
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-white text-sm">Pasta de Letras (JSON)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-xs flex items-center gap-2">
                    <span className="text-white/60">🎵</span>
                    <span className="truncate">{settings.lyricsPath}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    onClick={selectLyricsPath}
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-white text-sm">Pasta de Imagens</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-xs flex items-center gap-2">
                    <span className="text-white/60">🖼️</span>
                    <span className="truncate">{settings.imagesPath}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    onClick={selectImagesPath}
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-white text-sm">Pasta de Vídeos</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-xs flex items-center gap-2">
                    <span className="text-white/60">🎬</span>
                    <span className="truncate">{settings.videosPath}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    onClick={selectVideosPath}
                  >
                    Alterar
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { useSettings } from '../contexts/SettingsContext';
import { FloppyDisk } from '@phosphor-icons/react';

export default function SettingsPanel() {
  const { settings, updateSetting, selectDataPath, selectLyricsPath, selectImagesPath, selectVideosPath } = useSettings();

  // Local state for unsaved changes
  const [showPagination, setShowPagination] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [transitionType, setTransitionType] = useState('fade');
  const [transitionSpeed, setTransitionSpeed] = useState([33]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would save the additional settings
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasUnsavedChanges(false);
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        {hasUnsavedChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <FloppyDisk size={16} weight='bold' className="mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
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
                checked={showPagination}
                onCheckedChange={(checked) => {
                  setShowPagination(checked);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-logo" className="text-white">Mostrar Logo</Label>
              <Switch
                id="show-logo"
                checked={showLogo}
                onCheckedChange={(checked) => {
                  setShowLogo(checked);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="logo-upload" className="text-white">Upload Logo</Label>
              <Input id="logo-upload" type="file" className="bg-white/10 border-white/20 text-white" />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Animações</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="transition-type" className="text-white">Tipo de Transição (Slide)</Label>
              <Select
                value={transitionType}
                onValueChange={(value) => {
                  setTransitionType(value);
                  setHasUnsavedChanges(true);
                }}
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
                value={transitionSpeed}
                onValueChange={(value) => {
                  setTransitionSpeed(value);
                  setHasUnsavedChanges(true);
                }}
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

      {/* Fixed footer with save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <p className="text-xs text-slate-400">v2.0.0 Lyrics Show</p>
          {hasUnsavedChanges ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-yellow-400">Você tem alterações não salvas</span>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <FloppyDisk size={16} weight='bold' className="mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          ) : (
            <span className="text-sm text-green-400">Todas as alterações foram salvas</span>
          )}
        </div>
      </div>
    </div>
  );
}

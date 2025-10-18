import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; // Import Tabs components
import { useSettings, type AppSettings } from '../contexts/SettingsContext';
import { FloppyDisk, Pencil, Trash } from '@phosphor-icons/react';
import ThemeEditorModal from './dialogs/ThemeEditorModal';

export default function SettingsPanel() {
  const { settings, updateSetting, selectDataPath, selectLyricsPath, selectImagesPath, selectVideosPath } = useSettings();
  const [themes, setThemes] = useState<any[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Theme Management Logic ---
  const fetchThemes = async () => {
    try {
      const fetchedThemes = await (window.api as any).themes.getAll();
      setThemes(fetchedThemes);
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleOpenEditor = (theme: any | null) => {
    setEditingTheme(theme);
    setIsEditorOpen(true);
  };

  const handleSaveTheme = async (themeData: any) => {
    try {
      if (themeData.id) {
        await (window.api as any).themes.update(themeData.id, { name: themeData.name, properties: themeData.properties });
      } else {
        await (window.api as any).themes.create({ name: themeData.name, properties: themeData.properties });
      }
      setIsEditorOpen(false);
      fetchThemes();
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este tema?')) {
      try {
        await (window.api as any).themes.delete(id);
        fetchThemes();
      } catch (error) {
        console.error("Error deleting theme:", error);
      }
    }
  };

  const handlePresentationSettingChange = async (key: keyof AppSettings, value: any) => {
    setIsSaving(true);
    try {
      await updateSetting(key, value);
    } catch (error) {
      console.error(`Error saving setting '${key}':`, error);
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="presentation">Apresentação</TabsTrigger>
          <TabsTrigger value="themes">Temas</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <Label htmlFor="language">Idioma</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="use-24h">Usar relógio de 24h</Label>
              <Switch id="use-24h" checked={settings.use24Hour} onCheckedChange={(checked) => updateSetting('use24Hour', checked)} />
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
           <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <p className="text-xs text-slate-400 mt-1">Alternar entre tema claro e escuro</p>
              </div>
              <Switch id="dark-mode" checked={settings.darkMode} onCheckedChange={(checked) => updateSetting('darkMode', checked)} />
            </div>
          </div>
        </TabsContent>

        {/* Presentation Tab */}
        <TabsContent value="presentation">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tipo de Transição (Slide)</Label>
              <Select value={settings.transitionType} onValueChange={(value: 'fade' | 'slide' | 'zoom') => handlePresentationSettingChange('transitionType', value)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Fade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Velocidade da Transição</Label>
              <Slider value={[settings.transitionSpeed]} onValueChange={([value]) => handlePresentationSettingChange('transitionSpeed', value)} max={100} step={1} className="w-[180px]" />
            </div>
             <div className="flex items-center justify-between">
              <Label>Mostrar Paginação</Label>
              <Switch checked={settings.showPagination} onCheckedChange={(checked) => handlePresentationSettingChange('showPagination', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar Logo</Label>
              <Switch checked={settings.showLogo} onCheckedChange={(checked) => handlePresentationSettingChange('showLogo', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Upload Logo</Label>
              <Input id="logo-upload" type="file" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { console.log('Logo file selected:', e.target.files[0].name); } }} />
            </div>
          </div>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes">
          <div className="space-y-4">
            <Button onClick={() => handleOpenEditor(null)}>Criar Novo Tema</Button>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {themes.map(theme => (
                <div key={theme.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white">{theme.name}</span>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditor(theme)} className="text-slate-400 hover:text-white"><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => handleDeleteTheme(theme.id)}><Trash size={16} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Pasta de Dados</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 rounded-md text-sm truncate">{settings.dataPath}</div>
                <Button variant="outline" onClick={selectDataPath}>Alterar</Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Pasta de Letras (JSON)</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 rounded-md text-sm truncate">{settings.lyricsPath}</div>
                <Button variant="outline" onClick={selectLyricsPath}>Alterar</Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Pasta de Imagens</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 rounded-md text-sm truncate">{settings.imagesPath}</div>
                <Button variant="outline" onClick={selectImagesPath}>Alterar</Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Pasta de Vídeos</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white/10 rounded-md text-sm truncate">{settings.videosPath}</div>
                <Button variant="outline" onClick={selectVideosPath}>Alterar</Button>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {/* Fixed footer and Modal remain outside Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <p className="text-xs text-slate-400">v2.0.0 Lyrics Show</p>
          <span className="text-sm text-green-400">Configurações salvas automaticamente</span>
        </div>
      </div>
      <ThemeEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveTheme} theme={editingTheme} />
    </div>
  );
}
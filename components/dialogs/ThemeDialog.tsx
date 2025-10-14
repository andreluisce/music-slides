import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion } from 'framer-motion';
import { TextT, Palette, GridFour } from '@phosphor-icons/react';

interface ThemeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (theme: {
    titleFont: string;
    bodyFont: string;
    colors: {
      primary: string;
      secondary: string;
      text: string;
      background: string;
    };
  }) => void;
}

const PRESET_THEMES = [
  {
    name: 'Classic Dark',
    titleFont: 'Montserrat',
    bodyFont: 'Montserrat',
    fontFamily: 'Montserrat',
    fontSize: 80,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    textAlign: 'center',
    fontWeight: 700,
    transitionType: 'fade',
    animation: 'fade',
    colors: {
      primary: '#FF0066',
      secondary: '#9333EA',
      text: '#FFFFFF',
      background: '#000000'
    }
  },
  {
    name: 'Modern Light',
    titleFont: 'Inter',
    bodyFont: 'Inter',
    fontFamily: 'Inter',
    fontSize: 64,
    textColor: '#1F2937',
    backgroundColor: '#F3F4F6',
    textShadow: '2px 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    fontWeight: 600,
    transitionType: 'slide',
    animation: 'slide',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      text: '#1F2937',
      background: '#F3F4F6'
    }
  },
  {
    name: 'Vintage',
    titleFont: 'Playfair Display',
    bodyFont: 'Playfair Display',
    fontFamily: 'Playfair Display',
    fontSize: 72,
    textColor: '#292524',
    backgroundColor: '#FAFAF9',
    textShadow: '2px 2px 8px rgba(0,0,0,0.2)',
    textAlign: 'center',
    fontWeight: 700,
    transitionType: 'fade',
    animation: 'fade',
    colors: {
      primary: '#B45309',
      secondary: '#065F46',
      text: '#292524',
      background: '#FAFAF9'
    }
  },
  {
    name: 'Minimalist',
    titleFont: 'DM Sans',
    bodyFont: 'DM Sans',
    fontFamily: 'DM Sans',
    fontSize: 67,
    textColor: '#111827',
    backgroundColor: '#FFFFFF',
    textShadow: 'none',
    textAlign: 'center',
    fontWeight: 500,
    transitionType: 'zoom',
    animation: 'zoom',
    colors: {
      primary: '#111827',
      secondary: '#374151',
      text: '#111827',
      background: '#FFFFFF'
    }
  }
];

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Montserrat',
  'Roboto',
  'Inter',
  'Poppins',
  'DM Sans',
  'Work Sans',
  'Playfair Display',
  'Lora'
];

export default function ThemeDialog({ isOpen, onClose, onSelect }: ThemeDialogProps) {
  const [activeTab, setActiveTab] = useState('presets');
  const [customTheme, setCustomTheme] = useState({
    titleFont: 'Montserrat',
    bodyFont: 'Roboto',
    colors: {
      primary: '#FF0066',
      secondary: '#9333EA',
      text: '#FFFFFF',
      background: '#000000'
    }
  });

  useEffect(() => {
    if (isOpen && activeTab === 'ai') {
      suggestTheme();
    }
  }, [isOpen, activeTab]);

  const suggestTheme = async () => {
    try {
      const suggested = await window.api?.suggestFontPairing('worship', 'modern');
      if (suggested) {
        setCustomTheme(prev => ({
          ...prev,
          titleFont: suggested.titleFont,
          bodyFont: suggested.bodyFont
        }));
      }
    } catch (error) {
      console.error('Error suggesting theme:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[800px] bg-dark-elevated border-slate-800">
        <DialogHeader>
          <DialogTitle>Selecionar Tema</DialogTitle>
          <DialogDescription>
            Escolha um tema predefinido ou personalize as cores e fontes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <GridFour size={16} />
              Predefinidos
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Palette size={16} />
              Personalizado
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <TextT size={16} />
              IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-0">
            <div className="grid grid-cols-2 gap-4">
              {PRESET_THEMES.map((theme) => (
                <motion.button
                  key={theme.name}
                  className="p-4 rounded-lg border border-slate-700 hover:border-magenta transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
onClick={() => window.api?.sendPresentationThemeUpdate({
                    fontFamily: theme.fontFamily,
                    fontSize: theme.fontSize,
                    textColor: theme.colors.text,
                    backgroundColor: theme.colors.background,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    fontWeight: theme.fontWeight || 700,
                    transitionType: theme.transitionType || 'fade'
                  })}
                >
                  <div className="mb-2 font-semibold" style={{ fontFamily: theme.titleFont }}>
                    {theme.name}
                  </div>
                  <div className="flex gap-2">
                    {Object.values(theme.colors).map((color) => (
                      <div
                        key={color}
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-0">
            <div className="space-y-4">
              <div>
                <Label>Fonte do Título</Label>
                <select
                  className="w-full p-2 rounded-md bg-black/20 border border-slate-700"
                  value={customTheme.titleFont}
                  onChange={(e) =>
                    setCustomTheme((prev) => ({ ...prev, titleFont: e.target.value }))
                  }
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Fonte do Texto</Label>
                <select
                  className="w-full p-2 rounded-md bg-black/20 border border-slate-700"
                  value={customTheme.bodyFont}
                  onChange={(e) =>
                    setCustomTheme((prev) => ({ ...prev, bodyFont: e.target.value }))
                  }
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cor Primária</Label>
                  <Input
                    type="color"
                    value={customTheme.colors.primary}
                    onChange={(e) =>
                      setCustomTheme((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, primary: e.target.value }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Cor Secundária</Label>
                  <Input
                    type="color"
                    value={customTheme.colors.secondary}
                    onChange={(e) =>
                      setCustomTheme((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, secondary: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => onSelect(customTheme)}
              >
                Aplicar Tema Personalizado
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/20 border border-slate-700">
                <p className="text-sm text-slate-400">
                  Nosso sistema de IA irá sugerir uma combinação de fontes e cores baseada no contexto
                  e mood da apresentação.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: customTheme.colors.background }}
                >
                  <h3
                    className="text-xl mb-2"
                    style={{
                      fontFamily: customTheme.titleFont,
                      color: customTheme.colors.primary
                    }}
                  >
                    Título Exemplo
                  </h3>
                  <p
                    className="text-base"
                    style={{
                      fontFamily: customTheme.bodyFont,
                      color: customTheme.colors.text
                    }}
                  >
                    Texto de exemplo para visualizar o tema.
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => onSelect(customTheme)}
              >
                Aplicar Tema Sugerido
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
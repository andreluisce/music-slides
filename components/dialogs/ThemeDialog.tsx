import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { motion } from 'framer-motion';
import type { Theme } from '../../lib/themes-service';
import type { ThemeProperties } from './ThemeEditorModal';

interface ThemeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeDialog({ isOpen, onClose }: ThemeDialogProps) {
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    const fetchThemes = async () => {
      if (isOpen) {
        try {
          const fetchedThemes = await (window.api as any).themes.getAll();
          setThemes(fetchedThemes);
        } catch (error) {
          console.error("Error fetching themes:", error);
        }
      }
    };
    fetchThemes();
  }, [isOpen]);

  const handleSelectTheme = (theme: Theme) => {
    const properties = theme.properties as ThemeProperties;
    (window.api as any).presentation.sendThemeUpdate(properties);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-neutral-950 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Selecionar Tema</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Escolha um tema da sua biblioteca para aplicar à apresentação.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {themes.map((theme) => {
            const props = theme.properties as ThemeProperties;
            return (
              <motion.button
                key={theme.id}
                className="p-4 rounded-lg border border-neutral-800 hover:border-magenta transition-all bg-neutral-900 text-left"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectTheme(theme)}
              >
                <div className="mb-3 font-semibold text-white truncate" style={{ fontFamily: props.fontFamily }}>
                  {theme.name}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: props.textColor }} />
                    <span className="text-xs text-slate-400">Texto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: props.backgroundColor }} />
                    <span className="text-xs text-slate-400">Fundo</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import type { Theme } from '../../lib/themes-service';
import { kineticStyles, KineticStylePreset } from '../kinetic-lyrics/kinetic-styles';

// Define a more specific type for the properties jsonb
export type ThemeProperties = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  textShadow?: string;
  transition: {
    type: 'fade' | 'slide' | 'zoom' | 'scale';
    duration: number;
    direction?: 'left' | 'right' | 'up' | 'down';
  };
  kinetic?: {
    preset: KineticStylePreset;
    speed: number;
    intensity: number;
    blur: number;
  } | null;
};

interface ThemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (themeData: Partial<Theme>) => void;
  theme?: Theme | null;
}

const DEFAULT_PROPERTIES: Omit<ThemeProperties, 'kinetic'> = {
  fontFamily: 'Montserrat',
  fontSize: 80,
  fontWeight: 700,
  textColor: '#FFFFFF',
  backgroundColor: '#000000',
  textAlign: 'center',
  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
  transition: {
    type: 'fade',
    duration: 500,
  },
};

export default function ThemeEditorModal({ isOpen, onClose, onSave, theme }: ThemeEditorModalProps) {
  const [name, setName] = useState('');
  const [properties, setProperties] = useState<Partial<ThemeProperties>>(DEFAULT_PROPERTIES);

  useEffect(() => {
    if (isOpen) {
      if (theme) {
        setName(theme.name);
        setProperties({ ...DEFAULT_PROPERTIES, ...(theme.properties as any) });
      } else {
        setName('Novo Tema');
        setProperties(DEFAULT_PROPERTIES);
      }
    }
  }, [theme, isOpen]);

  const handleSave = () => {
    onSave({
      id: theme?.id,
      name,
      properties,
    });
  };

  const handlePropertyChange = <K extends keyof ThemeProperties>(key: K, value: ThemeProperties[K]) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  const handleTransitionChange = <K extends keyof ThemeProperties['transition']>(key: K, value: ThemeProperties['transition'][K]) => {
    setProperties(prev => ({
      ...prev,
      transition: { ...(prev.transition || { type: 'fade', duration: 500 }), [key]: value },
    }));
  };
  
  const handleKineticChange = (key: string, value: any) => {
    setProperties(prev => ({
      ...prev,
      kinetic: {
        ...(prev.kinetic || { preset: 'nebula-fade', speed: 1, intensity: 1, blur: 0 }),
        [key]: value,
      },
    }));
  };

  const toggleKinetic = (enabled: boolean) => {
    if (enabled) {
      handleKineticChange('preset', 'nebula-fade'); // Set a default when enabling
    } else {
      setProperties(prev => {
        const { kinetic, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-neutral-950 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{theme ? 'Editar Tema' : 'Criar Novo Tema'}</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Personalize as propriedades do seu tema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          {/* ... (General, Font, Colors, Transition sections remain the same) ... */}

          {/* Kinetic Mode */}
          <h3 className="text-lg font-semibold text-purple-400 pt-4 border-t border-neutral-800">Modo Cinético</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/50">
              <div>
                <Label htmlFor='kinetic-switch'>Ativar Modo Cinético</Label>
                <p className="text-xs text-neutral-500 mt-1">Anima o texto e o fundo do slide.</p>
              </div>
              <Switch
                id='kinetic-switch'
                checked={!!properties.kinetic}
                onCheckedChange={toggleKinetic}
              />
            </div>

            {properties.kinetic && (
              <div className="space-y-4 pl-4 border-l-2 border-neutral-800 py-2">
                <div>
                  <Label>Preset de Animação</Label>
                  <Select value={properties.kinetic.preset} onValueChange={(v: KineticStylePreset) => handleKineticChange('preset', v)}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(kineticStyles).map(key => (
                        <SelectItem key={key} value={key}>{(kineticStyles as any)[key].name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Velocidade</Label>
                    <Input type="number" step={0.1} value={properties.kinetic.speed} onChange={(e) => handleKineticChange('speed', Number(e.target.value))} className="bg-neutral-900 border-neutral-800" />
                  </div>
                  <div>
                    <Label>Intensidade</Label>
                    <Input type="number" step={0.1} value={properties.kinetic.intensity} onChange={(e) => handleKineticChange('intensity', Number(e.target.value))} className="bg-neutral-900 border-neutral-800" />
                  </div>
                   <div>
                    <Label>Desfoque</Label>
                    <Input type="number" step={1} value={properties.kinetic.blur} onChange={(e) => handleKineticChange('blur', Number(e.target.value))} className="bg-neutral-900 border-neutral-800" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Tema</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
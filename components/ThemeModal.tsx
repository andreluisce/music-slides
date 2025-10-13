import React, { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createTheme, updateTheme } from '../lib/supabase-service';
import type { Theme } from '../lib/supabase';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  theme?: Theme | null;
}

const fontFamilies = [
  'Open Sans',
  'Lato',
  'Roboto',
  'Plus Jakarta Sans',
  'DM Sans',
  'Epilogue',
  'Montserrat',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Bebas Neue',
];

const fontWeights = [
  { label: 'Thin', value: 100 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semi Bold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Black', value: 900 },
];

const animationTypes = ['fade', 'slide', 'zoom', 'none'];

export default function ThemeModal({ isOpen, onClose, onSave, theme }: ThemeModalProps) {
  const [name, setName] = useState('');
  const [titleFontFamily, setTitleFontFamily] = useState('Open Sans');
  const [bodyFontFamily, setBodyFontFamily] = useState('Open Sans');
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState(600);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textShadow, setTextShadow] = useState('2px 2px 4px rgba(0,0,0,0.5)');
  const [textOutline, setTextOutline] = useState('none');
  const [backgroundPosition, setBackgroundPosition] = useState('center');
  const [animationType, setAnimationType] = useState('fade');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Worship');
  const [selectedMood, setSelectedMood] = useState('Joyful');

  useEffect(() => {
    if (theme) {
      setName(theme.name);
      setTitleFontFamily(theme.title_font_family);
      setBodyFontFamily(theme.body_font_family);
      setFontSize(theme.font_size);
      setFontWeight(theme.font_weight);
      setTextColor(theme.text_color);
      setTextShadow(theme.text_shadow);
      setTextOutline(theme.text_outline);
      setBackgroundPosition(theme.background_position);
      setAnimationType(theme.animation_type);
    } else {
      setName('');
      setTitleFontFamily('Open Sans');
      setBodyFontFamily('Open Sans');
      setFontSize(48);
      setFontWeight(600);
      setTextColor('#FFFFFF');
      setTextShadow('2px 2px 4px rgba(0,0,0,0.5)');
      setTextOutline('none');
      setBackgroundPosition('center');
      setAnimationType('fade');
    }
  }, [theme]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const themeData = {
        name: name.trim(),
        title_font_family: titleFontFamily,
        body_font_family: bodyFontFamily,
        font_size: fontSize,
        font_weight: fontWeight,
        text_color: textColor,
        text_shadow: textShadow,
        text_outline: textOutline,
        background_position: backgroundPosition,
        animation_type: animationType,
        is_default: false,
      };

      if (theme) {
        await updateTheme(theme.id, themeData);
      } else {
        await createTheme(themeData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const previewTitleStyle: React.CSSProperties = {
    fontFamily: titleFontFamily,
    fontSize: `${fontSize * 1.2}px`,
    fontWeight,
    color: textColor,
    textShadow,
    WebkitTextStroke: textOutline !== 'none' ? textOutline : undefined,
  };

  const previewBodyStyle: React.CSSProperties = {
    fontFamily: bodyFontFamily,
    fontSize: `${fontSize}px`,
    fontWeight,
    color: textColor,
    textShadow,
    WebkitTextStroke: textOutline !== 'none' ? textOutline : undefined,
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-purple-900 shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 p-6'>
          <h2 className='text-2xl font-bold text-white'>{theme ? 'Editar Tema' : 'Novo Tema'}</h2>
          <button
            onClick={onClose}
            className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white'>
            <X size={20} weight='bold' />
          </button>
        </div>

        {/* Content */}
        <div className='grid grid-cols-2 gap-6 p-6'>
          {/* Left: Controls */}
          <div className='max-h-[calc(90vh-200px)] space-y-4 overflow-y-auto'>
            {/* Theme Name */}
            <div>
              <Label htmlFor='name' className='text-slate-300'>
                Nome do Tema
              </Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            {/* AI Font Pairing Suggestion */}
            <div>
              <Label className='text-slate-300'>Sugestão de Fontes AI</Label>
              <div className="flex gap-2 mt-1">
                <select id="genre" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className='w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'>
                  <option>Worship</option>
                  <option>Gospel</option>
                  <option>Hymn</option>
                  <option>Pop</option>
                  <option>Rock</option>
                </select>
                <select id="mood" value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className='w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'>
                  <option>Joyful</option>
                  <option>Reflective</option>
                  <option>Powerful</option>
                  <option>Calm</option>
                  <option>Celebratory</option>
                </select>
              </div>
              <Button
                size="sm"
                className='w-full mt-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700'
                onClick={async () => {
                  const pairing = await window.api.suggestFontPairing(selectedGenre, selectedMood);
                  if (pairing) {
                    setTitleFontFamily(pairing.titleFont);
                    setBodyFontFamily(pairing.bodyFont);
                  }
                }}>
                Sugerir Fontes
              </Button>
            </div>

            {/* Font Family */}
            <div>
              <Label htmlFor='titleFontFamily' className='text-slate-300'>
                Fonte do Título
              </Label>
              <select
                id='titleFontFamily'
                value={titleFontFamily}
                onChange={(e) => setTitleFontFamily(e.target.value)}
                className='mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'>
                {fontFamilies.map((font) => (
                  <option key={font} value={font} className='bg-slate-800 text-white'>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor='bodyFontFamily' className='text-slate-300'>
                Fonte do Corpo
              </Label>
              <select
                id='bodyFontFamily'
                value={bodyFontFamily}
                onChange={(e) => setBodyFontFamily(e.target.value)}
                className='mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'>
                {fontFamilies.map((font) => (
                  <option key={font} value={font} className='bg-slate-800 text-white'>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <Label htmlFor='fontSize' className='text-slate-300'>
                Tamanho da Fonte: {fontSize}px
              </Label>
              <input
                type='range'
                id='fontSize'
                min='24'
                max='120'
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className='mt-1 w-full'
              />
            </div>

            {/* Font Weight */}
            <div>
              <Label htmlFor='fontWeight' className='text-slate-300'>
                Peso da Fonte
              </Label>
              <select
                id='fontWeight'
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
                className='mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'>
                {fontWeights.map((weight) => (
                  <option key={weight.value} value={weight.value} className='bg-slate-800 text-white'>
                    {weight.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Color */}
            <div>
              <Label htmlFor='textColor' className='text-slate-300'>
                Cor do Texto
              </Label>
              <div className='mt-1 flex gap-2'>
                <input
                  type='color'
                  id='textColor'
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className='h-10 w-20 cursor-pointer rounded border border-white/20'
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className='flex-1 border-white/20 bg-white/10 text-white'
                />
              </div>
            </div>

            {/* Text Shadow */}
            <div>
              <Label htmlFor='textShadow' className='text-slate-300'>
                Sombra do Texto
              </Label>
              <Input
                id='textShadow'
                value={textShadow}
                onChange={(e) => setTextShadow(e.target.value)}
                placeholder='Ex: 2px 2px 4px rgba(0,0,0,0.5)'
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            {/* Animation Type */}
            <div>
              <Label htmlFor='animationType' className='text-slate-300'>
                Animação
              </Label>
              <select
                id='animationType'
                value={animationType}
                onChange={(e) => setAnimationType(e.target.value)}
                className='mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'>
                {animationTypes.map((anim) => (
                  <option key={anim} value={anim} className='bg-slate-800 text-white'>
                    {anim}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Preview */}
          <div className='flex flex-col'>
            <Label className='mb-2 text-slate-300'>Preview</Label>
            <div className='flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-black p-8'>
              <div className='text-center'>
                <p style={previewTitleStyle}>Amazing Grace</p>
                <p style={previewBodyStyle} className='mt-4 opacity-70'>How sweet the sound</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 border-t border-white/10 p-6'>
          <Button
            onClick={onClose}
            variant='outline'
            className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

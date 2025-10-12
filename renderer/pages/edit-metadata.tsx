import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Clock,
  Palette,
  Zap,
  Plus,
  Minus,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/button';

const api = typeof window !== 'undefined' ? window.api : undefined;

// Animation type options
const ANIMATION_TYPES = [
  'fade', 'slide', 'zoom', 'bounce', 'typewriter', 'pulse'
];

const ANIMATION_DIRECTIONS = [
  'up', 'down', 'left', 'right', 'in', 'out'
];

const FONT_SIZES = [
  'small', 'medium', 'large', 'extra-large'
];

const EMOTIONS = [
  'joyful', 'reflective', 'powerful', 'peaceful', 'triumphant', 'intimate'
];

const THEMES = [
  'worship', 'gratitude', 'hope', 'surrender', 'praise', 'love'
];

function SlideEditor({ slide, index, onChange, onDuplicate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSlide = (field, value) => {
    onChange(index, { ...slide, [field]: value });
  };

  const updateTiming = (field, value) => {
    onChange(index, { 
      ...slide, 
      timing: { ...slide.timing, [field]: value }
    });
  };

  const updateVisual = (field, value) => {
    onChange(index, { 
      ...slide, 
      visual: { ...slide.visual, [field]: value }
    });
  };

  const updateAnimation = (field, value) => {
    onChange(index, { 
      ...slide, 
      visual: { 
        ...slide.visual, 
        animation: { ...slide.visual.animation, [field]: value }
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm overflow-hidden">
      
      {/* Slide Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
        <div className="text-sm font-mono text-purple-400">
          #{String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white truncate">
            {slide.text.split('\n')[0]}
          </p>
          <p className="text-xs text-slate-400">
            {slide.section} • {slide.emotion} • {slide.timing.startTime}s-{slide.timing.endTime}s
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(index); }}
            className="p-1 rounded hover:bg-blue-500/20 text-blue-400">
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
            className="p-1 rounded hover:bg-red-500/20 text-red-400">
            <Minus className="h-4 w-4" />
          </button>
          {isExpanded ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Slide Details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-white/10 p-4 space-y-4">
          
          {/* Text Content */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Texto do Slide</label>
            <textarea
              value={slide.text}
              onChange={(e) => updateSlide('text', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder-slate-400"
              placeholder="Digite o texto do slide..."
            />
          </div>

          {/* Basic Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Seção</label>
              <input
                type="text"
                value={slide.section}
                onChange={(e) => updateSlide('section', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white"
                placeholder="Ex: Verse 1, Chorus"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Subseção</label>
              <input
                type="text"
                value={slide.subsection || ''}
                onChange={(e) => updateSlide('subsection', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white"
                placeholder="Ex: Pre-Chorus, Tag"
              />
            </div>
          </div>

          {/* Emotion and Theme */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Emoção</label>
              <select
                value={slide.emotion}
                onChange={(e) => updateSlide('emotion', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white">
                {EMOTIONS.map(emotion => (
                  <option key={emotion} value={emotion} className="bg-slate-800">
                    {emotion}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Tema</label>
              <select
                value={slide.theme || 'worship'}
                onChange={(e) => updateSlide('theme', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white">
                {THEMES.map(theme => (
                  <option key={theme} value={theme} className="bg-slate-800">
                    {theme}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Intensidade</label>
              <input
                type="range"
                min="1"
                max="10"
                value={slide.intensity || 5}
                onChange={(e) => updateSlide('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-center text-slate-400">{slide.intensity || 5}/10</div>
            </div>
          </div>

          {/* Timing */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timing
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Início (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={slide.timing.startTime}
                  onChange={(e) => updateTiming('startTime', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fim (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={slide.timing.endTime}
                  onChange={(e) => updateTiming('endTime', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">BPM</label>
                <input
                  type="number"
                  value={slide.timing.bpm || 120}
                  onChange={(e) => updateTiming('bpm', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ênfase</label>
                <select
                  value={slide.timing.emphasis || 'middle'}
                  onChange={(e) => updateTiming('emphasis', e.target.value)}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white">
                  <option value="start" className="bg-slate-800">Início</option>
                  <option value="middle" className="bg-slate-800">Meio</option>
                  <option value="end" className="bg-slate-800">Fim</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Styling */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Visual
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Cor do Texto</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={slide.visual.textColor || '#ffffff'}
                    onChange={(e) => updateVisual('textColor', e.target.value)}
                    className="w-12 h-8 rounded border border-white/20"
                  />
                  <input
                    type="text"
                    value={slide.visual.textColor || '#ffffff'}
                    onChange={(e) => updateVisual('textColor', e.target.value)}
                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Tamanho da Fonte</label>
                <select
                  value={slide.visual.fontSize || 'large'}
                  onChange={(e) => updateVisual('fontSize', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white">
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size} className="bg-slate-800">
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Background Colors */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-300 mb-2">Cores de Fundo (Gradiente)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={slide.visual.backgroundColor?.[0] || '#1a365d'}
                  onChange={(e) => {
                    const colors = slide.visual.backgroundColor || ['#1a365d', '#2d3748'];
                    updateVisual('backgroundColor', [e.target.value, colors[1]]);
                  }}
                  className="w-12 h-8 rounded border border-white/20"
                />
                <input
                  type="color"
                  value={slide.visual.backgroundColor?.[1] || '#2d3748'}
                  onChange={(e) => {
                    const colors = slide.visual.backgroundColor || ['#1a365d', '#2d3748'];
                    updateVisual('backgroundColor', [colors[0], e.target.value]);
                  }}
                  className="w-12 h-8 rounded border border-white/20"
                />
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={slide.visual.backgroundColor?.[0] || '#1a365d'}
                    onChange={(e) => {
                      const colors = slide.visual.backgroundColor || ['#1a365d', '#2d3748'];
                      updateVisual('backgroundColor', [e.target.value, colors[1]]);
                    }}
                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    value={slide.visual.backgroundColor?.[1] || '#2d3748'}
                    onChange={(e) => {
                      const colors = slide.visual.backgroundColor || ['#1a365d', '#2d3748'];
                      updateVisual('backgroundColor', [colors[0], e.target.value]);
                    }}
                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Animation */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Animação
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
                <select
                  value={slide.visual.animation?.type || 'fade'}
                  onChange={(e) => updateAnimation('type', e.target.value)}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white">
                  {ANIMATION_TYPES.map(type => (
                    <option key={type} value={type} className="bg-slate-800">
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Direção</label>
                <select
                  value={slide.visual.animation?.direction || 'in'}
                  onChange={(e) => updateAnimation('direction', e.target.value)}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white">
                  {ANIMATION_DIRECTIONS.map(direction => (
                    <option key={direction} value={direction} className="bg-slate-800">
                      {direction}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duração (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={slide.visual.animation?.duration || 1.5}
                  onChange={(e) => updateAnimation('duration', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Delay (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={slide.visual.animation?.delay || 0}
                  onChange={(e) => updateAnimation('delay', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-white/10 pt-4">
            <label className="block text-xs font-medium text-slate-300 mb-2">Notas</label>
            <textarea
              value={slide.notes || ''}
              onChange={(e) => updateSlide('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder-slate-400"
              placeholder="Notas adicionais para este slide..."
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function EditMetadata() {
  const router = useRouter();
  const { artist, title } = router.query;
  const [songAnalysis, setSongAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (artist && title && api?.getAdvancedSongAnalysis) {
      loadSongAnalysis();
    }
  }, [artist, title]);

  const loadSongAnalysis = async () => {
    try {
      setLoading(true);
      const artistStr = Array.isArray(artist) ? artist[0] : artist;
      const titleStr = Array.isArray(title) ? title[0] : title;
      const analysis = await api.getAdvancedSongAnalysis(artistStr!, titleStr!);
      setSongAnalysis(analysis);
      setError(null);
    } catch (err) {
      console.error('Error loading song analysis:', err);
      setError('Erro ao carregar análise da música');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!songAnalysis) return;

    try {
      setSaving(true);
      const artistStr = Array.isArray(artist) ? artist[0] : artist;
      const titleStr = Array.isArray(title) ? title[0] : title;
      await api.updateSongAnalysis(artistStr!, titleStr!, songAnalysis);
      alert('Metadados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving song analysis:', err);
      alert('Erro ao salvar metadados');
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (index, updatedSlide) => {
    setSongAnalysis(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => i === index ? updatedSlide : slide)
    }));
  };

  const duplicateSlide = (index) => {
    const slideToClone = { ...songAnalysis.slides[index] };
    slideToClone.id = `${slideToClone.id}-copy-${Date.now()}`;
    
    setSongAnalysis(prev => ({
      ...prev,
      slides: [
        ...prev.slides.slice(0, index + 1),
        slideToClone,
        ...prev.slides.slice(index + 1)
      ]
    }));
  };

  const deleteSlide = (index) => {
    if (songAnalysis.slides.length <= 1) {
      alert('Não é possível deletar o último slide');
      return;
    }

    setSongAnalysis(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
  };

  const addNewSlide = () => {
    const newSlide = {
      id: `new-slide-${Date.now()}`,
      text: 'Novo slide',
      section: 'Verse',
      emotion: 'peaceful',
      intensity: 5,
      timing: {
        startTime: songAnalysis.slides.length * 6,
        endTime: (songAnalysis.slides.length + 1) * 6,
        bpm: 120,
        emphasis: 'middle'
      },
      visual: {
        backgroundColor: ['#1a365d', '#2d3748'],
        textColor: '#ffffff',
        fontSize: 'large',
        fontWeight: 'normal',
        textAlign: 'center',
        animation: {
          type: 'fade',
          direction: 'in',
          duration: 1.5,
          delay: 0
        }
      },
      layoutSuggestion: 'centered-large-font',
      duration: 6,
      isEditable: true
    };

    setSongAnalysis(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-white">Carregando metadados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Head>
        <title>Editar Metadados - {title} - {artist}</title>
      </Head>

      <div className="p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-bold text-white">{title}</h1>
                <p className="text-sm text-slate-400">{artist}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadSongAnalysis}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Recarregar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Song Info */}
          {songAnalysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Slides:</span>
                <span className="ml-2 text-white">{songAnalysis.slides.length}</span>
              </div>
              <div>
                <span className="text-slate-400">Duração:</span>
                <span className="ml-2 text-white">{Math.round(songAnalysis.metadata.totalDuration || 0)}s</span>
              </div>
              <div>
                <span className="text-slate-400">BPM:</span>
                <span className="ml-2 text-white">{songAnalysis.metadata.bpm || 120}</span>
              </div>
              <div>
                <span className="text-slate-400">Versão:</span>
                <span className="ml-2 text-white">{songAnalysis.version}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Slides Editor */}
        {songAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Slides</h2>
              <Button
                onClick={addNewSlide}
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="h-4 w-4" />
                Adicionar Slide
              </Button>
            </div>

            <div className="space-y-4">
              {songAnalysis.slides.map((slide, index) => (
                <SlideEditor
                  key={slide.id}
                  slide={slide}
                  index={index}
                  onChange={updateSlide}
                  onDuplicate={duplicateSlide}
                  onDelete={deleteSlide}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default EditMetadata;
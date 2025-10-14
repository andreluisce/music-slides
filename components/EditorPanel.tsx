import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MusicNote,
  Image as ImageIcon,
  VideoCamera,
  BookOpen,
  TextT,
  Palette,
  DotsThreeVertical,
  Trash,
  Play,
  Calendar,
  FileText,
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { Presentation, PresentationItem } from '../lib/presentation-types';
import { useStageMode } from '../hooks/useStageMode';

export default function EditorPanel() {
  const { selectedPresentation, setSelectedPresentation } = useStageMode();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [presentationItems, setPresentationItems] = useState<PresentationItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresentationName, setNewPresentationName] = useState('');

  // Load presentations on mount
  useEffect(() => {
    loadPresentations();
  }, []);

  // Load items when presentation is selected
  useEffect(() => {
    if (selectedPresentation) {
      loadPresentationItems(selectedPresentation.id);
    }
  }, [selectedPresentation]);

  const loadPresentations = async () => {
    try {
      const fetchedPresentations = await window.electron.getAllPresentations();
      setPresentations(fetchedPresentations);
    } catch (error) {
      console.error('Error loading presentations:', error);
    }
  };

  const createPresentation = async () => {
    if (!newPresentationName.trim()) return;

    try {
      const newPresentation = await window.electron.createPresentation({
        name: newPresentationName,
        status: 'draft',
        date: new Date().toISOString(),
      });
      setSelectedPresentation(newPresentation);
      setIsCreating(false);
      setNewPresentationName('');
      loadPresentations();
    } catch (error) {
      console.error('Error creating presentation:', error);
    }
  };

  const loadPresentationItems = async (presentationId: string) => {
    try {
      const items = await window.electron.getPresentationItems(presentationId);
      setPresentationItems(items);
    } catch (error) {
      console.error('Error loading presentation items:', error);
    }
  };

  const addItemTypes = [
    { id: 'song', label: 'Música', icon: MusicNote, color: 'from-purple-500 to-pink-500' },
    { id: 'bible', label: 'Bíblia', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { id: 'image', label: 'Imagem', icon: ImageIcon, color: 'from-green-500 to-emerald-500' },
    { id: 'video', label: 'Vídeo', icon: VideoCamera, color: 'from-red-500 to-orange-500' },
    { id: 'text', label: 'Texto', icon: TextT, color: 'from-yellow-500 to-amber-500' },
  ];

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Presentations List */}
      <div className="w-80 border-r border-white/10 bg-black/20 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Apresentações</h2>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="bg-magenta hover:bg-magenta-600"
            >
              <Plus size={16} weight="bold" />
            </Button>
          </div>

          {/* Create New Presentation */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Input
                value={newPresentationName}
                onChange={(e) => setNewPresentationName(e.target.value)}
                placeholder="Nome da apresentação"
                className="bg-white/10 border-white/20 text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createPresentation();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewPresentationName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={createPresentation}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Criar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewPresentationName('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Presentations List */}
        <div className="flex-1 overflow-auto p-2">
          {presentations.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} weight="thin" className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">Nenhuma apresentação</p>
              <p className="text-xs text-slate-600 mt-1">
                Clique em + para criar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {presentations.map((presentation) => (
                <motion.button
                  key={presentation.id}
                  onClick={() => setSelectedPresentation(presentation)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedPresentation?.id === presentation.id
                      ? 'bg-magenta text-white shadow-lg'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {presentation.name}
                      </h3>
                      {presentation.date && (
                        <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                          <Calendar size={12} />
                          <span>{new Date(presentation.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-1 rounded ${
                        presentation.status === 'ready'
                          ? 'bg-green-500/20 text-green-300'
                          : presentation.status === 'presented'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {presentation.status === 'draft' && 'Rascunho'}
                      {presentation.status === 'ready' && 'Pronta'}
                      {presentation.status === 'presented' && 'Apresentada'}
                      {presentation.status === 'archived' && 'Arquivada'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area - Presentation Editor */}
      <div className="flex-1 flex flex-col">
        {selectedPresentation ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-black/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Input
                    value={selectedPresentation.name}
                    onChange={(e) =>
                      setSelectedPresentation({
                        ...selectedPresentation,
                        name: e.target.value,
                      })
                    }
                    onBlur={async () => {
                      if (selectedPresentation) {
                        await window.electron.updatePresentation(
                          selectedPresentation.id,
                          { name: selectedPresentation.name }
                        );
                        loadPresentations(); // Reload to reflect changes in the list
                      }
                    }}
                    className="text-2xl font-bold bg-transparent border-none text-white p-0 h-auto focus:ring-0"
                  />
                  {selectedPresentation.description && (
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedPresentation.description}
                    </p>
                  )}
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Play size={16} weight="fill" className="mr-2" />
                  Apresentar
                </Button>
              </div>

              {/* Add Item Buttons */}
              <div className="flex gap-2 flex-wrap">
                {addItemTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      <Icon size={16} className="mr-2" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-auto p-6">
              {presentationItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2 text-slate-600 mb-3">
                    <MusicNote size={32} weight="thin" />
                    <Plus size={24} weight="thin" />
                    <ImageIcon size={32} weight="thin" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Nenhum item nesta apresentação
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Adicione músicas, versículos, imagens ou vídeos
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {presentationItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {/* TODO: Format item title based on type */}
                          Item {index + 1}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.item_type}
                        </p>
                      </div>
                      <button className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400">
                        <Trash size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={64} weight="thin" className="mx-auto text-slate-700 mb-4" />
              <p className="text-lg text-slate-500 mb-2">
                Selecione uma apresentação
              </p>
              <p className="text-sm text-slate-600">
                ou crie uma nova para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

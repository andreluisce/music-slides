import React, { useState } from 'react';
import { useStageMode } from '../hooks/useStageMode';
import { MusicNote, Video, Image, BookOpen, Palette } from '@phosphor-icons/react';
import MusicLibrary from './MusicLibrary';
import VideoPanel from './VideoPanel';
import BiblePanel from './BiblePanel';
import ThemesPanel from './ThemesPanel';

export default function LibraryPanel() {
  const { mode, setMode } = useStageMode();

  // Determine active sub-section
  const activeSection = ['songs', 'videos', 'images', 'bible', 'themes'].includes(mode)
    ? mode
    : 'songs'; // default to songs

  const sections = [
    { id: 'songs', label: 'Músicas', icon: MusicNote, component: MusicLibrary },
    { id: 'videos', label: 'Vídeos', icon: Video, component: VideoPanel },
    { id: 'images', label: 'Imagens', icon: Image, component: () => <EmptySection title="Imagens" /> },
    { id: 'bible', label: 'Bíblia', icon: BookOpen, component: BiblePanel },
    { id: 'themes', label: 'Temas', icon: Palette, component: ThemesPanel },
  ];

  const ActiveComponent = sections.find((s) => s.id === activeSection)?.component || MusicLibrary;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Conteúdo
          </h2>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setMode(section.id as any)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-magenta/20 to-purple-500/20 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                  {section.label}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-magenta" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <ActiveComponent />
      </main>
    </div>
  );
}

function EmptySection({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <Image size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400">Esta seção será implementada em breve.</p>
      </div>
    </div>
  );
}


import React from 'react';
import {
  House,
  Book,
  MonitorPlay,
  BookOpen,
  Video,
  Palette,
  Gear,
  MusicNote,
  Sparkle,
} from '@phosphor-icons/react';

import { useStageMode } from '../hooks/useStageMode';

const menuItems = [
  { name: 'Início', icon: House, path: 'mostrar', badge: null },
  { name: 'Biblioteca', icon: Book, path: 'mostrar', badge: null },
  { name: 'Apresentações', icon: MonitorPlay, path: 'mostrar', badge: null },
  { name: 'Bíblia', icon: BookOpen, path: 'bible', badge: null },
  { name: 'Vídeos', icon: Video, path: 'videos', badge: null },
  { name: 'Temas', icon: Palette, path: 'themes', badge: null },
  { name: 'Configurações', icon: Gear, path: 'settings', badge: null },
];

export default function Sidebar() {
  const { mode, setMode } = useStageMode();

  return (
    <aside className="glass-heavy flex w-72 flex-col">
      {/* Logo Header */}
      <div className="border-b border-white/10 p-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-magenta to-purple-600 shadow-lg shadow-magenta/30">
            <MusicNote className="h-7 w-7 text-white" weight="bold" />
            <div className="absolute -top-1 -right-1">
              <Sparkle size={14} weight="fill" className="text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading text-white tracking-tight">Lyrics Show</h1>
            <p className="text-sm text-slate-400 font-medium">Apresentações ao vivo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-6">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = mode === item.path;

            return (
              <li key={index}>
                <button
                  onClick={() => setMode(item.path as any)}
                  className={active ? 'nav-item-active w-full' : 'nav-item-inactive w-full'}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" weight={active ? 'fill' : 'regular'} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <span className="badge-info text-xs px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <div className="h-2 w-2 rounded-full bg-magenta animate-pulse" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      <div className="border-t border-white/10 p-6">
        <div className="glass-light rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white font-heading">v2.0.0</p>
            <span className="badge-success text-xs px-2 py-0.5">Ativo</span>
          </div>
          <p className="text-xs text-slate-400">Lyrics Slideshow Pro</p>
          <div className="divider my-3" />
          <p className="text-xs text-slate-500">
            Build 2025.01.13
          </p>
        </div>
      </div>
    </aside>
  );
}

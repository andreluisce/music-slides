
import React, { useState, useEffect } from 'react';
import { useStageMode } from '../hooks/useStageMode';
import { useSettings } from '../contexts/SettingsContext';
import {
  Clock,
  MusicNote,
  Book,
  MonitorPlay,
  Gear,
  Sparkle,
  Question,
} from '@phosphor-icons/react';

export default function TopBar() {
  const { mode, setMode } = useStageMode();
  const { settings } = useSettings();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mainSections = [
    { id: 'library', label: 'Biblioteca', icon: Book, description: 'Gerenciar músicas, vídeos, imagens e temas' },
    { id: 'presentations', label: 'Apresentações', icon: MonitorPlay, description: 'Criar e controlar apresentações' },
  ];

  const isLibraryActive = ['library', 'songs', 'videos', 'images', 'bible', 'themes'].includes(mode);
  const isPresentationsActive = ['presentations', 'editor', 'stage', 'live'].includes(mode);

  return (
    <header className="glass-heavy flex h-20 flex-shrink-0 items-center justify-between px-8 border-b border-white/10">
      {/* Left Section: Logo + Main Navigation */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-magenta to-purple-600 shadow-lg shadow-magenta/30">
            <MusicNote className="h-6 w-6 text-white" weight="bold" />
            <div className="absolute -top-1 -right-1">
              <Sparkle size={12} weight="fill" className="text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading text-white tracking-tight leading-none">
              Lyrics Show
            </h1>
            <p className="text-xs text-slate-400 font-medium">Pro</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center gap-2">
          {mainSections.map((section) => {
            const Icon = section.icon;
            const isActive =
              (section.id === 'library' && isLibraryActive) ||
              (section.id === 'presentations' && isPresentationsActive);

            return (
              <button
                key={section.id}
                onClick={() => setMode(section.id as any)}
                title={section.description}
                className={`
                  relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${isActive
                    ? 'text-white bg-gradient-to-r from-magenta/20 to-purple-500/20 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                {section.label}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-magenta shadow-glow-magenta" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Section: Help + Settings + Clock */}
      <div className="flex items-center gap-3">
        {/* Help Button */}
        <button
          onClick={() => setMode('help')}
          title="Ajuda e Documentação"
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-200
            ${mode === 'help'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          <Question size={20} weight={mode === 'help' ? 'fill' : 'regular'} />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setMode('settings')}
          title="Configurações"
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-200
            ${mode === 'settings'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          <Gear size={20} weight={mode === 'settings' ? 'fill' : 'regular'} />
        </button>

        {/* Clock */}
        <div className="flex items-center gap-3 glass-light px-4 py-2.5 rounded-xl">
          <Clock size={18} weight="bold" className="text-purple-400" />
          <span className="font-mono text-base font-semibold text-white tracking-wider">
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: !settings.use24Hour
            })}
          </span>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { useStageMode } from '../hooks/useStageMode';
import { PencilIcon, LightningIcon, CellTowerIcon } from '@phosphor-icons/react';
import EditorPanel from './EditorPanel';
import StagePanel from './StagePanel';
import LiveControlPanel from './LiveControlPanel';

export default function PresentationsPanel() {
  const { mode, setMode, selectedPresentation } = useStageMode();

  // Determine active mode
  const activeMode = ['editor', 'stage', 'live'].includes(mode) ? mode : 'editor';

  const modes = [
    {
      id: 'editor',
      label: 'Editar',
      icon: PencilIcon,
      description: 'Monte sua apresentação',
      component: EditorPanel,
    },
    {
      id: 'stage',
      label: 'Palco',
      icon: LightningIcon,
      description: 'Visualize como ficará no palco',
      component: StagePanel,
    },
    {
      id: 'live',
      label: 'Ao Vivo',
      icon: CellTowerIcon,
      description: 'Controle a apresentação',
      component: LiveControlPanel,
    },
  ];

  const ActiveComponent = modes.find((m) => m.id === activeMode)?.component || EditorPanel;

  return (
    <div className="flex flex-col h-full">
      {/* Mode Switcher */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 p-4">
          <div className="inline-flex items-center gap-1 rounded-xl glass-medium p-1.5">
            {modes.map((modeItem) => {
              const Icon = modeItem.icon;
              const isActive = activeMode === modeItem.id;

              return (
                <button
                  key={modeItem.id}
                  onClick={() => setMode(modeItem.id as any)}
                  title={modeItem.description}
                  className={`
                    relative flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold
                    transition-all duration-200
                    ${isActive
                      ? 'bg-magenta text-white shadow-lg shadow-magenta/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon size={18} weight="bold" />
                  {modeItem.label}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-magenta/20 blur-md -z-10" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Mode Content */}
      <div className="flex-1 overflow-auto">
        {activeMode === 'live' ? (
          // Se estiver no modo ao vivo, use o LiveControlPanel
          <LiveControlPanel 
            presentationId={selectedPresentation?.id || ''}
            key={activeMode}
          />
        ) : selectedPresentation ? (
          <ActiveComponent 
            presentationId={selectedPresentation.id} 
            key={activeMode}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Selecione ou crie uma apresentação para começar.
          </div>
        )}
      </div>
    </div>
  );
}

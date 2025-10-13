
import React from 'react';
import { Button } from './ui/button';
import { SkipBack, SkipForward, Play, Broom, ArrowsOut } from '@phosphor-icons/react';

export default function LiveControlPanel() {
  return (
    <div className="flex flex-1 flex-col bg-black">
      <div className="flex-1 p-6 flex gap-6">
        <div className="flex-1 flex flex-col gap-6">
            <div className="flex-1 rounded-lg bg-gradient-to-br from-purple-900/50 to-black/50 p-6 shadow-lg backdrop-blur-md">
                <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-purple-400/30">
                    <p className="text-6xl font-bold text-white">Exaltado és Tu</p>
                </div>
            </div>
        </div>
        <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-purple-400">Próximo Slide</h2>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-900/50 to-black/50 p-4 shadow-md">
                <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-purple-400/30 text-center">
                  <p className="text-2xl font-semibold text-white">Em meu ser</p>
                </div>
              </div>
            </div>
            <div>
                <h2 className="mb-4 text-lg font-semibold text-purple-400">Transições</h2>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent text-white hover:bg-white/10">Fade</Button>
                    <Button variant="outline" className="flex-1 bg-transparent text-white hover:bg-white/10">Cut</Button>
                </div>
            </div>
        </aside>
      </div>
      <div className="h-24 bg-black/50 border-t border-purple-500/20 flex items-center justify-center gap-4">
        <Button size="lg" variant="ghost" className="text-white hover:bg-white/10"><SkipBack size={32} /></Button>
        <Button size="lg" className="bg-magenta hover:bg-magenta-600"><Play size={32} /></Button>
        <Button size="lg" variant="ghost" className="text-white hover:bg-white/10"><SkipForward size={32} /></Button>
        <Button size="lg" variant="ghost" className="text-white hover:bg-white/10"><Broom size={32} /></Button>
        <Button size="lg" variant="ghost" className="text-white hover:bg-white/10"><ArrowsOut size={32} /></Button>
      </div>
    </div>
  );
}

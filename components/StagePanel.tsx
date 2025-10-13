import React from 'react';

export default function StagePanel() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex flex-1 flex-col p-6">
        <div className="flex-1 rounded-lg bg-gradient-to-br from-purple-900/50 to-black/50 p-6 shadow-lg backdrop-blur-md">
          <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-purple-400/30">
            <p className="text-6xl font-bold text-white">Me ama, Ele me ama</p>
          </div>
        </div>
      </main>
      <aside className="w-80 flex-shrink-0 border-l border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
        <div className="flex h-full flex-col gap-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-purple-400">Próximo Slide</h2>
            <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-900/50 to-black/50 p-4 shadow-md">
              <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-purple-400/30 text-center">
                <p className="text-2xl font-semibold text-white">Ele me amou primeiro</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="mb-4 text-lg font-semibold text-purple-400">Fila de Apresentação</h2>
            <div className="space-y-3">
              {[
                { title: 'Aclame ao Senhor', type: 'Música' },
                { title: 'Abertura', type: 'Vídeo' },
                { title: 'Leitura Bíblica', type: 'Bíblia' },
                { title: 'Oceans', type: 'Música' },
                { title: 'Encerramento', type: 'Imagem' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-purple-300">{item.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
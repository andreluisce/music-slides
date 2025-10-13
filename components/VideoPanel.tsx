
import React from 'react';
import { VideoCamera, UploadSimple, Play } from '@phosphor-icons/react';
import { Button } from './ui/button';

export default function VideoPanel() {
  return (
    <div className="h-full p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-header">Vídeos</h1>
        <p className="text-slate-400 text-lg">Gerencie seus vídeos de fundo para apresentações</p>
      </div>

      {/* Empty State */}
      <div className="empty-state min-h-[500px]">
        <div className="card-glass max-w-2xl">
          {/* Icon */}
          <div className="empty-state-icon mb-6">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-purple-500/30 rounded-full"></div>
              <VideoCamera size={96} weight="duotone" className="relative" />
            </div>
          </div>

          {/* Content */}
          <h2 className="empty-state-title text-3xl mb-3">Nenhum vídeo encontrado</h2>
          <p className="empty-state-description text-lg mb-8">
            Faça upload de vídeos para usar como plano de fundo nas suas apresentações.
            Formatos suportados: MP4, MOV, AVI
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="btn-primary gap-2"
            >
              <UploadSimple size={20} weight="bold" />
              Fazer Upload
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="btn-secondary gap-2"
            >
              <Play size={20} weight="fill" />
              Abrir Video Player
            </Button>
          </div>

          {/* Help Text */}
          <div className="divider" />
          <p className="text-xs text-slate-500 mt-6">
            💡 Dica: Vídeos em loop são ideais para fundos de adoração
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Book, MonitorPlay, MusicNote, Video, Image as ImageIcon, BookOpen, Palette, Lightning, Keyboard } from '@phosphor-icons/react';

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export default function HelpPanel() {
  const [activeSection, setActiveSection] = useState<string>('intro');

  const sections: HelpSection[] = [
    {
      id: 'intro',
      title: 'Introdução',
      icon: Book,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo ao Lyrics Show Pro</h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              O Lyrics Show Pro é uma ferramenta profissional para gerenciar e apresentar letras de músicas,
              vídeos, imagens e versículos bíblicos em cultos, eventos e apresentações.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-glass p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-magenta/20">
                  <Book size={20} className="text-magenta" weight="fill" />
                </div>
                <h3 className="text-lg font-semibold text-white">Biblioteca</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Gerencie todo o seu conteúdo: músicas, vídeos, imagens, versículos e temas visuais.
              </p>
            </div>

            <div className="card-glass p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                  <MonitorPlay size={20} className="text-purple-400" weight="fill" />
                </div>
                <h3 className="text-lg font-semibold text-white">Apresentações</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Crie, edite e controle suas apresentações com ferramentas profissionais.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'library',
      title: 'Biblioteca',
      icon: Book,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Gerenciando Conteúdo</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              A Biblioteca é onde você organiza todo o seu conteúdo. Use a barra lateral para navegar entre os diferentes tipos de mídia.
            </p>
          </div>

          <div className="space-y-4">
            <ContentTypeCard
              icon={MusicNote}
              title="Músicas"
              description="Busque, adicione e organize suas letras de música. Use a busca integrada para encontrar letras online."
              features={[
                'Busca automática em múltiplos sites de letras',
                'Análise por IA para detectar refrão e estrutura',
                'Sincronização com a nuvem (Supabase)',
                'Organização por artista e título',
              ]}
            />

            <ContentTypeCard
              icon={Video}
              title="Vídeos"
              description="Gerencie seus vídeos de fundo e clipes para apresentações."
              features={[
                'Suporte para múltiplos formatos',
                'Preview de vídeos',
                'Controles de reprodução',
              ]}
            />

            <ContentTypeCard
              icon={ImageIcon}
              title="Imagens"
              description="Adicione e organize imagens de fundo para suas apresentações."
              features={[
                'Suporte para JPG, PNG, WebP',
                'Galeria visual',
                'Aplicação rápida em slides',
              ]}
            />

            <ContentTypeCard
              icon={BookOpen}
              title="Bíblia"
              description="Busque e adicione versículos bíblicos às suas apresentações."
              features={[
                'Busca por livro, capítulo e versículo',
                'Múltiplas traduções',
                'Formatação automática',
              ]}
            />

            <ContentTypeCard
              icon={Palette}
              title="Temas"
              description="Personalize a aparência visual das suas apresentações."
              features={[
                'Temas pré-configurados',
                'Customização de cores',
                'Fontes e estilos',
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'presentations',
      title: 'Apresentações',
      icon: MonitorPlay,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Criando Apresentações</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              O módulo de Apresentações tem três modos principais para criar e controlar suas apresentações.
            </p>
          </div>

          <div className="space-y-4">
            <ModeCard
              icon={Lightning}
              mode="Editar"
              description="Monte sua apresentação arrastando e soltando itens da biblioteca."
              steps={[
                'Clique no botão "Editar" na barra de modo',
                'Use o dock inferior para adicionar músicas, vídeos, imagens, etc.',
                'Organize os itens na ordem desejada',
                'Salve sua apresentação',
              ]}
            />

            <ModeCard
              icon={Lightning}
              mode="Palco"
              description="Visualize como sua apresentação ficará projetada."
              steps={[
                'Clique no botão "Palco" na barra de modo',
                'Veja o slide atual em tela cheia',
                'Acompanhe o próximo slide na lateral',
                'Use as setas do teclado para navegar',
              ]}
            />

            <ModeCard
              icon={Lightning}
              mode="Ao Vivo"
              description="Controle sua apresentação durante o evento."
              steps={[
                'Clique no botão "Ao Vivo" na barra de modo',
                'Use os controles de navegação',
                'Escolha transições entre slides',
                'Limpe a tela quando necessário',
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'shortcuts',
      title: 'Atalhos',
      icon: Keyboard,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Atalhos de Teclado</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              Use estes atalhos para agilizar seu trabalho durante as apresentações.
            </p>
          </div>

          <div className="space-y-6">
            <ShortcutSection
              title="Navegação de Slides"
              shortcuts={[
                { keys: ['→', 'Space'], description: 'Próximo slide' },
                { keys: ['←', 'Backspace'], description: 'Slide anterior' },
                { keys: ['Home'], description: 'Primeiro slide' },
                { keys: ['End'], description: 'Último slide' },
              ]}
            />

            <ShortcutSection
              title="Controles de Apresentação"
              shortcuts={[
                { keys: ['F'], description: 'Tela cheia' },
                { keys: ['Esc'], description: 'Sair da tela cheia' },
                { keys: ['B'], description: 'Tela preta (blackout)' },
                { keys: ['W'], description: 'Tela branca' },
              ]}
            />

            <ShortcutSection
              title="Geral"
              shortcuts={[
                { keys: ['Ctrl', 'S'], description: 'Salvar apresentação' },
                { keys: ['Ctrl', 'N'], description: 'Nova apresentação' },
                { keys: ['Ctrl', ','], description: 'Configurações' },
                { keys: ['F1'], description: 'Ajuda' },
              ]}
            />
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find((s) => s.id === activeSection)?.content;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Documentação
          </h2>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
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
                  {section.title}
                  {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-magenta" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeContent}
        </div>
      </main>
    </div>
  );
}

function ContentTypeCard({ icon: Icon, title, description, features }: any) {
  return (
    <div className="card-glass p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-magenta/20 to-purple-500/20">
          <Icon size={24} className="text-magenta" weight="fill" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm mb-3">{description}</p>
          <ul className="space-y-1.5">
            {features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-magenta mt-0.5">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ icon: Icon, mode, description, steps }: any) {
  return (
    <div className="card-glass p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-magenta/20 to-purple-500/20">
          <Icon size={24} className="text-magenta" weight="bold" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Modo: {mode}</h3>
          <p className="text-slate-400 text-sm mb-4">{description}</p>
          <div className="space-y-2">
            {steps.map((step: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-magenta/20 text-xs font-bold text-magenta">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-300 pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutSection({ title, shortcuts }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {shortcuts.map((shortcut: any, index: number) => (
          <div key={index} className="flex items-center justify-between py-2 px-4 rounded-lg glass-light">
            <div className="flex items-center gap-2">
              {shortcut.keys.map((key: string, keyIndex: number) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="px-3 py-1.5 text-sm font-mono font-semibold text-white bg-white/10 border border-white/20 rounded-md shadow-sm">
                    {key}
                  </kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-slate-500">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <span className="text-slate-300 text-sm">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  Library,
  Presentation,
  Video,
  Palette,
  Settings,
  Music2
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { name: 'Início', icon: Home, path: '/' },
  { name: 'Biblioteca', icon: Library, path: '/library' },
  { name: 'Apresentações', icon: Presentation, path: '/presentations' },
  { name: 'Vídeos', icon: Video, path: '/videos' },
  { name: 'Temas', icon: Palette, path: '/themes' },
  { name: 'Configurações', icon: Settings, path: '/settings' },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Sidebar */}
      <aside className='flex w-64 flex-col border-r border-white/10 bg-black/20 backdrop-blur-sm'>
        {/* Logo */}
        <div className='border-b border-white/10 p-6'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500'>
              <Music2 className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-white'>Lyrics Show</h1>
              <p className='text-xs text-slate-400'>Apresentações</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className='flex-1 overflow-y-auto p-4'>
          <ul className='space-y-1'>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                      active
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}>
                    <Icon className='h-5 w-5' />
                    <span className='font-medium'>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className='border-t border-white/10 p-4'>
          <div className='rounded-lg bg-white/5 p-3 text-xs text-slate-400'>
            <p className='font-semibold text-white'>v1.0.0</p>
            <p className='mt-1'>Lyrics Slideshow</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-y-auto'>
        {children}
      </main>
    </div>
  );
}

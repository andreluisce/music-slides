
import React from 'react';
import { Button } from './ui/button';
import { Star, Pencil, Trash } from '@phosphor-icons/react';

const themes = [
  { name: 'Padrão', font: 'Inter', size: '48px', animation: 'Fade' },
  { name: 'Elegant Gold', font: 'Playfair Display', size: '52px', animation: 'Slide' },
  { name: 'Neon Glow', font: 'Monoton', size: '60px', animation: 'Zoom' },
];

export default function ThemesPanel() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Temas</h1>
        <div className="flex gap-2">
            <Button size='lg' variant='outline' className="bg-transparent text-white hover:bg-white/10">+ Novo Tema</Button>
            <Button size='lg' className="bg-magenta hover:bg-magenta-600">Sugestão de Tema AI</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme, index) => (
          <div key={index} className="rounded-lg bg-white/5 p-4 backdrop-blur-md">
            <div className="aspect-video rounded-md bg-black/30 flex items-center justify-center mb-4">
              <p className="text-3xl font-bold" style={{ fontFamily: theme.font }}>Aa</p>
            </div>
            <h3 className="text-xl font-bold text-white">{theme.name}</h3>
            <p className="text-sm text-slate-400">{theme.font}, {theme.size}</p>
            <p className="text-sm text-slate-400">Animação: {theme.animation}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="bg-transparent text-white hover:bg-white/10"><Star className="mr-2" /> Favorito</Button>
              <Button variant="outline" size="sm" className="bg-transparent text-white hover:bg-white/10"><Pencil className="mr-2" /> Editar</Button>
              <Button variant="destructive" size="sm"><Trash className="mr-2" /> Apagar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

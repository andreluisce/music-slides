
import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BookOpen, MagnifyingGlass } from '@phosphor-icons/react';

export default function BiblePanel() {
  return (
    <div className="h-full p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-header">Bíblia Sagrada</h1>
        <p className="text-slate-400 text-lg">Busque versículos para suas apresentações</p>
      </div>

      {/* Search Form */}
      <div className="card-glass max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={24} weight="duotone" className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">Buscar Versículo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Book Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Livro da Bíblia</label>
            <Select>
              <SelectTrigger className="input-glass h-14 text-base">
                <SelectValue placeholder="Selecione o livro" />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-white/20 text-white">
                <SelectItem value="genesis">Gênesis</SelectItem>
                <SelectItem value="exodus">Êxodo</SelectItem>
                <SelectItem value="leviticus">Levítico</SelectItem>
                <SelectItem value="numbers">Números</SelectItem>
                <SelectItem value="john">João</SelectItem>
                <SelectItem value="psalms">Salmos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Version Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Versão</label>
            <Select>
              <SelectTrigger className="input-glass h-14 text-base">
                <SelectValue placeholder="Selecione a versão" />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-white/20 text-white">
                <SelectItem value="nvi">NVI - Nova Versão Internacional</SelectItem>
                <SelectItem value="arc">ARC - Almeida Revista e Corrigida</SelectItem>
                <SelectItem value="acf">ACF - Almeida Corrigida Fiel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chapter Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Capítulo</label>
            <Input
              type="number"
              placeholder="Ex: 3"
              className="input-glass h-14 text-base"
            />
          </div>

          {/* Verse Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Versículo</label>
            <Input
              type="number"
              placeholder="Ex: 16"
              className="input-glass h-14 text-base"
            />
          </div>
        </div>

        {/* Search Button */}
        <Button size="lg" className="btn-primary w-full gap-2 h-14 text-base">
          <MagnifyingGlass size={20} weight="bold" />
          Buscar Versículo
        </Button>
      </div>

      {/* Empty State */}
      <div className="empty-state min-h-[300px]">
        <BookOpen size={64} weight="duotone" className="empty-state-icon" />
        <h3 className="empty-state-title">Nenhuma busca realizada</h3>
        <p className="empty-state-description">
          Digite o livro, capítulo e versículo acima para buscar na Bíblia
        </p>
      </div>
    </div>
  );
}

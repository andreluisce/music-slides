import { Globe, CloudCheck } from '@phosphor-icons/react';

// Helper function to get source badge info
export function getSourceBadge(source: string) {
  switch (source) {
    case 'letrasmusic':
      return {
        label: 'Letras.mus.br',
        icon: Globe,
        className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      };
    case 'cifraclub':
      return {
        label: 'CifraClub',
        icon: Globe,
        className: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      };
    case 'database-cache':
      return {
        label: 'Cache',
        icon: CloudCheck,
        className: 'bg-green-500/20 text-green-300 border-green-500/30',
      };
    default:
      return {
        label: source,
        icon: Globe,
        className: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      };
  }
}

import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { FlipVertical, Plus, DotsSixVertical, Clock, Play, X } from '@phosphor-icons/react';

interface PlanItem {
  id: string;
  type: 'song' | 'custom';
  title: string;
  artist?: string;
  duration?: string;
  notes?: string;
}

interface Plan {
  id: string;
  name: string;
  date?: string;
  items: PlanItem[];
}

interface PlanPanelProps {
  plan: Plan;
  onReorderItems: (items: PlanItem[]) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: () => void;
  onItemClick: (item: PlanItem) => void;
}

export default function PlanPanel({
  plan,
  onReorderItems,
  onRemoveItem,
  onAddItem,
  onItemClick
}: PlanPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">
            {plan.name}
          </h2>
          {plan.date && (
            <p className="text-sm text-slate-400">
              {plan.date}
            </p>
          )}
        </div>

        <motion.button
          onClick={onAddItem}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} />
          Adicionar Item
        </motion.button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        <Reorder.Group
          axis="y"
          values={plan.items}
          onReorder={onReorderItems}
          className="space-y-2"
        >
          {plan.items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="group"
            >
              <motion.div
                layout
                className={`
                  flex items-center gap-3 rounded-lg border border-white/10
                  bg-black/20 p-3 backdrop-blur-sm
                  ${item.type === 'custom' ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="cursor-move rounded p-1 text-slate-600 hover:bg-white/5 hover:text-slate-400">
                  <DotsSixVertical size={16} />
                </div>

                {/* Item Info */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onItemClick(item)}
                >
                  <div className="font-medium text-white">
                    {item.title}
                  </div>
                  {item.artist && (
                    <div className="text-sm text-slate-400">
                      {item.artist}
                    </div>
                  )}
                </div>

                {/* Duration */}
                {item.duration && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} />
                    {item.duration}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <motion.button
                    className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onItemClick(item)}
                  >
                    <Play size={14} />
                  </motion.button>
                  <motion.button
                    className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              </motion.div>

              {/* Item Notes (if any) */}
              {item.notes && (
                <div className="ml-8 mt-1 text-xs text-slate-500">
                  {item.notes}
                </div>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {plan.items.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-400">
            Arraste músicas para este plano
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {plan.items.length} {plan.items.length === 1 ? 'item' : 'itens'}
          </span>
          {plan.items.some(item => item.duration) && (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock size={14} />
              <span>
                {plan.items
                  .map(item => item.duration || '0:00')
                  .reduce((total, duration) => {
                    const [min, sec] = duration.split(':').map(Number);
                    return total + (min * 60) + sec;
                  }, 0)
                  .toString()
                  .replace(/(\d+)/, (_, p1) => {
                    const min = Math.floor(Number(p1) / 60);
                    const sec = Number(p1) % 60;
                    return `${min}:${sec.toString().padStart(2, '0')}`;
                  })
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
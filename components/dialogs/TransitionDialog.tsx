import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowLeft, ArrowUp, Cube, Sparkle } from '@phosphor-icons/react';

interface TransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (transition: { type: string; duration: number; direction?: string }) => void;
}

const TRANSITION_PRESETS = [
  {
    name: 'Fade',
    type: 'fade',
    duration: 500,
    icon: Sparkle,
    preview: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  },
  {
    name: 'Slide Right',
    type: 'slide',
    direction: 'right',
    duration: 300,
    icon: ArrowRight,
    preview: {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 }
    }
  },
  {
    name: 'Slide Left',
    type: 'slide',
    direction: 'left',
    duration: 300,
    icon: ArrowLeft,
    preview: {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 }
    }
  },
  {
    name: 'Slide Up',
    type: 'slide',
    direction: 'up',
    duration: 300,
    icon: ArrowUp,
    preview: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 }
    }
  },
  {
    name: 'Slide Down',
    type: 'slide',
    direction: 'down',
    duration: 300,
    icon: ArrowDown,
    preview: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 }
    }
  },
  {
    name: 'Scale',
    type: 'scale',
    duration: 300,
    icon: Cube,
    preview: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0, opacity: 0 }
    }
  }
];

export default function TransitionDialog({ isOpen, onClose, onSelect }: TransitionDialogProps) {
  const [selectedTransition, setSelectedTransition] = useState(TRANSITION_PRESETS[0]);
  const [duration, setDuration] = useState(300);

  const handleSelect = (transition: typeof TRANSITION_PRESETS[0]) => {
    setSelectedTransition(transition);
    onSelect({
      type: transition.type,
      duration: duration,
      ...(transition.direction ? { direction: transition.direction } : {})
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-dark-elevated border-slate-800">
        <DialogHeader>
          <DialogTitle>Selecionar Transição</DialogTitle>
          <DialogDescription>
            Escolha como os slides irão transicionar entre si
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Duração (ms)</Label>
            <Input
              type="number"
              min="100"
              max="2000"
              step="50"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {TRANSITION_PRESETS.map((transition) => {
              const Icon = transition.icon;
              const isSelected = selectedTransition.type === transition.type &&
                selectedTransition.direction === transition.direction;

              return (
                <motion.button
                  key={`${transition.type}-${transition.direction || 'none'}`}
                  className={`p-4 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-magenta/20 border-magenta'
                      : 'border-slate-700 hover:border-magenta/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(transition)}
                >
                  <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={transition.preview}
                    transition={{ duration: duration / 1000 }}
                  >
                    <Icon size={24} className={isSelected ? 'text-magenta' : 'text-slate-400'} />
                  </motion.div>
                  <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                    {transition.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Preview area */}
          <div className="mt-6">
            <Label className="mb-2">Preview</Label>
            <div className="aspect-video rounded-lg bg-black/20 border border-slate-700 overflow-hidden flex items-center justify-center">
              <motion.div
                key={`${selectedTransition.type}-${selectedTransition.direction || 'none'}-preview`}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={selectedTransition.preview}
                transition={{ duration: duration / 1000, ease: 'easeInOut' }}
                className="bg-magenta/20 p-4 rounded-lg border border-magenta/30"
              >
                <span className="text-magenta">Exemplo de Transição</span>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
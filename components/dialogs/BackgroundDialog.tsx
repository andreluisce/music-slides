import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion } from 'framer-motion';
import { FileVideo, Image as ImageIcon, MagnifyingGlass } from '@phosphor-icons/react';

interface BackgroundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (background: { type: string; path: string }) => void;
}

export default function BackgroundDialog({ isOpen, onClose, onSelect }: BackgroundDialogProps) {
  const [activeTab, setActiveTab] = useState('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBackgrounds();
    }
  }, [isOpen, activeTab]);

  const loadBackgrounds = async () => {
    setLoading(true);
    try {
      if (activeTab === 'videos') {
        const result = await window.api?.getBackgroundVideos();
        if (result) {
          setVideos(result);
        }
      } else {
        const result = await window.api?.getBackgroundImages();
        if (result) {
          setImages(result);
        }
      }
    } catch (error) {
      console.error('Error loading backgrounds:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[800px] bg-dark-elevated border-slate-800">
        <DialogHeader>
          <DialogTitle>Selecionar Fundo</DialogTitle>
          <DialogDescription>
            Escolha um vídeo ou imagem para usar como fundo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="videos" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <FileVideo size={16} />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Imagens
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          {/* Search removed as we're using local files */}

          <TabsContent value="videos" className="mt-0">
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {loading ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magenta"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  Nenhum vídeo disponível
                </div>
              ) : (
                videos.map((video, index) => {
                  const filename = video.split('/').pop() || '';
                  return (
                    <motion.button
                      key={video}
                      className="aspect-video rounded-lg bg-black/20 hover:bg-black/40 border border-slate-700 hover:border-magenta transition-all flex flex-col items-center justify-center gap-2 p-4"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect({ type: 'video', path: video })}
                    >
                      <FileVideo size={32} className="text-slate-400" />
                      <span className="text-xs text-slate-400 truncate w-full text-center">{filename}</span>
                    </motion.button>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="images" className="mt-0">
            <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {loading ? (
                <div className="col-span-3 flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magenta"></div>
                </div>
              ) : images.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-slate-500">
                  Nenhuma imagem encontrada
                </div>
              ) : (
                images.map((image) => {
                  const filename = image.split('/').pop() || '';
                  return (
                    <motion.button
                      key={image}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-magenta transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect({ type: 'image', path: image })}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={image}
                          alt={filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                          <span className="text-xs text-white truncate block text-center">{filename}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
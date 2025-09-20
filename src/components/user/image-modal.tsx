
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Button } from '../ui/button';
import { ExternalLink } from 'lucide-react';

type ImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageHint: string;
  title?: string;
  alertId: string;
};

export function ImageModal({ isOpen, onClose, imageUrl, imageHint, title = "Screenshot", alertId }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
            <div className="aspect-video w-full">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill
                    data-ai-hint={imageHint}
                    className="object-contain rounded-md"
                />
            </div>
             <Button
                variant="secondary"
                size="sm"
                asChild
                className="absolute -bottom-12 right-0"
            >
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Открыть в новой вкладке
                </a>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

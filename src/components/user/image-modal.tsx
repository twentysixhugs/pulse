
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';

type ImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageHint: string;
  title?: string;
};

export function ImageModal({ isOpen, onClose, imageUrl, imageHint, title = "Screenshot" }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full">
            <Image 
                src={imageUrl} 
                alt={title} 
                fill
                data-ai-hint={imageHint}
                className="object-contain rounded-md"
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}

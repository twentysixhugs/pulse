import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <Flame className="h-6 w-6" />
      <span className="font-headline text-xl font-bold text-foreground">
        PulseScalp
      </span>
    </div>
  );
}

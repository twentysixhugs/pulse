import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export const metadata: Metadata = {
  title: 'TeleTrader Hub',
  description: 'Центральный узел для торговых оповещений и рейтингов сообщества.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={cn('font-body antialiased min-h-screen bg-background', inter.variable, spaceGrotesk.variable, sourceCodePro.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

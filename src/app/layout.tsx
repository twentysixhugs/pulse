
import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';

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
  title: 'PulseScalp',
  description: 'Платформа для торговых оповещений и рейтингов сообщества.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={cn('font-body antialiased min-h-screen bg-background', inter.variable, spaceGrotesk.variable, sourceCodePro.variable)}>
        <Script src="https://telegram.org/js/telegram-web-app.js?59" strategy="beforeInteractive" />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PRISMORA — AI Image Studio',
  description: 'Turn your imagination into beautiful images with PRISMORA AI.',
  applicationName: 'PRISMORA',
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#100d1d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

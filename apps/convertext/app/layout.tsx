import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import '../src/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ConverText - AI-Powered Text Conversion Tool',
  description: 'Transform and convert text using AI-powered workflows and routines',
  keywords: ['text conversion', 'AI', 'text processing', 'workflow automation'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable} suppressHydrationWarning>
      <body
        className="font-sans min-h-screen bg-background antialiased"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}

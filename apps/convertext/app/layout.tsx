import '@draft-gen/ui/src/styles.css';
import '../src/styles/globals.css';
import { AuthProvider } from '../src/components/AuthProvider';
import { ThemeProvider } from '../src/components/ThemeProvider';
import type { Metadata, Viewport } from 'next';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

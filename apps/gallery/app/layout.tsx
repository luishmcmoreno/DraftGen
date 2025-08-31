import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UI Components Gallery',
  description: 'Visual gallery of all UI components',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Lead Tracker',
    default: 'Lead Tracker - Multi-tenant Lead Management System',
  },
  description: 'Powerful multi-tenant lead management system with Kanban boards, task management, and analytics.',
  keywords: ['lead management', 'CRM', 'sales', 'kanban', 'multi-tenant'],
  authors: [{ name: 'Lead Tracker Team' }],
  creator: 'Lead Tracker Team',
  publisher: 'Lead Tracker',
  robots: {
    index: false, // Don't index in development
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://leadtracker.com',
    siteName: 'Lead Tracker',
    title: 'Lead Tracker - Multi-tenant Lead Management System',
    description: 'Powerful multi-tenant lead management system with Kanban boards, task management, and analytics.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lead Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lead Tracker - Multi-tenant Lead Management System',
    description: 'Powerful multi-tenant lead management system with Kanban boards, task management, and analytics.',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

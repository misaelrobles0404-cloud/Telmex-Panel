import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { FacebookPixelWrapper } from '@/components/FacebookPixelWrapper';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
    themeColor: '#0033A0',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: 'TELMEX Panel Pro',
    description: 'Sistema de gestión de ventas TELMEX',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'TELMEX Pro',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <FacebookPixelWrapper />

                    <main className="flex-1 overflow-y-auto lg:ml-64 bg-gray-50">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}

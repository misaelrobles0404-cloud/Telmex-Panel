import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
    themeColor: '#0033A0',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: 'RUIZ TELMEX',
    description: 'Sistema de gestión de ventas TELMEX',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'RUIZ TELMEX',
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
                <ClientLayout>
                    {children}
                </ClientLayout>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js').then(
                                        function(registration) {
                                            console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                        },
                                        function(err) {
                                            console.log('ServiceWorker registration failed: ', err);
                                        }
                                    );
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}

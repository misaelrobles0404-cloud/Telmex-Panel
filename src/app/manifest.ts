import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TELMEX Panel Pro',
        short_name: 'TELMEX Pro',
        description: 'Panel de ventas y gestión para agentes TELMEX',
        start_url: '/',
        display: 'standalone',
        background_color: '#F9FAFB',
        theme_color: '#0033A0',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}

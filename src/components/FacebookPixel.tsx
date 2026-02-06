'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const FacebookPixel = () => {
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loaded) return;

        // Track PageView on route change
        import('react-facebook-pixel')
            .then((x) => x.default)
            .then((ReactPixel) => {
                ReactPixel.pageView();
            });
    }, [pathname, searchParams, loaded]);

    useEffect(() => {
        // Initialize Pixel
        import('react-facebook-pixel')
            .then((x) => x.default)
            .then((ReactPixel) => {
                // REEMPLAZA ESTE ID CON EL TUYO DE META ADS MANAGER
                ReactPixel.init('TU_ID_DE_PIXEL_AQUI');
                ReactPixel.pageView();
                setLoaded(true);
            });
    }, []);

    return null;
};

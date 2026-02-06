'use client';

import { Suspense } from 'react';
import { FacebookPixel } from './FacebookPixel';

export const FacebookPixelWrapper = () => {
    return (
        <Suspense fallback={null}>
            <FacebookPixel />
        </Suspense>
    );
};

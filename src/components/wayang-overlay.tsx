'use client';

/**
 * Wayang Overlay Component
 * Indonesian cultural element - subtle wayang puppet silhouette
 */

import Image from 'next/image';

interface WayangOverlayProps {
    /** Opacity of the overlay (0-1) */
    opacity?: number;
    /** Position: 'left' | 'right' | 'both' */
    position?: 'left' | 'right' | 'both';
}

export function WayangOverlay({
    opacity = 0.15,
    position = 'right',
}: WayangOverlayProps) {
    return (
        <>
            {(position === 'left' || position === 'both') && (
                <div
                    className="absolute bottom-0 left-0 w-48 h-96 md:w-64 md:h-[500px] pointer-events-none z-0"
                    style={{ opacity }}
                >
                    <Image
                        src="/images/wayang.png"
                        alt=""
                        fill
                        className="object-contain object-bottom transform -scale-x-100"
                        priority={false}
                    />
                </div>
            )}
            {(position === 'right' || position === 'both') && (
                <div
                    className="absolute bottom-0 right-0 w-48 h-96 md:w-64 md:h-[500px] pointer-events-none z-0"
                    style={{ opacity }}
                >
                    <Image
                        src="/images/wayang.png"
                        alt=""
                        fill
                        className="object-contain object-bottom"
                        priority={false}
                    />
                </div>
            )}
        </>
    );
}

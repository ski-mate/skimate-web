"use client";

// NOTE: The route-calculation demo (origin/destination picking, skill-level
// routing, closures) was removed. It proxied to a local GraphHopper server
// that does not exist in any environment. Real routing lives in the
// alpline-backend NestJS API: POST /resorts/:resortId/route. If routing is
// ever reintroduced here, proxy to that endpoint — never to a local
// GraphHopper instance.

import React, { useState } from 'react';
import { Map } from '@/components/map-feature/Map';
import { Sidebar } from '@/components/map-feature/Sidebar';
import { RESORTS } from '@/components/map-feature/config';

export default function MapPage() {
    const [resortId, setResortId] = useState<keyof typeof RESORTS>('zermatt');

    const resort = RESORTS[resortId];

    const handleResortChange = (newResortId: string) => {
        setResortId(newResortId as keyof typeof RESORTS);
    };

    return (
        <main className="relative h-screen w-full flex flex-col overflow-hidden">
                        <div className="relative flex-1">
                <Map center={resort.center} zoom={resort.zoom} />

                <Sidebar
                    resortId={resortId}
                    onResortChange={handleResortChange}
                />
            </div>
        </main>
    );
}

"use client";

import React from 'react';
import { RESORTS } from './config';
import { AlplineMark as Mountain, ChevronDown } from '@/components/icons';

interface SidebarProps {
    resortId: string;
    onResortChange: (resortId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ resortId, onResortChange }) => {
    return (
        <div className="absolute top-4 left-4 z-10 w-full max-w-[400px] pointer-events-none">
            <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-6 pointer-events-auto">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Mountain className="text-white w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-xl text-gray-900 tracking-tight">Explore Resorts</h2>
                    </div>
                    <div className="relative group">
                        <select
                            value={resortId}
                            onChange={(e) => onResortChange(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 pr-8 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            {Object.entries(RESORTS).map(([id, resort]) => (
                                <option key={id} value={id}>
                                    {resort.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                    Fly between resorts on an interactive 3D winter map. Drag to pan, scroll to zoom, right-drag to tilt.
                </p>
            </div>
        </div>
    );
};

import React from 'react';

interface ProgressBarProps {
    current: number;
    max: number;
    color: string;
    barMode: 'bar' | 'number' | 'percent';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, color, barMode }) => {
    const pct = Math.min(100, Math.max(0, (current / max) * 100));
    if (barMode === 'number') return <div className="text-right text-xs font-mono -mt-4">{current} / {max}</div>;
    if (barMode === 'percent') return <div className="text-right text-xs font-mono -mt-4">{pct.toFixed(1)}%</div>;
    return (
        <>
            <div className="text-right text-xs font-mono -mt-5 mb-1">{current} / {max}</div>
            <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
            </div>
        </>
    );
};

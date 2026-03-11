import React from 'react';

interface ProgressBarProps {
    current: number;
    max: number;
    color: string;
    label?: string;
    subLabel?: string;
    barMode?: 'bar' | 'number' | 'percent';
    height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
    current, max, color, label, subLabel, barMode = 'bar', height = 'h-2' 
}) => {
    const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
    
    return (
        <div className="w-full">
            {(label || subLabel || barMode !== 'bar') && (
                <div className="flex justify-between items-end mb-1">
                    {label && <span className="text-[10px] text-[#00ff00]/50 uppercase tracking-widest">{label}</span>}
                    <div className="flex gap-2 items-center">
                        {barMode === 'number' && <span className="text-[10px] font-mono">{current} / {max}</span>}
                        {barMode === 'percent' && <span className="text-[10px] font-mono">{pct.toFixed(1)}%</span>}
                        {subLabel && <span className="text-[10px] text-[#00ff00]/70 font-bold">{subLabel}</span>}
                    </div>
                </div>
            )}
            {barMode === 'bar' && (
                <div className={`w-full bg-[#00ff00]/5 ${height} rounded-sm overflow-hidden border border-[#00ff00]/10`}>
                    <div 
                        className={`h-full ${color} transition-all duration-500 shadow-[0_0_10px_rgba(0,255,0,0.2)]`} 
                        style={{ width: `${pct}%` }} 
                    />
                </div>
            )}
        </div>
    );
};

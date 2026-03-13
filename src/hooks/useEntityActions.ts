import React, { useCallback } from 'react';

/**
 * Generic hook for entity actions, supporting players, mercenaries, or pets.
 * Designed for TS 5.8 compatibility.
 */
export function useEntityActions<T extends { 
    id?: string; 
    hp: number; 
    maxHp: number; 
    gold: number; 
    exp: number; 
    maxExp: number; 
    level: number;
    statPoints: number;
    rebornUpgrades?: { statBonus: number };
}>(
    setEntity: React.Dispatch<React.SetStateAction<T>>
) {
    const updateEntity = useCallback((updater: (e: T) => Partial<T>) => {
        setEntity(prev => ({
            ...prev,
            ...updater(prev)
        }));
    }, [setEntity]);

    const addGold = useCallback((amount: number) => {
        updateEntity(e => ({ gold: e.gold + amount } as Partial<T>));
    }, [updateEntity]);

    const addExp = useCallback((
        amount: number, 
        calculateLevelUp: (e: T) => { level: number; exp: number; maxExp: number; statPoints: number; levelsGained: number }
    ) => {
        setEntity(prev => {
            const { level, exp, maxExp, statPoints, levelsGained } = calculateLevelUp({ ...prev, exp: prev.exp + amount });
            return {
                ...prev,
                level,
                exp,
                maxExp,
                statPoints,
                hp: levelsGained > 0 ? prev.maxHp : prev.hp
            };
        });
    }, [setEntity]);

    return {
        updateEntity,
        addGold,
        addExp
    };
}

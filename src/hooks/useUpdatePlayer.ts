import React from 'react';
import { Player, LogType } from '../types';
import { CalculatedStats } from '../logic/stats';

export function useUpdatePlayer(setPlayer: React.Dispatch<React.SetStateAction<Player>>) {
    const updatePlayer = (updater: (p: Player) => Partial<Player>) => {
        setPlayer(prev => ({
            ...prev,
            ...updater(prev)
        }));
    };

    const addGold = (amount: number) => {
        updatePlayer(p => ({ gold: p.gold + amount }));
    };

    const addExp = (amount: number, addLog: (msg: string, type: LogType) => void, stats?: CalculatedStats) => {
        setPlayer(prev => {
            let newExp = prev.exp + amount;
            let newLevel = prev.level;
            let newMaxExp = prev.maxExp;
            let newStatPoints = prev.statPoints;
            let newHp = prev.hp;

            while (newExp >= newMaxExp) {
                newLevel += 1;
                newExp -= newMaxExp;
                // Growth rate: 15% early, 50% mid, 10% late (40+)
                const growthRate = newLevel < 25 ? 1.15 : newLevel < 40 ? 1.5 : 1.1;
                newMaxExp = Math.floor(newMaxExp * growthRate);
                newStatPoints += 3 + (prev.rebornUpgrades?.statBonus || 0);
                newHp = stats?.maxHp || prev.maxHp;
                addLog(`[LEVEL UP] Reached Level ${newLevel}!`, 'success');
            }

            return {
                ...prev,
                level: newLevel,
                exp: newExp,
                maxExp: newMaxExp,
                statPoints: newStatPoints,
                hp: newHp
            };
        });
    };

    return {
        updatePlayer,
        addGold,
        addExp
    };
}

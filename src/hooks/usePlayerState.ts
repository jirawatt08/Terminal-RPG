import { useState } from 'react';
import { Player, PlayerClass, GameState, Enemy } from '../types';
import { generateId } from '../utils';
import { saveRebornRecord, savePlayerData } from '../services/firebase';
import { useUpdatePlayer } from './useUpdatePlayer';

export const INITIAL_PLAYER_STATE: Player = {
    level: 1, exp: 0, maxExp: 100, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    baseAttack: 10, baseDefense: 5, gold: 0, stage: 1, statPoints: 0,
    stats: { str: 5, agi: 5, vit: 5, int: 5, luk: 5 },
    playerClass: 'Novice', inventory: [],
    equipment: { weapon: null, armor: null, accessory: null },
    autoSell: { Common: false, Uncommon: false, Rare: false, Epic: false, Legendary: false, Mythic: false, Divine: false },
    autoSkill: false,
    autoBoss: false,
    inventoryLimit: 20,
    autoSellUnlocked: false,
    autoHealUnlocked: false,
    autoHealEnabled: false,
    autoHealThreshold: 30,
    skillCooldown: 0,
    statusEffects: [],
    settings: { barMode: 'bar', reduceUi: false },
    rebornPoints: 0,
    rebornCount: 0,
    rebornUpgrades: {
        atkBonus: 0, hpBonus: 0, expBonus: 0, goldBonus: 0, statBonus: 0, pointBonus: 0
    },
    potions: [],
    potionMaxBuyUpgrade: 0,
    potionQualityUpgrade: 0,
    quests: [],
    rebornHistory: [],
    monstersKilled: 0,
    bossesKilled: 0
};

export function usePlayerState(addLog: (msg: string, type?: any) => void) {
    const [player, setPlayer] = useState<Player>(INITIAL_PLAYER_STATE);
    const { updatePlayer } = useUpdatePlayer(setPlayer);

    const allocateStat = (stat: keyof Player['stats']) => {
        if (player.statPoints > 0) {
            updatePlayer(p => ({
                statPoints: p.statPoints - 1,
                stats: { ...p.stats, [stat]: p.stats[stat] + 1 }
            }));
        }
    };

    const chooseClass = (cls: PlayerClass) => {
        if (player.level >= 10 && player.playerClass === 'Novice') {
            updatePlayer(() => ({ playerClass: cls }));
            addLog(`Class upgraded to ${cls}!`, 'success');
        } else if (player.level >= 50 && player.stage >= 10 && ['Warrior', 'Rogue', 'Mage'].includes(player.playerClass)) {
            updatePlayer(() => ({ playerClass: cls }));
            addLog(`Tier 2 Class upgraded to ${cls}!`, 'success');
        }
    };

    const reborn = (setGameState: (s: GameState) => void, setCurrentEnemies: (e: Enemy[]) => void) => {
        if (player.level < 20) {
            addLog('Reborn requires Level 20.', 'error');
            return;
        }

        const pointBonusVal = player.rebornUpgrades?.pointBonus || 0;
        const currentLvl = player.level || 1;
        const currentStg = player.stage || 1;
        const pointsEarned = Math.floor((Math.floor(currentLvl / 10) + currentStg) * (1 + pointBonusVal / 100)) || 0;

        const record = {
            id: generateId(),
            uid: player.uid,
            displayName: player.displayName || 'Me',
            photoURL: player.photoURL,
            level: player.level,
            stage: player.stage,
            gold: player.gold,
            rebornCount: player.rebornCount + 1,
            monstersKilled: player.monstersKilled,
            bossesKilled: player.bossesKilled,
            timestamp: new Date()
        };

        if (player.uid) {
            saveRebornRecord(record);
            savePlayerData(player.uid, {
                ...player,
                ...INITIAL_PLAYER_STATE,
                uid: player.uid,
                displayName: player.displayName,
                photoURL: player.photoURL,
                rebornPoints: player.rebornPoints + pointsEarned,
                rebornCount: player.rebornCount + 1,
                rebornUpgrades: player.rebornUpgrades,
                rebornHistory: [...player.rebornHistory, record].slice(-10)
            });
        }

        setPlayer(prev => ({
            ...prev,
            ...INITIAL_PLAYER_STATE,
            uid: prev.uid,
            displayName: prev.displayName,
            photoURL: prev.photoURL,
            rebornPoints: prev.rebornPoints + pointsEarned,
            rebornCount: prev.rebornCount + 1,
            rebornUpgrades: prev.rebornUpgrades,
            rebornHistory: [...prev.rebornHistory, record].slice(-10)
        }));

        setGameState('IDLE');
        setCurrentEnemies([]);
        addLog(`REBORN SUCCESSFUL. Earned ${pointsEarned} Reborn Points. All progress reset.`, 'success');
    };

    const buyRebornUpgrade = (type: keyof Player['rebornUpgrades']) => {
        const costs: Record<keyof Player['rebornUpgrades'], number> = {
            atkBonus: 5, hpBonus: 5, expBonus: 5, goldBonus: 5, statBonus: 5, pointBonus: 10
        };

        const limits: Record<keyof Player['rebornUpgrades'], number> = {
            atkBonus: 1000, hpBonus: 1000, expBonus: 500, goldBonus: 500, statBonus: 20, pointBonus: 200
        };

        const currentVal = player.rebornUpgrades[type] || 0;
        if (currentVal >= limits[type]) {
            addLog(`Upgrade "${type}" has reached its maximum level.`, 'error');
            return;
        }

        const cost = costs[type];
        if (player.rebornPoints < cost) {
            addLog(`Insufficient Reborn Points. Need ${cost}.`, 'error');
            return;
        }

        updatePlayer(p => ({
            rebornPoints: p.rebornPoints - cost,
            rebornUpgrades: {
                ...p.rebornUpgrades,
                [type]: (p.rebornUpgrades[type] || 0) + (type === 'statBonus' ? 1 : 5)
            },
            // Immediately grant a stat point if it's a statBonus upgrade
            statPoints: type === 'statBonus' ? p.statPoints + 1 : p.statPoints
        }));
        addLog(`Upgrade purchased: ${type}.`, 'success');
    };

    return {
        player,
        setPlayer,
        allocateStat,
        chooseClass,
        reborn,
        buyRebornUpgrade
    };
}

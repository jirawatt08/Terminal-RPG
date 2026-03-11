import React from 'react';
import { Player, GameState, Enemy, Quest } from '../types';
import { generateId } from '../utils';
import { useUpdatePlayer } from './useUpdatePlayer';

interface UseVillageActionsProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    gameState: GameState;
    setGameState: (s: GameState) => void;
    addLog: (msg: string, type?: any) => void;
    stats: any;
    setCurrentEnemies: (e: Enemy[]) => void;
}

export function useVillageActions({ 
    player, setPlayer, gameState, setGameState, addLog, stats, setCurrentEnemies 
}: UseVillageActionsProps) {
    const { updatePlayer, addGold, addExp } = useUpdatePlayer(setPlayer);

    const startFarming = () => { 
        if (gameState !== 'DEAD') { 
            setGameState('FARMING'); 
            addLog('Starting auto-farm routine...', 'system'); 
        } 
    };

    const startBossFight = () => {
        if (gameState !== 'DEAD') {
            setGameState('BOSS_FIGHT');
            addLog(`WARNING: Initiating Stage ${player.stage} boss encounter...`, 'warning');
        }
    };

    const startNextBossFight = () => {
        if (gameState !== 'DEAD') {
            setGameState('NEXT_BOSS_FIGHT');
            addLog(`WARNING: Initiating Stage ${player.stage + 1} boss encounter...`, 'warning');
        }
    };

    const stopAction = () => {
        setGameState('IDLE');
        setCurrentEnemies([]);
        addLog('Action halted. Returning to standby.', 'info');
    };

    const enterVillage = () => {
        setGameState('VILLAGE');
        setCurrentEnemies([]);
        addLog('Entering village. Safety protocols active.', 'success');
    };

    const heal = () => {
        const healCost = Math.floor(50 + (player.stage * 10) + (stats.maxHp * 0.05) + (stats.maxMp * 0.05));
        if (player.gold >= healCost && (player.hp < stats.maxHp || player.mp < stats.maxMp)) {
            updatePlayer(p => ({ gold: p.gold - healCost, hp: stats.maxHp, mp: stats.maxMp }));
            addLog(`Executed healing protocol. HP and MP restored. -${healCost} Gold.`, 'success');
        } else if (player.gold < healCost) {
            addLog(`Insufficient funds for healing protocol. Need ${healCost}G.`, 'error');
        } else {
            addLog('HP and MP already at maximum capacity.', 'info');
        }
    };

    const buyPotion = (type: 'exp' | 'coin' | 'luck' | 'health') => {
        const cost = 200 + (player.stage * 100);
        if (player.gold < cost) {
            addLog(`Insufficient funds for potion. Need ${cost}G.`, 'error');
            return;
        }

        const maxPotions = 5 + (player.potionMaxBuyUpgrade * 5);
        const currentStacks = player.potions.find(p => p.type === type)?.duration / 10 || 0;

        if (currentStacks >= maxPotions) {
            addLog(`Max ${type.toUpperCase()} potion stacks reached (${maxPotions}). Upgrade max buy limit in Alchemist tab.`, 'warning');
            return;
        }

        updatePlayer(prev => {
            const existingIdx = prev.potions.findIndex(p => p.type === type);
            const newPotions = [...prev.potions];
            const qualityBonus = 1 + (prev.potionQualityUpgrade * 0.25);
            const potionValue = (50 + (prev.stage * 5)) * qualityBonus;
            const potionDuration = 10;

            if (existingIdx !== -1) {
                const p = newPotions[existingIdx];
                newPotions[existingIdx] = { ...p, duration: p.duration + potionDuration, value: potionValue };
            } else {
                newPotions.push({ type, value: potionValue, duration: potionDuration });
            }

            return { gold: prev.gold - cost, potions: newPotions };
        });
        addLog(`Acquired ${type.toUpperCase()} Potion! Stacks: ${currentStacks + 1}/${maxPotions}`, 'success');
    };

    const buyPotionMaxUpgrade = () => {
        const cost = 5000 * Math.pow(1.8, player.potionMaxBuyUpgrade);
        if (player.potionMaxBuyUpgrade >= 20) {
            addLog('Potion Max Buy limit reached! (Max 20 upgrades)', 'warning');
        } else if (player.gold < cost) {
            addLog(`Need ${Math.floor(cost)}G to upgrade Potion Max Buy limit.`, 'error');
        } else {
            updatePlayer(p => ({ gold: p.gold - cost, potionMaxBuyUpgrade: p.potionMaxBuyUpgrade + 1 }));
            addLog(`Potion Max Buy limit upgraded!`, 'success');
        }
    };

    const buyPotionQualityUpgrade = () => {
        const cost = 10000 * Math.pow(2.2, player.potionQualityUpgrade);
        if (player.potionQualityUpgrade >= 8) {
            addLog('Potion Quality reached maximum! (Max +200%)', 'warning');
        } else if (player.stage < player.potionQualityUpgrade * 10) {
            addLog(`Must reach Stage ${player.potionQualityUpgrade * 10} for next quality upgrade.`, 'warning');
        } else if (player.gold < cost) {
            addLog(`Need ${Math.floor(cost)}G to upgrade Potion Quality.`, 'error');
        } else {
            updatePlayer(p => ({ gold: p.gold - cost, potionQualityUpgrade: p.potionQualityUpgrade + 1 }));
            addLog(`Potion Quality upgraded!`, 'success');
        }
    };

    const acceptQuest = (type: 'kill_monster' | 'kill_boss') => {
        if (player.quests.length >= 6) {
            addLog('Quest board is full! (Max 6)', 'error');
            return;
        }

        const id = generateId();
        const stageMod = 1 + (player.stage * 0.2);
        const targetCount = type === 'kill_monster' ? 10 + (player.stage * 2) : 2 + Math.floor(player.stage / 2);

        const expReward = Math.floor((type === 'kill_monster' ? 500 : 2000) * stageMod);
        const goldReward = Math.floor((type === 'kill_monster' ? 250 : 1000) * stageMod);

        const newQuest: Quest = {
            id,
            name: type === 'kill_monster' ? `Monster Hunt` : `Boss Slayer`,
            description: type === 'kill_monster' ? `Defeat ${targetCount} regular enemies.` : `Defeat ${targetCount} bosses.`,
            requirement: { type, target: targetCount, current: 0 },
            reward: { exp: expReward, gold: goldReward },
            completed: false
        };

        updatePlayer(p => ({ quests: [...p.quests, newQuest] }));
        addLog(`Quest accepted: ${newQuest.name}.`, 'info');
    };

    const completeQuest = (questId: string) => {
        const quest = player.quests.find(q => q.id === questId);
        if (!quest || !quest.completed) return;

        updatePlayer(p => ({ quests: p.quests.filter(q => q.id !== questId) }));
        addGold(quest.reward.gold);
        addExp(quest.reward.exp, addLog, stats);
        addLog(`Quest "${quest.name}" completed! +${quest.reward.exp} EXP | +${quest.reward.gold} Gold`, 'success');
    };

    return {
        startFarming, startBossFight, startNextBossFight, stopAction,
        enterVillage, heal, buyPotion, buyPotionMaxUpgrade, buyPotionQualityUpgrade,
        acceptQuest, completeQuest
    };
}

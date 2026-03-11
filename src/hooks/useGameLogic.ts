import { useEffect, useRef, useMemo } from 'react';
import { useLog } from './useLog';
import { usePlayerState } from './usePlayerState';
import { useFirebaseSync } from './useFirebaseSync';
import { useCombat } from './useCombat';
import { useInventory } from './useInventory';
import { useVillageActions } from './useVillageActions';
import { calculateStats, getEquipmentValue } from '../logic/stats';

export function useGameLogic() {
    const { logs, addLog, logsEndRef, autoScroll, setAutoScroll } = useLog();
    const { player, setPlayer, allocateStat, chooseClass, reborn, buyRebornUpgrade } = usePlayerState(addLog);
    
    const {
        isLoggingIn, showLoginModal, setShowLoginModal, lastSaveTime,
        login, logout, manualSave
    } = useFirebaseSync({ player, setPlayer, addLog });

    const queuedSkillRef = useRef(false);

    // Derived stats (recalculated when player state changes)
    const stats = useMemo(() => calculateStats(player), [player]);

    const {
        gameState, setGameState, currentEnemies, setCurrentEnemies,
        runAway, openSettings, openDashboard, openPatchNotes, showHelp
    } = useCombat({ player, setPlayer, addLog, stats, queuedSkillRef });

    const {
        equipItem, sellItem, toggleItemLock, upgradeItem, sellAllItems
    } = useInventory({ player, setPlayer, addLog, stats });

    const {
        startFarming, startBossFight, startNextBossFight, stopAction,
        enterVillage, heal, buyPotion, buyMaxPotion, buyPotionMaxUpgrade, buyPotionQualityUpgrade,
        acceptQuest, completeQuest
    } = useVillageActions({ 
        player, setPlayer, gameState, setGameState, addLog, stats, setCurrentEnemies 
    });

    useEffect(() => {
        addLog('SYSTEM INITIALIZED. WELCOME TO TERMINAL RPG v2.7', 'system');
        addLog('Type or click commands to begin your process.', 'info');
    }, [addLog]);

    return {
        player,
        setPlayer,
        gameState,
        setGameState,
        currentEnemies,
        logs,
        addLog,
        lastSaveTime,
        autoScroll,
        setAutoScroll,
        stats: {
            ...stats,
            getEquipmentValue,
            rebornHistory: player.rebornHistory,
        },
        actions: {
            startFarming, startBossFight, startNextBossFight, stopAction,
            enterVillage, openSettings, openDashboard, openPatchNotes, runAway, showHelp,
            equipItem, sellItem, upgradeItem, toggleItemLock, sellAllItems, heal, allocateStat,
            chooseClass, manualSave, setShowLoginModal,
            login, logout, buyPotion, buyMaxPotion, acceptQuest, completeQuest,
            buyPotionMaxUpgrade, buyPotionQualityUpgrade,
            reborn: () => reborn(setGameState, setCurrentEnemies),
            buyRebornUpgrade
        },
        showLoginModal,
        isLoggingIn,
        refs: {
            logsEndRef, queuedSkillRef
        }
    };
}

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { usePlayerState } from '../hooks/usePlayerState';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useInventory } from '../hooks/useInventory';
import { useLog } from './LogContext';
import { calculateStats, getEquipmentValue } from '../logic/stats';

type PlayerContextType = {
    player: any;
    setPlayer: any;
    stats: any;
    actions: any;
    showLoginModal: boolean;
    isLoggingIn: boolean;
    lastSaveTime: Date | null;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const { addLog } = useLog();
    const { player, setPlayer, allocateStat, chooseClass, reborn, buyRebornUpgrade } = usePlayerState(addLog);
    
    const {
        isLoggingIn, showLoginModal, setShowLoginModal, lastSaveTime,
        login, logout, manualSave, saveToLocal, exportSave, importSave
    } = useFirebaseSync({ player, setPlayer, addLog });

    const stats = useMemo(() => calculateStats(player), [
        player.level, player.stage, player.stats, player.equipment,
        player.playerClass, player.rebornUpgrades, player.maxHp, player.maxMp,
        player.baseAttack, player.baseDefense, player.potions,
    ]);

    const {
        equipItem, sellItem, toggleItemLock, upgradeItem, sellAllItems
    } = useInventory({ player, setPlayer, addLog, stats });

    const value = useMemo(() => ({
        player,
        setPlayer,
        stats: {
            ...stats,
            getEquipmentValue,
            rebornHistory: player.rebornHistory,
        },
        actions: {
            allocateStat, chooseClass, buyRebornUpgrade,
            login, logout, manualSave, saveToLocal, exportSave, importSave, 
            setShowLoginModal, equipItem, sellItem, upgradeItem, toggleItemLock, 
            sellAllItems,
            reborn: (setGameState: any, setCurrentEnemies: any) => reborn(setGameState, setCurrentEnemies),
        },
        showLoginModal,
        isLoggingIn,
        lastSaveTime
    }), [player, setPlayer, stats, showLoginModal, isLoggingIn, lastSaveTime, allocateStat, chooseClass, buyRebornUpgrade, login, logout, manualSave, saveToLocal, exportSave, importSave, setShowLoginModal, equipItem, sellItem, upgradeItem, toggleItemLock, sellAllItems, reborn]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
    return context;
}

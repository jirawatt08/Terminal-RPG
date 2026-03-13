import React, { createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { useCombat } from '../hooks/useCombat';
import { useVillageActions } from '../hooks/useVillageActions';
import { useLog } from './LogContext';
import { usePlayer } from './PlayerContext';

type CombatContextType = {
    gameState: any;
    setGameState: any;
    currentEnemies: any;
    actions: any;
    refs: {
        queuedSkillRef: React.MutableRefObject<boolean>;
    };
};

const CombatContext = createContext<CombatContextType | null>(null);

export function CombatProvider({ children }: { children: ReactNode }) {
    const { addLog } = useLog();
    const { player, setPlayer, stats } = usePlayer();
    
    const queuedSkillRef = useRef(false);

    const {
        gameState, setGameState, currentEnemies, setCurrentEnemies,
        runAway, openSettings, openDashboard, openPatchNotes, showHelp
    } = useCombat({ player, setPlayer, addLog, stats, queuedSkillRef });

    const {
        startFarming, startBossFight, startNextBossFight, stopAction,
        enterVillage, heal, buyPotion, buyMaxPotion, buyPotionMaxUpgrade, buyPotionQualityUpgrade,
        acceptQuest, completeQuest
    } = useVillageActions({ 
        player, setPlayer, gameState, setGameState, addLog, stats, setCurrentEnemies 
    });

    const value = useMemo(() => ({
        gameState,
        setGameState,
        currentEnemies,
        actions: {
            startFarming, startBossFight, startNextBossFight, stopAction,
            enterVillage, openSettings, openDashboard, openPatchNotes, runAway, showHelp,
            heal, buyPotion, buyMaxPotion, acceptQuest, completeQuest,
            buyPotionMaxUpgrade, buyPotionQualityUpgrade,
        },
        refs: {
            queuedSkillRef
        }
    }), [gameState, setGameState, currentEnemies, startFarming, startBossFight, startNextBossFight, stopAction, enterVillage, openSettings, openDashboard, openPatchNotes, runAway, showHelp, heal, buyPotion, buyMaxPotion, acceptQuest, completeQuest, buyPotionMaxUpgrade, buyPotionQualityUpgrade]);

    return (
        <CombatContext.Provider value={value}>
            {children}
        </CombatContext.Provider>
    );
}

export function useCombatContext() {
    const context = useContext(CombatContext);
    if (!context) throw new Error('useCombat must be used within a CombatProvider');
    return context;
}

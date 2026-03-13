import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { LogProvider, useLog } from './LogContext';
import { PlayerProvider, usePlayer } from './PlayerContext';
import { CombatProvider, useCombatContext } from './CombatContext';

const GameContext = createContext<any>(null);

function GameLogicWrapper({ children }: { children: ReactNode }) {
    const log = useLog();
    const player = usePlayer();
    const combat = useCombatContext();

    const value = useMemo(() => ({
        ...player,
        ...log,
        ...combat,
        actions: {
            ...player.actions,
            ...combat.actions,
            clearLogs: log.clearLogs,
            reborn: () => player.actions.reborn(combat.setGameState, combat.setCurrentEnemies),
        },
        refs: {
            ...log.logsEndRef && { logsEndRef: log.logsEndRef },
            ...combat.refs
        }
    }), [player, log, combat]);

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function GameProvider({ children }: { children: ReactNode }) {
    return (
        <LogProvider>
            <PlayerProvider>
                <CombatProvider>
                    <GameLogicWrapper>
                        {children}
                    </GameLogicWrapper>
                </CombatProvider>
            </PlayerProvider>
        </LogProvider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
}

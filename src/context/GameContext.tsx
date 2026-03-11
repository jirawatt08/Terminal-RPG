import React, { createContext, useContext, ReactNode } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';

type GameContextType = ReturnType<typeof useGameLogic>;

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGameLogic();
  return (
    <GameContext.Provider value={game}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

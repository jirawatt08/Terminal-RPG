import React from 'react';
import { useGame } from './context/GameContext';
import { StatsPanel } from './components/StatsPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { VillagePanel } from './components/VillagePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { LoginModal } from './components/LoginModal';

export default function App() {
  const {
    player, setPlayer,
    gameState, currentEnemies,
    logs, stats, actions, refs,
    showLoginModal, isLoggingIn, lastSaveTime, addLog
  } = useGame();

  return (
    <div className="min-h-screen md:h-screen bg-[#0a0a0a] text-[#00ff00] font-mono p-4 flex flex-col md:flex-row gap-4 selection:bg-[#00ff00] selection:text-black md:overflow-hidden">

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => actions.setShowLoginModal(false)}
        onLogin={actions.login}
        isLoggingIn={isLoggingIn}
      />

      <div className="w-full md:w-1/4 flex flex-col gap-4 md:h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent pr-2 flex-shrink-0">
        <StatsPanel />
        <InventoryPanel />
      </div>

      <div className="w-full md:w-2/4 flex flex-col border border-[#00ff00]/30 bg-[#050505] rounded-sm relative shadow-[0_0_20px_rgba(0,255,0,0.05)] h-[60vh] md:h-full flex-shrink-0">
        {gameState === 'VILLAGE' ? (
          <VillagePanel />
        ) : gameState === 'SETTINGS' ? (
          <SettingsPanel
            player={player}
            setPlayer={setPlayer}
            closeSettings={actions.stopAction}
            manualSave={actions.manualSave}
          />
        ) : gameState === 'DASHBOARD' || gameState === 'PATCHES' ? (
          <DashboardPanel
            onClose={actions.stopAction}
            localRecords={stats.rebornHistory}
            initialView={gameState === 'PATCHES' ? 'PATCHES' : 'GLOBAL'}
          />
        ) : (
          <ConsolePanel
            logs={logs}
            gameState={gameState}
            currentEnemies={currentEnemies}
            logsEndRef={refs.logsEndRef}
            player={player}
            addLog={addLog}
          />
        )}
      </div>

      <ControlsPanel
        player={player}
        setPlayer={setPlayer}
        gameState={gameState}
        stats={stats}
        actions={actions}
        queuedSkillRef={refs.queuedSkillRef}
        isLoggingIn={isLoggingIn}
        lastSaveTime={lastSaveTime}
      />
    </div>
  );
}

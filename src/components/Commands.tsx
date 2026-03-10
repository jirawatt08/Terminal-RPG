import React from 'react';
import { Zap, Play, Skull, Square, ChevronRight, Home, Info } from 'lucide-react';
import { GameState, Player } from '../types';

interface CommandsProps {
  gameState: GameState;
  player: Player;
  maxHp: number;
  maxMp: number;
  startFarming: () => void;
  startBossFight: () => void;
  startNextBossFight: () => void;
  stopAction: () => void;
  runAway: () => void;
  enterVillage: () => void;
  showHelp: () => void;
  heal: () => void;
  classSkill: { name: string; cost: number } | null;
  queuedSkillRef: React.MutableRefObject<boolean>;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
}

export const Commands: React.FC<CommandsProps> = ({
  gameState,
  player,
  maxHp,
  maxMp,
  startFarming,
  startBossFight,
  startNextBossFight,
  stopAction,
  runAway,
  enterVillage,
  showHelp,
  heal,
  classSkill,
  queuedSkillRef,
  setPlayer
}) => {
  return (
    <div className="w-full md:w-1/4 flex flex-col gap-4 md:h-full">
      <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm">
        <h2 className="text-xl font-bold mb-4 border-b border-[#00ff00]/30 pb-2 flex items-center gap-2">
          <Zap size={20} /> COMMANDS
        </h2>
        
        <div className="space-y-3">
          <button 
            onClick={startFarming}
            disabled={gameState === 'FARMING' || gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT'}
            className="w-full flex items-center justify-between p-3 border border-[#00ff00]/50 hover:bg-[#00ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
          >
            <span>./auto_farm</span>
            <Play size={16} />
          </button>

          <button 
            onClick={startBossFight}
            disabled={gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'DEAD'}
            className="w-full flex items-center justify-between p-3 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
          >
            <span>./farm_boss</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-orange-500/70">Stage {player.stage}</span>
              <Skull size={16} />
            </div>
          </button>

          <button 
            onClick={startNextBossFight}
            disabled={gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'DEAD' || player.level < player.stage * 5}
            className="w-full flex items-center justify-between p-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
          >
            <span>./advance</span>
            <div className="flex items-center gap-2">
              {player.level < player.stage * 5 && <span className="text-[10px] text-red-500/70">Lv.{player.stage * 5} Req</span>}
              <Skull size={16} />
            </div>
          </button>

          <div className="flex gap-2">
            <button 
              onClick={stopAction}
              disabled={gameState === 'IDLE' || gameState === 'DEAD'}
              className="flex-1 flex items-center justify-between p-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>^C (Stop)</span>
              <Square size={16} />
            </button>

            <button 
              onClick={runAway}
              disabled={gameState === 'IDLE' || gameState === 'DEAD' || gameState === 'VILLAGE'}
              className="flex-1 flex items-center justify-between p-3 border border-gray-500/50 text-gray-400 hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./run</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            onClick={enterVillage}
            disabled={gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'FARMING'}
            className="w-full flex items-center justify-between p-3 border border-blue-400/50 text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
          >
            <span>./village</span>
            <Home size={16} />
          </button>

          <div className="pt-4 border-t border-gray-800">
            <button 
              onClick={showHelp}
              className="w-full flex items-center justify-between p-3 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left cursor-pointer mb-3"
            >
              <span>./help</span>
              <Info size={16} />
            </button>

            <button 
              onClick={heal}
              disabled={player.gold < 50 || (player.hp >= maxHp && player.mp >= maxMp) || gameState === 'DEAD'}
              className="w-full flex items-center justify-between p-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./heal</span>
              <span className="text-xs">-50G</span>
            </button>
          </div>

          {player.playerClass !== 'Novice' && classSkill && (
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                <span>CLASS SKILL</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={player.autoSkill} 
                    onChange={(e) => setPlayer(p => ({ ...p, autoSkill: e.target.checked }))}
                    className="accent-[#00ff00]"
                  />
                  Auto-cast
                </label>
              </div>
              <button 
                onClick={() => { queuedSkillRef.current = true; }}
                disabled={player.mp < classSkill.cost || gameState === 'DEAD' || gameState === 'IDLE'}
                className="w-full flex items-center justify-between p-3 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
              >
                <span>{classSkill.name}</span>
                <span className="text-xs">-{classSkill.cost} MP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Zap, Play, Skull, Square, ChevronRight, Home, Info, Settings, Trophy, LogIn, LogOut, User } from 'lucide-react';
import { Player, GameState } from '../types';
import { CLASS_SKILLS } from '../constants';

interface ControlsPanelProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    gameState: GameState;
    stats: any;
    actions: any;
    queuedSkillRef: React.MutableRefObject<boolean>;
    isLoggingIn: boolean;
    lastSaveTime: Date | null;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({ player, setPlayer, gameState, stats, actions, queuedSkillRef, isLoggingIn, lastSaveTime }) => {
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    return (
        <div className="w-full md:w-1/4 flex flex-col gap-4 md:h-full">
            <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm">
                <div className="mb-4 border-b border-[#00ff00]/30 pb-2 flex items-center justify-between relative">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Zap size={20} /> COMMANDS
                    </h2>
                    {player.uid ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 hover:bg-[#00ff00]/10 p-1 rounded transition-colors"
                            >
                                {player.photoURL ? (
                                    <img src={player.photoURL} alt="" className="w-6 h-6 rounded-full border border-[#00ff00]/30" referrerPolicy="no-referrer" />
                                ) : (
                                    <User size={16} className="text-[#00ff00]" />
                                )}
                            </button>

                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-[#00ff00]/30 rounded shadow-xl z-20 p-2 text-[10px]">
                                        <div className="px-2 py-1 border-b border-[#00ff00]/10 mb-1 text-gray-500">
                                            LAST SAVE: {lastSaveTime ? lastSaveTime.toLocaleTimeString() : 'NEVER'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                actions.logout();
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-2 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut size={12} /> LOGOUT
                                        </button>
                                        <button
                                            onClick={() => {
                                                actions.logout();
                                                actions.setShowLoginModal(true);
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-2 py-2 hover:bg-[#00ff00]/10 text-[#00ff00] flex items-center gap-2 transition-colors"
                                        >
                                            <User size={12} /> CHANGE ACCOUNT
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => actions.setShowLoginModal(true)}
                            className="text-gray-500 hover:text-[#00ff00] flex items-center gap-1 text-[10px] transition-colors"
                        >
                            <LogIn size={14} /> LOGIN
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={actions.startFarming}
                        disabled={gameState === 'FARMING' || gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT'}
                        className="w-full flex items-center justify-between p-3 border border-[#00ff00]/50 hover:bg-[#00ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                    >
                        <span>./auto_farm</span>
                        <Play size={16} />
                    </button>

                    <button
                        onClick={actions.startBossFight}
                        disabled={gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'DEAD'}
                        className="w-full flex items-center justify-between p-3 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                    >
                        <span>./farm_boss</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-orange-500/70">Stage {player.stage}</span>
                            <Skull size={16} />
                        </div>
                    </button>

                    <div className="flex justify-between items-center px-1 mt-[-8px] mb-2">
                        <span className="text-[10px] text-orange-500/70 uppercase">Auto-Boss Protocol</span>
                        <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-500 hover:text-orange-400 transition-colors">
                            <input
                                type="checkbox"
                                checked={player.autoBoss}
                                onChange={(e) => setPlayer(p => ({ ...p, autoBoss: e.target.checked }))}
                                className="accent-orange-500"
                            />
                            ENABLE
                        </label>
                    </div>

                    <button
                        onClick={actions.startNextBossFight}
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
                            onClick={actions.stopAction}
                            disabled={gameState === 'IDLE' || gameState === 'DEAD'}
                            className="flex-1 flex items-center justify-between p-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                        >
                            <span>^C (Stop)</span>
                            <Square size={16} />
                        </button>

                        <button
                            onClick={actions.runAway}
                            disabled={gameState === 'IDLE' || gameState === 'DEAD' || gameState === 'VILLAGE'}
                            className="flex-1 flex items-center justify-between p-3 border border-gray-500/50 text-gray-400 hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                        >
                            <span>./run</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <button
                        onClick={actions.enterVillage}
                        disabled={gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'FARMING'}
                        className="w-full flex items-center justify-between p-3 border border-blue-400/50 text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                    >
                        <span>./village</span>
                        <Home size={16} />
                    </button>

                    <button
                        onClick={actions.openSettings}
                        disabled={gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'FARMING'}
                        className="w-full flex items-center justify-between p-3 border border-gray-400/50 text-gray-400 hover:bg-gray-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                    >
                        <span>./settings</span>
                        <Settings size={16} />
                    </button>

                    <button
                        onClick={actions.openDashboard}
                        disabled={gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'FARMING'}
                        className="w-full flex items-center justify-between p-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                    >
                        <span>./dashboard</span>
                        <Trophy size={16} />
                    </button>

                    <div className="pt-4 border-t border-gray-800 space-y-3">
                        <button
                            onClick={actions.heal}
                            disabled={player.gold < Math.floor(50 + (player.stage * 10) + (stats.maxHp * 0.05) + (stats.maxMp * 0.05)) || (player.hp >= stats.maxHp && player.mp >= stats.maxMp) || gameState === 'DEAD'}
                            className="w-full flex items-center justify-between p-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                        >
                            <span>./heal</span>
                            <span className="text-xs">-{Math.floor(50 + (player.stage * 10) + (stats.maxHp * 0.05) + (stats.maxMp * 0.05))}G</span>
                        </button>

                        {(player.autoHealUnlocked || player.rebornCount > 0) && (
                            <div className="p-3 border border-green-500/30 bg-green-500/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">Auto-Heal</span>
                                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400 hover:text-green-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={player.autoHealUnlocked}
                                            onChange={(e) => setPlayer(p => ({ ...p, autoHealUnlocked: e.target.checked }))}
                                            className="accent-green-500"
                                        />
                                        ENB
                                    </label>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[8px] text-gray-500 uppercase">
                                        <span>Use at:</span>
                                        <span className="text-green-500">{player.autoHealThreshold}% HP</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="90"
                                        step="5"
                                        disabled={!player.autoHealUnlocked}
                                        value={player.autoHealThreshold}
                                        onChange={(e) => setPlayer(p => ({ ...p, autoHealThreshold: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500 disabled:opacity-30"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={actions.showHelp}
                            className="w-full flex items-center justify-between p-3 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left cursor-pointer"
                        >
                            <span>./help</span>
                            <Info size={16} />
                        </button>
                    </div>

                    {player.playerClass !== 'Novice' && CLASS_SKILLS[player.playerClass] && (
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
                                    Auto
                                </label>
                            </div>
                            <button
                                onClick={() => { queuedSkillRef.current = true; }}
                                disabled={player.mp < CLASS_SKILLS[player.playerClass]!.cost || gameState === 'DEAD' || gameState === 'IDLE'}
                                className="w-full flex items-center justify-between p-3 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                            >
                                <span>{CLASS_SKILLS[player.playerClass]!.name}</span>
                                <span className="text-xs">-{CLASS_SKILLS[player.playerClass]!.cost} MP</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { ChevronRight, Skull } from 'lucide-react';
import { GameState, LogEntry, Enemy, Player } from '../types';
import { TerminalTab } from '../constants';

interface ConsolePanelProps {
    logs: LogEntry[];
    gameState: GameState;
    currentEnemies: Enemy[];
    logsEndRef: React.RefObject<HTMLDivElement>;
    player: Player;
    addLog: (text: string, type?: LogEntry['type']) => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, gameState, currentEnemies, logsEndRef, player, addLog }) => {
    const [activeTab, setActiveTab] = useState<TerminalTab>('ALL');

    const filteredLogs = logs.filter(log => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'FIGHT') return ['combat', 'warning', 'error'].includes(log.type);
        if (activeTab === 'DROP') return log.type === 'loot';
        if (activeTab === 'SELL') return log.type === 'sell';
        return true;
    });

    const showPatchNotes = () => {
        const patchNotes = [
            `[PATCH V1.2] ----------------------------`,
            `- Added Alchemy: Buy potions in village to boost EXP, Gold, or Luck.`,
            `- Added Adventurer's Guild: Accept monster hunt and boss slayer quests.`,
            `- Quests and Potions scale with Stage.`,
            `- Item Locking: Prevent selling of valuable gear.`,
            `- Damage Reduction: New stat for armor to tank more hits.`,
            `- Boss Balance: Reduced OP passives for high-stage bosses.`,
            `-------------------------------------------`
        ];
        patchNotes.reverse().forEach(note => player.uid && logs.find(l => l.text === note) ? null : addLog(note, 'system'));
    };

    return (
        <>
            <div className="bg-[#111] border-b border-[#00ff00]/30 p-2 flex justify-between items-center text-xs text-gray-400">
                <div className="flex gap-2">
                    {(['ALL', 'FIGHT', 'DROP', 'SELL'] as TerminalTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 text-xs font-bold border ${activeTab === tab ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                    <button
                        onClick={showPatchNotes}
                        className="px-3 py-1 text-xs font-bold border border-blue-900 text-blue-400 bg-blue-900/10 hover:bg-blue-900/20"
                    >
                        PATCH_NOTES
                    </button>
                </div>
                <span className="flex items-center gap-2">
                    STATE:
                    <span className={`font-bold ${gameState === 'IDLE' ? 'text-gray-400' :
                        gameState === 'FARMING' ? 'text-green-400' :
                            gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' ? 'text-red-500' : 'text-red-700 animate-pulse'
                        }`}>
                        [{gameState}]
                    </span>
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-mono scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent">
                {filteredLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 leading-relaxed">
                        <span className="text-gray-600 shrink-0">
                            [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                        </span>
                        <span className={`
              ${log.type === 'info' ? 'text-gray-300' : ''}
              ${log.type === 'combat' ? 'text-gray-400' : ''}
              ${log.type === 'loot' ? 'text-blue-400' : ''}
              ${log.type === 'error' ? 'text-red-500' : ''}
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'system' ? 'text-[#00ff00]' : ''}
              ${log.type === 'warning' ? 'text-yellow-400' : ''}
              ${log.type === 'sell' ? 'text-green-600' : ''}
            `}>
                            {log.type === 'system' && '> '}
                            {log.text}
                        </span>
                    </div>
                ))}
                {/* We need to allow passing legacy React ref */}
                <div ref={logsEndRef as any} />
            </div>

            {/* Current Enemy HUD */}
            {currentEnemies.length > 0 && (
                <div className="absolute top-12 right-4 flex flex-col gap-2 w-48">
                    {currentEnemies.map((enemy, idx) => (
                        <div key={enemy.id} className={`border ${idx === 0 ? 'border-red-500' : 'border-red-900/50'} bg-black/80 backdrop-blur p-3 rounded-sm shadow-lg`}>
                            <div className="text-xs text-red-500 font-bold mb-1 flex justify-between">
                                <span className="truncate pr-2">{idx === 0 ? 'TARGET: ' : ''}{enemy.name}</span>
                                {enemy.isBoss && <Skull size={14} className="shrink-0" />}
                            </div>

                            {player.settings.barMode === 'bar' && (
                                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mb-1">
                                    <div
                                        className="bg-red-500 h-full transition-all duration-300"
                                        style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                                    />
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="text-[10px] text-gray-500">
                                    {player.settings.barMode === 'percent'
                                        ? `${Math.max(0, (enemy.hp / enemy.maxHp) * 100).toFixed(1)}% HP`
                                        : `${Math.max(0, enemy.hp)} / ${enemy.maxHp} HP`
                                    }
                                </div>
                                {enemy.skill && (
                                    <div className="text-[9px] text-orange-400">
                                        {enemy.skill.currentCooldown <= 0 ? 'SKILL READY' : `CD: ${enemy.skill.currentCooldown}`}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Command Input Area (Visual only) */}
            <div className="border-t border-[#00ff00]/30 p-3 bg-[#0a0a0a] flex items-center gap-2 text-sm z-10 shrink-0">
                <ChevronRight size={16} className="text-[#00ff00]" />
                <span className="text-[#00ff00] animate-pulse">_</span>
            </div>
        </>
    );
};

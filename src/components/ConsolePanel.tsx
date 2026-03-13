import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLog } from '../context/LogContext';
import { usePlayer } from '../context/PlayerContext';
import { useCombatContext } from '../context/CombatContext';
import { TerminalTab } from '../constants';
import { ProgressBar } from './ProgressBar';
import { Sword, Shield, Zap, Info, Terminal as TerminalIcon } from 'lucide-react';

export const ConsolePanel: React.FC = React.memo(() => {
    const { logs, clearLogs, logsEndRef, autoScroll, setAutoScroll } = useLog();
    const { player, actions: playerActions } = usePlayer();
    const { gameState, currentEnemies, actions: combatActions } = useCombatContext();
    
    const [activeTab, setActiveTab] = useState<TerminalTab>('ALL');
    const [inputValue, setInputValue] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const filteredLogs = logs.filter(log => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'FIGHT') return log.type === 'combat' || log.type === 'warning' || log.type === 'error';
        if (activeTab === 'DROP') return log.type === 'loot';
        if (activeTab === 'SELL') return log.type === 'sell';
        return true;
    });

    const tabs: TerminalTab[] = ['ALL', 'FIGHT', 'DROP', 'SELL'];

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        // If user scrolls up significantly, disable autoScroll
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        if (autoScroll && !isAtBottom) {
            setAutoScroll(false);
        }
    }, [autoScroll, setAutoScroll]);

    // Effect for auto-scrolling
    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [logs, autoScroll, logsEndRef]);

    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = inputValue.trim().toLowerCase();
        if (!cmd) return;

        // Note: addLog is available via useLog() but ConsolePanel usually logs its own command echoes
        // However, addLog is provided by useLog() which we have.
        // But the previous implementation used addLog from useGame().
        // We'll use the one from useLog().
    };
    
    // We need addLog for the command handler
    const { addLog } = useLog();

    const onCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = inputValue.trim().toLowerCase();
        if (!cmd) return;

        addLog(`> ${inputValue}`, 'system');
        setInputValue('');

        const commandRegistry: Record<string, () => void> = {
            'help': () => combatActions.showHelp(),
            'farm': () => combatActions.startFarming(),
            'boss': () => combatActions.startBossFight(),
            'village': () => combatActions.enterVillage(),
            'heal': () => combatActions.heal(),
            'clear': () => clearLogs(),
            'cls': () => clearLogs(),
            'save': () => playerActions.manualSave(),
            'local-save': () => playerActions.saveToLocal(),
            'settings': () => combatActions.openSettings(),
            'dashboard': () => combatActions.openDashboard(),
            'exit': () => combatActions.stopAction(),
            'reborn': () => playerActions.reborn(combatActions.setGameState, combatActions.setCurrentEnemies)
        };

        if (commandRegistry[cmd]) {
            commandRegistry[cmd]();
        } else {
            addLog(`Unknown command: ${cmd}. Type 'help' for commands.`, 'error');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden border border-[#00ff00]/10">
            {/* Header / Tabs */}
            <div className="flex bg-[#00ff00]/5 border-b border-[#00ff00]/20 justify-between items-center pr-2 shrink-0">
                <div className="flex items-center">
                    <div className="px-3 text-[#00ff00]/40">
                        <TerminalIcon size={14} />
                    </div>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === tab ? 'text-[#00ff00] bg-[#00ff00]/10 border-b border-[#00ff00]' : 'text-[#00ff00]/30 hover:text-[#00ff00]/60'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <button 
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`text-[9px] font-bold px-2 py-1 border rounded-sm transition-all ${autoScroll ? 'border-[#00ff00]/40 text-[#00ff00]' : 'border-red-500/40 text-red-500'}`}
                >
                    {autoScroll ? 'SCROLL: ON' : 'SCROLL: OFF'}
                </button>
            </div>

            {/* Enemy HUD (if in combat) */}
            {(gameState === 'FARMING' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT') && currentEnemies.length > 0 && (
                <div className="p-4 bg-[#00ff00]/2 border-b border-[#00ff00]/10 flex flex-col gap-3 animate-in fade-in duration-500 shrink-0">
                    {currentEnemies.map((enemy: any) => (
                        <div key={enemy.id} className="space-y-1">
                            <div className="flex justify-between items-end">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${enemy.isBoss ? 'text-red-500' : 'text-[#00ff00]/80'}`}>
                                    {enemy.name}
                                </span>
                                <span className="text-[10px] text-[#00ff00]/40 font-mono">
                                    {Math.floor(enemy.hp)}/{Math.floor(enemy.maxHp)} HP
                                </span>
                            </div>
                            <ProgressBar 
                                current={enemy.hp} 
                                max={enemy.maxHp} 
                                color={enemy.isBoss ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[#00ff00]/60'} 
                                height="h-1.5"
                                barMode={player.settings.barMode}
                            />
                            
                            {/* Detailed Stats Row */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                <div className="flex items-center gap-1 text-[9px] text-[#00ff00]/60 uppercase font-mono">
                                    <Sword size={10} className="text-[#00ff00]/40" />
                                    <span>{enemy.attack}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-[#00ff00]/60 uppercase font-mono">
                                    <Shield size={10} className="text-[#00ff00]/40" />
                                    <span>{enemy.defense}</span>
                                </div>
                                {enemy.skill && (
                                    <div className="flex items-center gap-1 text-[9px] text-purple-400 uppercase font-mono" title={`${enemy.skill.name}: ${enemy.skill.mult}x Mult`}>
                                        <Zap size={10} className="text-purple-400/40" />
                                        <span>{enemy.skill.name} ({enemy.skill.currentCooldown}/{enemy.skill.cooldown}s)</span>
                                    </div>
                                )}
                                {enemy.passive && (
                                    <div className="flex items-center gap-1 text-[9px] text-cyan-400 uppercase font-mono" title={enemy.passive.description}>
                                        <Info size={10} className="text-cyan-400/40" />
                                        <span>{enemy.passive.type}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Log Output Area - Fixed Height, Scrollable */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 font-mono scrollbar-thin scrollbar-thumb-[#00ff00]/10 bg-black/20"
            >
                <div className="space-y-1">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className="text-xs flex gap-3 group animate-in slide-in-from-left-1 duration-200">
                            <span className="text-[#00ff00]/20 shrink-0 font-light">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
                            <span className={`
                                ${log.type === 'combat' ? 'text-white/90' : ''}
                                ${log.type === 'loot' ? 'text-yellow-400 font-bold' : ''}
                                ${log.type === 'success' ? 'text-[#00ff00]' : ''}
                                ${log.type === 'error' ? 'text-red-500' : ''}
                                ${log.type === 'warning' ? 'text-orange-400' : ''}
                                ${log.type === 'system' ? 'text-cyan-400 italic' : ''}
                                ${log.type === 'sell' ? 'text-gray-400' : ''}
                                ${log.type === 'info' ? 'text-[#00ff00]/60' : ''}
                            `}>
                                <span className="text-[#00ff00]/20 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span>
                                {log.text}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Terminal Input */}
            <form 
                onSubmit={onCommandSubmit}
                className="p-3 border-t border-[#00ff00]/10 bg-black flex items-center gap-2 group shrink-0"
            >
                <span className="text-[#00ff00] animate-pulse font-bold text-sm shrink-0">&gt;</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="ENTER COMMAND_ (HELP for list)"
                    className="flex-1 bg-transparent border-none outline-none text-[#00ff00] text-sm font-mono placeholder-[#00ff00]/20"
                    autoFocus
                />
                <div className="hidden group-focus-within:block text-[10px] text-[#00ff00]/40 font-mono uppercase tracking-tighter">
                    Press Enter to Execute
                </div>
            </form>
        </div>
    );
});


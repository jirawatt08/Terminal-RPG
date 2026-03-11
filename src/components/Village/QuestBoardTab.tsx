import React from 'react';
import { useGame } from '../../context/GameContext';

export const QuestBoardTab: React.FC = () => {
    const { player, actions } = useGame();

    const monsterQuestCount = player.quests.filter(q => q.requirement.type === 'kill_monster').length;
    const bossQuestCount = player.quests.filter(q => q.requirement.type === 'kill_boss').length;

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[#00ff00]/60 text-xs leading-relaxed border-l-2 border-blue-600/50 pl-4 py-1 italic uppercase tracking-tighter">
                Bulletin system synchronized. <br/>
                High-priority elimination targets identified by regional command.
            </p>

            <div className="flex gap-4">
                <button
                    onClick={() => actions.acceptQuest('kill_monster')}
                    disabled={monsterQuestCount >= 3}
                    className="flex-1 py-3 bg-blue-900/10 text-blue-400 border border-blue-900/40 hover:bg-blue-900/20 text-xs font-bold uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                    {monsterQuestCount >= 3 ? 'MONSTER_QUOTA_REACHED' : 'ACCEPT: MONSTER_HUNT'}
                </button>
                <button
                    onClick={() => actions.acceptQuest('kill_boss')}
                    disabled={bossQuestCount >= 3}
                    className="flex-1 py-3 bg-red-900/10 text-red-400 border border-red-900/40 hover:bg-red-900/20 text-xs font-bold uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                    {bossQuestCount >= 3 ? 'BOSS_QUOTA_REACHED' : 'ACCEPT: BOSS_SLAYER'}
                </button>
            </div>

            <div>
                <h3 className="text-[10px] text-[#00ff00]/30 mb-3 font-bold uppercase tracking-widest border-b border-[#00ff00]/5 pb-1">
                    Active Directives ({player.quests.length}/6)
                </h3>
                <div className="space-y-4">
                    {player.quests.map(q => {
                        const progress = (q.requirement.current / q.requirement.target) * 100;
                        return (
                            <div key={q.id} className="border border-[#00ff00]/10 bg-[#00ff00]/2 p-4 flex justify-between items-center group hover:border-[#00ff00]/30 transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-sm font-bold text-[#00ff00] uppercase tracking-widest">{q.name}</h4>
                                        {q.completed && <span className="text-[9px] bg-green-900/30 text-green-400 border border-green-900/50 px-2 py-0.5 rounded-sm uppercase tracking-tighter animate-pulse">TERMINATED</span>}
                                    </div>
                                    <p className="text-[10px] text-[#00ff00]/40 mb-3 uppercase tracking-tighter">{q.description}</p>
                                    
                                    <div className="flex flex-col gap-1.5">
                                        <div className="w-full bg-[#00ff00]/5 h-1 rounded-sm overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${q.completed ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] uppercase tracking-widest">
                                            <span className="text-[#00ff00]/30">Progress: {q.requirement.current}/{q.requirement.target}</span>
                                            <span className="text-yellow-600/80">Reward: {Math.floor(q.reward.exp)} EXP | {Math.floor(q.reward.gold)} Gold</span>
                                        </div>
                                    </div>
                                </div>
                                {q.completed && (
                                    <button
                                        onClick={() => actions.completeQuest(q.id)}
                                        className="ml-6 px-5 py-2 bg-green-600/10 text-green-400 border border-green-600/50 text-[10px] font-bold uppercase tracking-widest hover:bg-green-600/20 transition-all"
                                    >
                                        CLAIM_REWARD
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {player.quests.length === 0 && (
                        <div className="text-[10px] text-[#00ff00]/20 italic py-12 text-center border border-dashed border-[#00ff00]/5 uppercase tracking-widest">
                            No active directives. Awaiting tactical update.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

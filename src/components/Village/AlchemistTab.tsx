import React from 'react';
import { useGame } from '../../context/GameContext';

export const AlchemistTab: React.FC = () => {
    const { player, actions } = useGame();

    const POTIONS = [
        { type: 'exp', name: 'EXP_BOOST.SH', desc: 'Accelerates data acquisition (EXP).' },
        { type: 'coin', name: 'GOLD_MINER.SH', desc: 'Optimizes gold retrieval protocols.' },
        { type: 'luck', name: 'LUCK_GEN.EXE', desc: 'Increases loot drop probability.' },
        { type: 'health', name: 'NANO_REPAIR.KIT', desc: 'Instant 30% HP restoration.' }
    ] as const;

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[#00ff00]/60 text-xs leading-relaxed border-l-2 border-green-600/50 pl-4 py-1 italic uppercase tracking-tighter">
                Chemical synthesis unit operational. <br/>
                Temporary stat enhancements available for field operations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {POTIONS.map(p => {
                    const maxPotions = 5 + (player.potionMaxBuyUpgrade * 5);
                    const currentStacks = player.potions.find(pot => pot.type === p.type)?.duration / 10 || 0;
                    const cost = 200 + (player.stage * 100);
                    const canAfford = player.gold >= cost;
                    const isFull = currentStacks >= maxPotions;

                    return (
                        <div key={p.type} className="border border-[#00ff00]/20 bg-[#00ff00]/5 p-4 flex flex-col justify-between hover:border-green-600/30 transition-all">
                            <div>
                                <h3 className="text-sm font-bold text-green-600 tracking-widest uppercase mb-1">{p.name}</h3>
                                <p className="text-[10px] text-[#00ff00]/50 uppercase tracking-tighter mb-4">{p.desc}</p>
                                <div className="text-[10px] text-green-600/60 uppercase mb-4">
                                    Buffer: {currentStacks}/{maxPotions}
                                </div>
                            </div>
                            <button
                                onClick={() => actions.buyPotion(p.type)}
                                disabled={!canAfford || isFull}
                                className={`w-full py-2 border transition-all text-[10px] font-bold uppercase tracking-widest ${!canAfford || isFull ? 'border-gray-800 text-gray-800 opacity-30 cursor-not-allowed' : 'border-green-600 text-green-600 hover:bg-green-600/10'}`}
                            >
                                {isFull ? 'BUFFER_FULL' : `BUY (${cost}G)`}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#00ff00]/5">
                <div className="border border-[#00ff00]/10 bg-[#00ff00]/2 p-4 rounded-sm flex flex-col justify-between hover:border-purple-600/30 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-purple-600 tracking-widest uppercase mb-1">BUFFER_EXPANSION.EXE</h3>
                        <p className="text-[10px] text-[#00ff00]/50 uppercase tracking-tighter mb-4">Increases max stack limit for all synthesized potions.</p>
                        <div className="text-[10px] text-purple-600/60 uppercase mb-4">
                            Current: {5 + (player.potionMaxBuyUpgrade * 5)} | Iteration: {player.potionMaxBuyUpgrade}/20
                        </div>
                    </div>
                    <button
                        onClick={actions.buyPotionMaxUpgrade}
                        disabled={player.gold < (5000 * Math.pow(1.8, player.potionMaxBuyUpgrade)) || player.potionMaxBuyUpgrade >= 20}
                        className="w-full py-2 bg-purple-600/5 text-purple-600 border border-purple-600/40 hover:bg-purple-600/10 text-[10px] font-bold uppercase tracking-widest disabled:opacity-20"
                    >
                        Upgrade ({Math.floor(5000 * Math.pow(1.8, player.potionMaxBuyUpgrade))}G)
                    </button>
                </div>

                <div className="border border-[#00ff00]/10 bg-[#00ff00]/2 p-4 rounded-sm flex flex-col justify-between hover:border-blue-600/30 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-blue-600 tracking-widest uppercase mb-1">SYNTH_PURITY.SYS</h3>
                        <p className="text-[10px] text-[#00ff00]/50 uppercase tracking-tighter mb-4">Increases potency and duration of all chemical effects.</p>
                        <div className="text-[10px] text-blue-600/60 uppercase mb-4">
                            Purity: +{player.potionQualityUpgrade * 25}% | Stage Req: {player.potionQualityUpgrade * 10 || 1}
                        </div>
                    </div>
                    <button
                        onClick={actions.buyPotionQualityUpgrade}
                        disabled={player.gold < (10000 * Math.pow(2.2, player.potionQualityUpgrade)) || player.potionQualityUpgrade >= 8 || player.stage < (player.potionQualityUpgrade * 10)}
                        className="w-full py-2 bg-blue-600/5 text-blue-600 border border-blue-600/40 hover:bg-blue-600/10 text-[10px] font-bold uppercase tracking-widest disabled:opacity-20"
                    >
                        Upgrade ({Math.floor(10000 * Math.pow(2.2, player.potionQualityUpgrade))}G)
                    </button>
                </div>
            </div>

            {player.potions.length > 0 && (
                <div className="animate-in slide-in-from-top-2">
                    <h3 className="text-[10px] text-[#00ff00]/30 mb-3 font-bold uppercase tracking-widest border-b border-[#00ff00]/5 pb-1">Active Synthesis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {player.potions.map((p, idx) => (
                            <div key={idx} className="bg-[#00ff00]/5 border border-[#00ff00]/10 p-2 flex justify-between items-center rounded-sm">
                                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">{p.type}</span>
                                <span className="text-[10px] text-[#00ff00]/40 font-mono tracking-widest">{Math.floor(p.duration)}x</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

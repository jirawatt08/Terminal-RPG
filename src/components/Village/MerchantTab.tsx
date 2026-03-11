import React from 'react';
import { useGame } from '../../context/GameContext';
import { Rarity, Item } from '../../types';
import { RARITY_COLORS } from '../../constants';
import { Lock, Unlock } from 'lucide-react';

export const MerchantTab: React.FC = () => {
    const { player, setPlayer, actions, addLog, stats } = useGame();

    const buyExpansion = () => {
        if (player.gold >= 500) {
            setPlayer(p => ({ ...p, gold: p.gold - 500, inventoryLimit: p.inventoryLimit + 10 }));
            addLog('Purchased Inventory Expansion!', 'success');
        }
    };

    const buyAutoSell = () => {
        if (player.gold >= 1000) {
            setPlayer(p => ({ ...p, gold: p.gold - 1000, autoSellUnlocked: true }));
            addLog('Purchased Auto-Sell Protocol!', 'success');
        }
    };

    const buyAutoHeal = () => {
        if (player.gold >= 2500) {
            setPlayer(p => ({ ...p, gold: p.gold - 2500, autoHealUnlocked: true }));
            addLog('Purchased Auto-Heal Protocol!', 'success');
        }
    };

    const toggleAutoSellRarity = (r: Rarity) => {
        setPlayer(p => ({ ...p, autoSell: { ...p.autoSell, [r]: !p.autoSell[r] } }));
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#00ff00]/20 bg-[#00ff00]/5 p-4 rounded-sm flex flex-col justify-between hover:border-yellow-600/30 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-yellow-600 tracking-widest uppercase mb-1">STORAGE_UPGRADE.EXE</h3>
                        <p className="text-[10px] text-[#00ff00]/50 uppercase tracking-tighter mb-4">Increases inventory capacity by 10 units.</p>
                        <div className="text-[10px] text-yellow-600/60 uppercase mb-4">Current: {player.inventoryLimit} Units</div>
                    </div>
                    <button
                        onClick={buyExpansion}
                        disabled={player.gold < 500}
                        className="w-full py-2 bg-yellow-600/10 text-yellow-600 border border-yellow-600/40 hover:bg-yellow-600/20 text-xs font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Buy (500G)
                    </button>
                </div>

                <div className="border border-[#00ff00]/20 bg-[#00ff00]/5 p-4 rounded-sm flex flex-col justify-between hover:border-yellow-600/30 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-yellow-600 tracking-widest uppercase mb-1">AUTO_LIQUIDATE.SYS</h3>
                        <p className="text-[10px] text-[#00ff00]/50 uppercase tracking-tighter mb-4">Enables automated item-to-gold conversion.</p>
                        <div className="text-[10px] text-yellow-600/60 uppercase mb-4">Status: {player.autoSellUnlocked ? 'ONLINE' : 'LOCKED'}</div>
                    </div>
                    {!player.autoSellUnlocked ? (
                        <button
                            onClick={buyAutoSell}
                            disabled={player.gold < 1000}
                            className="w-full py-2 bg-yellow-600/10 text-yellow-600 border border-yellow-600/40 hover:bg-yellow-600/20 text-xs font-bold uppercase tracking-widest disabled:opacity-30"
                        >
                            Buy (1000G)
                        </button>
                    ) : (
                        <div className="text-center py-2 text-[10px] text-[#00ff00]/40 font-bold border border-[#00ff00]/10 uppercase tracking-widest">OWNED</div>
                    )}
                </div>

                <div className="border border-[#00ff00]/20 bg-[#00ff00]/5 p-4 rounded-sm flex flex-col justify-between hover:border-yellow-600/30 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-yellow-600 tracking-widest uppercase mb-1">BIO_REGEN.MD</h3>
                        <p className="text-[10px] text-[#00ff00]/50 uppercase tracking-tighter mb-4">Automated potion administration during combat.</p>
                        <div className="text-[10px] text-yellow-600/60 uppercase mb-4">Status: {player.autoHealUnlocked ? 'ONLINE' : 'LOCKED'}</div>
                    </div>
                    {!player.autoHealUnlocked ? (
                        <button
                            onClick={buyAutoHeal}
                            disabled={player.gold < 2500}
                            className="w-full py-2 bg-yellow-600/10 text-yellow-600 border border-yellow-600/40 hover:bg-yellow-600/20 text-xs font-bold uppercase tracking-widest disabled:opacity-30"
                        >
                            Buy (2500G)
                        </button>
                    ) : (
                        <div className="text-center py-2 text-[10px] text-[#00ff00]/40 font-bold border border-[#00ff00]/10 uppercase tracking-widest">OWNED</div>
                    )}
                </div>
            </div>

            {player.autoSellUnlocked && (
                <div className="border border-[#00ff00]/10 bg-[#00ff00]/2 p-4 rounded-sm animate-in slide-in-from-top-2">
                    <h3 className="text-[10px] text-[#00ff00]/40 mb-3 font-bold uppercase tracking-widest border-b border-[#00ff00]/5 pb-1">Auto-Sell Filters</h3>
                    <div className="flex flex-wrap gap-2">
                        {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine'] as Rarity[]).map(r => (
                            <button
                                key={r}
                                onClick={() => toggleAutoSellRarity(r)}
                                className={`text-[9px] px-3 py-1 border transition-all uppercase tracking-widest ${player.autoSell[r]
                                    ? 'bg-[#00ff00]/20 border-[#00ff00]/60 text-[#00ff00]'
                                    : 'border-[#00ff00]/10 text-[#00ff00]/30 hover:border-[#00ff00]/30 hover:text-[#00ff00]/50'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {player.autoHealUnlocked && (
                <div className="border border-[#00ff00]/10 bg-[#00ff00]/2 p-4 rounded-sm animate-in slide-in-from-top-2">
                    <h3 className="text-[10px] text-[#00ff00]/40 mb-3 font-bold uppercase tracking-widest border-b border-[#00ff00]/5 pb-1">Regen Threshold</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center text-[10px] text-[#00ff00]/60 uppercase tracking-widest">
                            <span>Target Vitality: {player.autoHealThreshold}% HP</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="90"
                            step="5"
                            value={player.autoHealThreshold}
                            onChange={(e) => setPlayer(p => ({ ...p, autoHealThreshold: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-[#00ff00]/10 rounded-lg appearance-none cursor-pointer accent-[#00ff00] hover:bg-[#00ff00]/20 transition-all"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center border-b border-[#00ff00]/5 pb-1 mb-3">
                <h3 className="text-[10px] text-[#00ff00]/30 font-bold uppercase tracking-widest">Liquidate Assets</h3>
                <button
                    onClick={actions.sellAllItems}
                    disabled={player.inventory.filter(i => !i.locked).length === 0}
                    className="text-[9px] font-bold text-red-500/60 hover:text-red-500 border border-red-500/20 hover:border-red-500/40 px-2 py-0.5 transition-all uppercase tracking-tighter disabled:opacity-20"
                >
                    Sell_All_Unlocked
                </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#00ff00]/10">
                {player.inventory.map(item => (
                    <div key={item.id} className="border border-[#00ff00]/10 bg-[#00ff00]/2 p-3 flex justify-between items-center group hover:border-[#00ff00]/20 transition-all">
                        <div className="flex-1">
                            <div className={`text-sm font-bold ${RARITY_COLORS[item.rarity]} flex items-center gap-2 uppercase tracking-widest`}>
                                {item.name} {item.upgradeLevel && item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}
                                {item.locked && <Lock size={10} className="text-red-500/80" />}
                            </div>
                            <div className="text-[9px] text-[#00ff00]/40 flex items-center gap-3 uppercase tracking-tighter">
                                <span className="font-bold text-[#00ff00]/60">+{item.value} {item.type === 'Weapon' ? 'ATK' : 'DEF'}</span>
                                {item.stats && (
                                    <div className="flex gap-2 opacity-60">
                                        {Object.entries(item.stats).map(([s, v]) => (
                                            <span key={s}>{s}:{v}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => actions.toggleItemLock(item)}
                                className={`p-1.5 border transition-all ${item.locked ? 'border-red-500/40 text-red-500 bg-red-500/5' : 'border-[#00ff00]/10 text-[#00ff00]/30 hover:border-[#00ff00]/40 hover:text-[#00ff00]/60'}`}
                            >
                                {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>
                            <button
                                onClick={() => actions.sellItem(item)}
                                disabled={item.locked}
                                className="px-4 py-1.5 bg-[#00ff00]/5 hover:bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/30 rounded-sm text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                SELL ({item.sellPrice}G)
                            </button>
                        </div>
                    </div>
                ))}
                {player.inventory.length === 0 && (
                    <div className="text-[10px] text-[#00ff00]/20 italic py-8 text-center border border-dashed border-[#00ff00]/5">Inventory clear. No assets found.</div>
                )}
            </div>
        </div>
    );
};

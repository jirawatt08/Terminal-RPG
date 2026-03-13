import React from 'react';
import { useGame } from '../../context/GameContext';
import { Item, EquippableItem } from '../../types';
import { RARITY_COLORS } from '../../constants';

export const BlacksmithTab: React.FC = () => {
    const { player, stats, actions } = useGame();

    const renderItem = (item: Item, isEquipped: boolean) => {
        if (item.category !== 'Equippable') return null;
        const equippable = item as EquippableItem;
        const currentLevel = equippable.upgradeLevel || 0;
        const cost = Math.floor(equippable.value * 0.5 * Math.pow(1.5, currentLevel));
        const canAfford = player.gold >= cost;

        return (
            <div key={equippable.id} className="border border-[#00ff00]/10 bg-[#00ff00]/5 p-3 flex justify-between items-center group hover:border-[#00ff00]/30 transition-all">
                <div>
                    <div className={`text-sm font-bold ${RARITY_COLORS[equippable.rarity]} tracking-widest uppercase`}>
                        {equippable.name} {currentLevel > 0 ? `+${currentLevel}` : ''}
                    </div>
                    <div className="text-[10px] text-[#00ff00]/40 uppercase tracking-tighter">
                        Base Value: {Math.floor(stats.getEquipmentValue(equippable))}
                    </div>
                </div>
                <button
                    onClick={() => actions.upgradeItem(equippable, isEquipped)}
                    disabled={!canAfford}
                    className={`px-3 py-1 border transition-all text-[10px] font-bold uppercase tracking-widest ${canAfford ? 'border-yellow-600 text-yellow-600 hover:bg-yellow-600/10' : 'border-gray-800 text-gray-800 opacity-50 cursor-not-allowed'}`}
                >
                    UPGRADE ({cost}G)
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[#00ff00]/60 text-xs leading-relaxed border-l-2 border-yellow-600/50 pl-4 py-1 italic uppercase tracking-tighter">
                Calibration unit online. Enhancing equipment structural integrity. <br/>
                Efficiency increases by 20% per iteration.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-[10px] text-[#00ff00]/30 mb-3 font-bold uppercase tracking-widest border-b border-[#00ff00]/5 pb-1">Equipped Modules</h3>
                    <div className="space-y-2">
                        {Object.values(player.equipment).filter(Boolean).map(item => renderItem(item as Item, true))}
                        {!Object.values(player.equipment).some(Boolean) && (
                            <div className="text-[10px] text-[#00ff00]/20 italic py-4 text-center border border-dashed border-[#00ff00]/5">No modules detected.</div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] text-[#00ff00]/30 mb-3 font-bold uppercase tracking-widest border-b border-[#00ff00]/5 pb-1">Storage Buffer</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#00ff00]/10">
                        {player.inventory.length > 0 ? (
                            player.inventory.map(item => renderItem(item, false))
                        ) : (
                            <div className="text-[10px] text-[#00ff00]/20 italic py-4 text-center border border-dashed border-[#00ff00]/5">Buffer empty.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

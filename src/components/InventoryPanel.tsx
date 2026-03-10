import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Player, Item, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';

interface InventoryPanelProps {
    player: Player;
    equipItem: (item: Item) => void;
    getEquipmentValue: (item: Item | null) => number;
}

const RARITY_WEIGHT: Record<Rarity, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, Mythic: 6, Divine: 7 };

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ player, equipItem, getEquipmentValue }) => {
    const [inventorySort, setInventorySort] = useState<'STAT' | 'RARITY' | 'NAME'>('STAT');

    const sortedInventory = [...player.inventory].sort((a, b) => {
        if (inventorySort === 'NAME') {
            return a.name.localeCompare(b.name);
        } else if (inventorySort === 'STAT') {
            const valA = getEquipmentValue(a);
            const valB = getEquipmentValue(b);
            if (valA !== valB) return valB - valA;
            return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
        } else {
            if (RARITY_WEIGHT[a.rarity] !== RARITY_WEIGHT[b.rarity]) return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
            return getEquipmentValue(b) - getEquipmentValue(a);
        }
    });

    return (
        <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm flex-1">
            <h2 className="text-xl font-bold mb-4 border-b border-[#00ff00]/30 pb-2 flex items-center gap-2">
                <Package size={20} /> INVENTORY
            </h2>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs text-gray-500">ITEMS ({player.inventory.length}/{player.inventoryLimit})</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setInventorySort('STAT')}
                            className={`text-[10px] px-2 py-0.5 border ${inventorySort === 'STAT' ? 'border-[#00ff00] text-[#00ff00]' : 'border-gray-700 text-gray-500'}`}
                        >
                            STAT
                        </button>
                        <button
                            onClick={() => setInventorySort('RARITY')}
                            className={`text-[10px] px-2 py-0.5 border ${inventorySort === 'RARITY' ? 'border-[#00ff00] text-[#00ff00]' : 'border-gray-700 text-gray-500'}`}
                        >
                            RARITY
                        </button>
                        <button
                            onClick={() => setInventorySort('NAME')}
                            className={`text-[10px] px-2 py-0.5 border ${inventorySort === 'NAME' ? 'border-[#00ff00] text-[#00ff00]' : 'border-gray-700 text-gray-500'}`}
                        >
                            NAME
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    {sortedInventory.length === 0 && <div className="text-gray-600 text-xs text-center py-4">EMPTY</div>}
                    {sortedInventory.map(item => (
                        <div key={item.id} className="border border-gray-800 p-2 text-xs group hover:border-[#00ff00]/50 transition-colors">
                            <div className="flex justify-between mb-1">
                                <span className={RARITY_COLORS[item.rarity]}>
                                    <span className="text-gray-500 mr-1">[{item.type.substring(0, 3).toUpperCase()}]</span>
                                    {item.name} {item.upgradeLevel && item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}
                                </span>
                                <span className="text-gray-400">+{item.value} {item.type === 'Weapon' ? 'ATK' : 'DEF'}</span>
                            </div>
                            {item.effect && <div className="text-[10px] text-blue-400 mb-1">+{item.effect.value}% {item.effect.type}</div>}
                            <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-yellow-500">{item.sellPrice}G</span>
                                <div className="flex gap-2">
                                    <button onClick={() => equipItem(item)} className="px-2 py-1 bg-[#00ff00]/10 hover:bg-[#00ff00]/30 text-[#00ff00] rounded cursor-pointer">Equip</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

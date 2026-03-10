import React, { useState } from 'react';
import { Home, Lock, Unlock } from 'lucide-react';
import { Player, Item, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';

interface VillagePanelProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addLog: (text: string, type?: 'info' | 'combat' | 'loot' | 'error' | 'success' | 'system' | 'warning' | 'sell') => void;
    getEquipmentValue: (item: Item | null) => number;
    upgradeItem: (item: Item, isEquipped: boolean) => void;
    sellItem: (item: Item) => void;
    toggleItemLock: (item: Item) => void;
}

export const VillagePanel: React.FC<VillagePanelProps> = ({ player, setPlayer, addLog, getEquipmentValue, upgradeItem, sellItem, toggleItemLock }) => {
    const [villageTab, setVillageTab] = useState<'BLACKSMITH' | 'MERCHANT'>('BLACKSMITH');

    return (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center gap-3 mb-4 border-b border-[#00ff00]/30 pb-4">
                <Home className="text-yellow-500" size={24} />
                <h2 className="text-xl font-bold text-yellow-500 tracking-wider">VILLAGE</h2>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setVillageTab('BLACKSMITH')}
                    className={`flex-1 py-2 text-sm font-bold border ${villageTab === 'BLACKSMITH' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                    BLACKSMITH
                </button>
                <button
                    onClick={() => setVillageTab('MERCHANT')}
                    className={`flex-1 py-2 text-sm font-bold border ${villageTab === 'MERCHANT' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                    MERCHANT
                </button>
            </div>

            {villageTab === 'BLACKSMITH' && (
                <>
                    <p className="text-gray-400 mb-6 text-sm">Upgrade your items here. Upgrading increases the base value of the item by 20% per level.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm text-gray-500 mb-3 font-bold">EQUIPPED ITEMS</h3>
                            <div className="space-y-2">
                                {Object.values(player.equipment).map(item => {
                                    const i = item as Item | null;
                                    return i && (
                                        <div key={i.id} className="border border-gray-800 bg-black p-3 flex justify-between items-center">
                                            <div>
                                                <div style={{ color: RARITY_COLORS[i.rarity].replace('text-', '') }} className={`text-sm font-bold ${RARITY_COLORS[i.rarity]}`}>
                                                    {i.name} {i.upgradeLevel && i.upgradeLevel > 0 ? `+${i.upgradeLevel}` : ''}
                                                </div>
                                                <div className="text-xs text-gray-500">Value: {getEquipmentValue(i)}</div>
                                            </div>
                                            <button
                                                onClick={() => upgradeItem(i, true)}
                                                disabled={player.gold < Math.floor(i.value * 0.5 * Math.pow(1.5, i.upgradeLevel || 0))}
                                                className="px-3 py-1 bg-yellow-900/30 text-yellow-500 border border-yellow-900 hover:bg-yellow-900/50 disabled:opacity-50 text-xs"
                                            >
                                                Upgrade ({Math.floor(i.value * 0.5 * Math.pow(1.5, i.upgradeLevel || 0))}G)
                                            </button>
                                        </div>
                                    )
                                })}
                                {!player.equipment.weapon && !player.equipment.armor && !player.equipment.accessory && (
                                    <div className="text-xs text-gray-600 italic">No items equipped.</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm text-gray-500 mb-3 font-bold">INVENTORY ITEMS</h3>
                            <div className="space-y-2">
                                {player.inventory.map(item => (
                                    <div key={item.id} className="border border-gray-800 bg-black p-3 flex justify-between items-center">
                                        <div>
                                            <div style={{ color: RARITY_COLORS[item.rarity].replace('text-', '') }} className={`text-sm font-bold ${RARITY_COLORS[item.rarity]}`}>
                                                {item.name} {item.upgradeLevel && item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}
                                            </div>
                                            <div className="text-xs text-gray-500">Value: {getEquipmentValue(item)}</div>
                                        </div>
                                        <button
                                            onClick={() => upgradeItem(item, false)}
                                            disabled={player.gold < Math.floor(item.value * 0.5 * Math.pow(1.5, item.upgradeLevel || 0))}
                                            className="px-3 py-1 bg-yellow-900/30 text-yellow-500 border border-yellow-900 hover:bg-yellow-900/50 disabled:opacity-50 text-xs"
                                        >
                                            Upgrade ({Math.floor(item.value * 0.5 * Math.pow(1.5, item.upgradeLevel || 0))}G)
                                        </button>
                                    </div>
                                ))}
                                {player.inventory.length === 0 && (
                                    <div className="text-xs text-gray-600 italic">Inventory is empty.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {villageTab === 'MERCHANT' && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="border border-yellow-900/50 bg-black p-4">
                            <h3 className="text-yellow-500 font-bold mb-2">Inventory Expansion</h3>
                            <p className="text-xs text-gray-400 mb-4">+10 Inventory Slots. Current Limit: {player.inventoryLimit}</p>
                            <button
                                onClick={() => {
                                    if (player.gold >= 500) {
                                        setPlayer(p => ({ ...p, gold: p.gold - 500, inventoryLimit: p.inventoryLimit + 10 }));
                                        addLog('Purchased Inventory Expansion!', 'success');
                                    }
                                }}
                                disabled={player.gold < 500}
                                className="w-full py-2 bg-yellow-900/30 text-yellow-500 border border-yellow-900 hover:bg-yellow-900/50 disabled:opacity-50 text-sm"
                            >
                                Buy (500G)
                            </button>
                        </div>

                        <div className="border border-yellow-900/50 bg-black p-4">
                            <h3 className="text-yellow-500 font-bold mb-2">Auto-Sell Protocol</h3>
                            <p className="text-xs text-gray-400 mb-4">Automatically sell looted items based on rarity filter.</p>
                            {player.autoSellUnlocked ? (
                                <div className="text-green-500 text-sm font-bold text-center py-2">UNLOCKED</div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (player.gold >= 1000) {
                                            setPlayer(p => ({ ...p, gold: p.gold - 1000, autoSellUnlocked: true }));
                                            addLog('Purchased Auto-Sell Protocol!', 'success');
                                        }
                                    }}
                                    disabled={player.gold < 1000}
                                    className="w-full py-2 bg-yellow-900/30 text-yellow-500 border border-yellow-900 hover:bg-yellow-900/50 disabled:opacity-50 text-sm"
                                >
                                    Buy (1000G)
                                </button>
                            )}
                        </div>
                    </div>

                    {player.autoSellUnlocked && (
                        <div className="border border-gray-800 bg-black p-4">
                            <h3 className="text-sm font-bold mb-2 text-gray-400">AUTO-SELL FILTER</h3>
                            <div className="flex flex-wrap gap-2">
                                {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine'] as Rarity[]).map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setPlayer(p => ({ ...p, autoSell: { ...p.autoSell, [r]: !p.autoSell[r] } }))}
                                        className={`text-xs px-3 py-1 border rounded transition-colors cursor-pointer ${player.autoSell[r]
                                            ? 'bg-[#00ff00]/20 border-[#00ff00] text-[#00ff00]'
                                            : 'border-gray-700 text-gray-500 hover:border-gray-500'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm text-gray-500 mb-3 font-bold">SELL ITEMS</h3>
                        <div className="space-y-2">
                            {player.inventory.map(item => (
                                <div key={item.id} className="border border-gray-800 bg-black p-3 flex justify-between items-center group">
                                    <div>
                                        <div style={{ color: RARITY_COLORS[item.rarity].replace('text-', '') }} className={`text-sm font-bold ${RARITY_COLORS[item.rarity]} flex items-center gap-2`}>
                                            {item.name} {item.upgradeLevel && item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}
                                            {item.locked && <Lock size={12} className="text-red-500" />}
                                        </div>
                                        <div className="text-xs text-gray-500">Value: {getEquipmentValue(item)}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleItemLock(item)}
                                            className={`p-1 border ${item.locked ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-gray-700 text-gray-500 hover:border-[#00ff00]'}`}
                                        >
                                            {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                        </button>
                                        <button
                                            onClick={() => sellItem(item)}
                                            disabled={item.locked}
                                            className="px-4 py-1 bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/50 rounded text-sm cursor-pointer disabled:opacity-50"
                                        >
                                            Sell ({item.sellPrice}G)
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {player.inventory.length === 0 && (
                                <div className="text-xs text-gray-600 italic">Inventory is empty.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

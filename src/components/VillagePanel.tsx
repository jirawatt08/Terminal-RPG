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
    buyPotion: (type: 'exp' | 'coin' | 'luck' | 'health') => void;
    buyPotionMaxUpgrade: () => void;
    buyPotionQualityUpgrade: () => void;
    acceptQuest: (type: 'kill_monster' | 'kill_boss') => void;
    completeQuest: (id: string) => void;
}

export const VillagePanel: React.FC<VillagePanelProps> = ({
    player, setPlayer, addLog, getEquipmentValue, upgradeItem, sellItem, toggleItemLock,
    buyPotion, buyPotionMaxUpgrade, buyPotionQualityUpgrade, acceptQuest, completeQuest
}) => {
    const [villageTab, setVillageTab] = useState<'BLACKSMITH' | 'MERCHANT' | 'ALCHEMIST' | 'QUEST_BOARD'>('BLACKSMITH');

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
                <button
                    onClick={() => setVillageTab('ALCHEMIST')}
                    className={`flex-1 py-2 text-sm font-bold border ${villageTab === 'ALCHEMIST' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                    ALCHEMIST
                </button>
                <button
                    onClick={() => setVillageTab('QUEST_BOARD')}
                    className={`flex-1 py-2 text-sm font-bold border ${villageTab === 'QUEST_BOARD' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                    QUEST BOARD
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

                        <div className="border border-yellow-900/50 bg-black p-4">
                            <h3 className="text-yellow-500 font-bold mb-2">Auto-Heal Protocol</h3>
                            <p className="text-xs text-gray-400 mb-4">Automatically use health potions when HP drops below {player.autoHealThreshold}%.</p>
                            {player.autoHealUnlocked ? (
                                <div className="space-y-2">
                                    <div className="text-green-500 text-sm font-bold text-center">UNLOCKED</div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase">
                                            <span>Threshold: {player.autoHealThreshold}% HP</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="90"
                                            step="5"
                                            value={player.autoHealThreshold}
                                            onChange={(e) => setPlayer(p => ({ ...p, autoHealThreshold: parseInt(e.target.value) }))}
                                            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (player.gold >= 2500) {
                                            setPlayer(p => ({ ...p, gold: p.gold - 2500, autoHealUnlocked: true }));
                                            addLog('Purchased Auto-Heal Protocol!', 'success');
                                        }
                                    }}
                                    disabled={player.gold < 2500}
                                    className="w-full py-2 bg-yellow-900/30 text-yellow-500 border border-yellow-900 hover:bg-yellow-900/50 disabled:opacity-50 text-sm"
                                >
                                    Buy (2500G)
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
                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            Value: {getEquipmentValue(item)}
                                            {item.stats && (
                                                <span className="text-[10px] text-gray-600 border-l border-gray-800 pl-2">
                                                    {Object.entries(item.stats).map(([s, v], i) => (
                                                        <span key={s} className="ml-1">{v}{s.toUpperCase()}{i < Object.entries(item.stats!).length - 1 ? ',' : ''}</span>
                                                    ))}
                                                </span>
                                            )}
                                        </div>
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
            {villageTab === 'ALCHEMIST' && (
                <div className="flex flex-col gap-6">
                    <p className="text-gray-400 text-sm">Buy potions to temporarily boost your stats. Potions are consumed after killing monsters/bosses.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { type: 'exp', name: 'Experience Potion', desc: 'Boosts EXP gain' },
                            { type: 'coin', name: 'Wealth Potion', desc: 'Boosts Gold gain' },
                            { type: 'luck', name: 'Luck Potion', desc: 'Increases Luck' },
                            { type: 'health', name: 'Health Potion', desc: 'Restores 30% HP' }
                        ].map(p => {
                            const maxPotions = 5 + (player.potionMaxBuyUpgrade * 5);
                            const currentStacks = player.potions.find(pot => pot.type === p.type)?.duration / 10 || 0;
                            const cost = 200 + (player.stage * 100);
                            return (
                                <div key={p.type} className="border border-green-900 bg-black p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-green-500 font-bold text-sm mb-1 uppercase">{p.name}</h3>
                                        <p className="text-[10px] text-gray-500 mb-2">{p.desc}</p>
                                        <div className="text-[10px] text-gray-400 mb-4 uppercase">
                                            Limit: {currentStacks}/{maxPotions}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => buyPotion(p.type as any)}
                                        disabled={player.gold < cost || currentStacks >= maxPotions}
                                        className="w-full py-2 bg-green-900/20 text-green-400 border border-green-900 hover:bg-green-900/40 text-xs disabled:opacity-50"
                                    >
                                        Buy ({cost}G)
                                    </button>
                                </div>
                            );
                        })}

                        <div className="border border-purple-900 bg-black p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="text-purple-500 font-bold text-sm mb-1 uppercase">MAX BUY LIMIT</h3>
                                <p className="text-[10px] text-gray-500 mb-2">+5 stack limit to all potions.</p>
                                <div className="text-[10px] text-gray-400 mb-4 uppercase">
                                    Current: {5 + (player.potionMaxBuyUpgrade * 5)} | Lv.{player.potionMaxBuyUpgrade}/20
                                </div>
                            </div>
                            <button
                                onClick={buyPotionMaxUpgrade}
                                disabled={player.gold < (5000 * Math.pow(1.8, player.potionMaxBuyUpgrade)) || player.potionMaxBuyUpgrade >= 20}
                                className="w-full py-2 bg-purple-900/20 text-purple-400 border border-purple-900 hover:bg-purple-900/40 text-xs disabled:opacity-50"
                            >
                                Upgrade ({Math.floor(5000 * Math.pow(1.8, player.potionMaxBuyUpgrade))}G)
                            </button>
                        </div>

                        <div className="border border-blue-900 bg-black p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="text-blue-500 font-bold text-sm mb-1 uppercase">POTION QUALITY</h3>
                                <p className="text-[10px] text-gray-500 mb-2">+25% effectiveness to potions.</p>
                                <div className="text-[10px] text-gray-400 mb-4 uppercase">
                                    Bonus: +{player.potionQualityUpgrade * 25}% | Stage Req: {player.potionQualityUpgrade * 10 || 1}
                                </div>
                            </div>
                            <button
                                onClick={buyPotionQualityUpgrade}
                                disabled={player.gold < (10000 * Math.pow(2.2, player.potionQualityUpgrade)) || player.potionQualityUpgrade >= 8 || player.stage < (player.potionQualityUpgrade * 10)}
                                className="w-full py-2 bg-blue-900/20 text-blue-400 border border-blue-900 hover:bg-blue-900/40 text-xs disabled:opacity-50"
                            >
                                Upgrade ({Math.floor(10000 * Math.pow(2.2, player.potionQualityUpgrade))}G)
                            </button>
                        </div>
                    </div>
                    {player.potions.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Active Effects</h3>
                            <div className="space-y-2">
                                {player.potions.map((p, idx) => (
                                    <div key={idx} className="bg-green-900/10 border border-green-900/30 p-2 text-[10px] flex justify-between uppercase">
                                        <span className="text-green-400">{p.type} ({Math.floor(p.duration)})</span>
                                        <span className="text-gray-500">{p.type === 'health' ? 'Remaining Uses' : 'Remaining Kills'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {villageTab === 'QUEST_BOARD' && (
                <div className="flex flex-col gap-6">
                    <p className="text-gray-400 text-sm">Accept quests to earn extra rewards. Rewards scale with stage.</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => acceptQuest('kill_monster')}
                            disabled={player.quests.filter(q => q.requirement.type === 'kill_monster').length >= 3}
                            className="flex-1 py-3 bg-blue-900/20 text-blue-400 border border-blue-900 hover:bg-blue-900/40 text-xs disabled:opacity-50 font-bold"
                        >
                            Accept Monster Hunt
                        </button>
                        <button
                            onClick={() => acceptQuest('kill_boss')}
                            disabled={player.quests.filter(q => q.requirement.type === 'kill_boss').length >= 3}
                            className="flex-1 py-3 bg-red-900/20 text-red-400 border border-red-900 hover:bg-red-900/40 text-xs disabled:opacity-50 font-bold"
                        >
                            Accept Boss Slayer
                        </button>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Active Quests ({player.quests.length}/6)</h3>
                        <div className="space-y-3">
                            {player.quests.map(q => (
                                <div key={q.id} className="border border-gray-800 bg-black p-4 flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-gray-200">{q.name}</h4>
                                            {q.completed && <span className="text-[10px] bg-green-900 text-green-400 px-1 rounded">READY</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">{q.description}</p>
                                        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${q.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(100, (q.requirement.current / q.requirement.target) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                                            <span>Progress: {Math.floor(q.requirement.current)} / {Math.floor(q.requirement.target)}</span>
                                            <span className="text-yellow-600">Reward: {Math.floor(q.reward.exp)} EXP | {Math.floor(q.reward.gold)} Gold</span>
                                        </div>
                                    </div>
                                    {q.completed && (
                                        <button
                                            onClick={() => completeQuest(q.id)}
                                            className="ml-4 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 animate-pulse"
                                        >
                                            CLAIM
                                        </button>
                                    )}
                                </div>
                            ))}
                            {player.quests.length === 0 && (
                                <p className="text-gray-600 italic text-xs text-center py-4 bg-gray-900/50 border border-dashed border-gray-800">No active quests.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

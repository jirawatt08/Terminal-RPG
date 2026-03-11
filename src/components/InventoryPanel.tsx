import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Item, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';
import { Package, Filter, SortAsc, Lock, Shield } from 'lucide-react';

type SortMode = 'RARITY' | 'VALUE' | 'NAME';

export const InventoryPanel: React.FC = () => {
  const { player, stats, actions } = useGame();
  const [filter, setFilter] = useState<Rarity | 'ALL'>('ALL');
  const [sortBy, setSortMode] = useState<SortMode>('RARITY');

  const rarities: (Rarity | 'ALL')[] = ['ALL', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine'];
  const rarityOrder: Record<Rarity, number> = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5, Divine: 6 };

  const sortedInventory = [...player.inventory]
    .filter(i => filter === 'ALL' || i.rarity === filter)
    .sort((a, b) => {
      if (sortBy === 'RARITY') return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      if (sortBy === 'VALUE') return b.value - a.value;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Inventory Container */}
      <div className="border border-[#00ff00]/30 bg-[#050505] p-4 rounded-sm flex flex-col group h-full">
        <div className="flex justify-between items-center mb-4 border-b border-[#00ff00]/10 pb-2">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[#00ff00]/60" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Storage_Unit</span>
          </div>
          <div className="text-[10px] text-[#00ff00]/40 font-mono">
            {player.inventory.length}/{player.inventoryLimit}
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-[#00ff00]/5">
            {rarities.map(r => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-2 py-1 text-[8px] border transition-all uppercase tracking-tighter whitespace-nowrap ${filter === r ? 'bg-[#00ff00]/20 border-[#00ff00]/50 text-[#00ff00]' : 'border-transparent text-[#00ff00]/30 hover:text-[#00ff00]/60'}`}
              >
                {r}
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center bg-[#00ff00]/5 p-1.5 rounded-sm border border-[#00ff00]/10">
            <div className="flex items-center gap-2 text-[9px] text-[#00ff00]/40 uppercase font-bold px-1">
              <SortAsc size={10} /> Sort_By
            </div>
            <div className="flex gap-2">
              {(['RARITY', 'VALUE', 'NAME'] as SortMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`text-[8px] font-bold transition-all uppercase tracking-widest px-2 py-0.5 rounded-sm ${sortBy === mode ? 'text-yellow-500 bg-yellow-500/10' : 'text-[#00ff00]/20 hover:text-[#00ff00]/40'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Item List */}
        <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin scrollbar-thumb-[#00ff00]/10">
          {sortedInventory.length > 0 ? (
            sortedInventory.map((item) => (
              <div 
                key={item.id} 
                className="p-2 border border-[#00ff00]/10 bg-[#00ff00]/2 rounded-sm group relative hover:border-[#00ff00]/40 transition-all hover:bg-[#00ff00]/5"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${RARITY_COLORS[item.rarity]}`}>{item.name}</span>
                  <span className="text-[9px] text-[#00ff00]/30 font-mono">+{item.upgradeLevel || 0}</span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-[#00ff00]/40 uppercase tracking-tighter">{item.type}</span>
                      <span className="text-[9px] text-[#00ff00]/80 font-bold">
                        +{item.value} {item.type === 'Weapon' ? 'ATK' : 'DEF'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      {item.stats && Object.entries(item.stats).map(([stat, val]) => (
                        <span key={stat} className="text-[8px] text-cyan-400/60 uppercase font-bold">{stat}:{val}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => actions.toggleItemLock(item)}
                      className={`text-[8px] px-1.5 py-0.5 border transition-all ${item.locked ? 'border-red-500/40 text-red-500 bg-red-500/5' : 'border-[#00ff00]/10 text-[#00ff00]/20 hover:text-[#00ff00]/60'}`}
                    >
                      {item.locked ? 'LKD' : 'LCK'}
                    </button>
                    <button 
                      onClick={() => actions.equipItem(item)}
                      className="text-[8px] px-2 py-0.5 border border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00] font-bold hover:bg-[#00ff00]/30 transition-all uppercase"
                    >
                      Mount
                    </button>
                  </div>
                </div>
                {item.effect && (
                  <div className="mt-1.5 pt-1 border-t border-[#00ff00]/5 text-[8px] text-blue-400/60 uppercase tracking-widest italic">
                    PROG: {item.effect.type} +{item.effect.value}%
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-[10px] text-[#00ff00]/20 italic text-center py-12 border border-dashed border-[#00ff00]/10 uppercase tracking-widest">
              No data packets found.
            </div>
          )}
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="border border-[#00ff00]/30 bg-[#050505] p-4 rounded-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-[#00ff00]/10 pb-2">
          <Shield size={14} className="text-[#00ff00]/60" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Active_Modules</span>
        </div>
        <div className="space-y-3">
          {(['weapon', 'armor', 'accessory'] as const).map(type => {
            const item = player.equipment[type];
            return (
              <div key={type} className="flex flex-col gap-1">
                <div className="text-[8px] text-[#00ff00]/30 uppercase tracking-widest px-1 flex justify-between">
                  <span>{type}</span>
                  {item && <span className="text-yellow-600/60">VAL: {stats.getEquipmentValue(item)}</span>}
                </div>
                {item ? (
                  <div className="p-2 border border-[#00ff00]/20 bg-[#00ff00]/5 rounded-sm flex justify-between items-center group relative hover:border-[#00ff00]/40 transition-all">
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${RARITY_COLORS[item.rarity]}`}>{item.name}</span>
                      <div className="flex gap-2">
                        {item.stats && Object.entries(item.stats).map(([s, v]) => (
                          <span key={s} className="text-[8px] text-[#00ff00]/40 uppercase">{s}:{v}</span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => actions.toggleItemLock(item)}
                      className={`text-[8px] p-1 border transition-all ${item.locked ? 'border-red-500/40 text-red-500' : 'border-transparent text-[#00ff00]/20 hover:text-[#00ff00]/60'}`}
                    >
                      {item.locked ? <Lock size={10} /> : <Filter size={10} />}
                    </button>
                  </div>
                ) : (
                  <div className="p-2 border border-[#00ff00]/5 bg-transparent rounded-sm text-[9px] text-[#00ff00]/10 italic uppercase tracking-tighter">
                    Slot_Offline
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

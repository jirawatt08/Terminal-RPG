import React from 'react';
import { Terminal, Heart, Zap, Sword, Shield, Coins, ArrowUpCircle, Package } from 'lucide-react';
import { Player, Item, PlayerClass } from '../types';
import { RARITY_COLORS } from '../constants';
import { ProgressBar } from './ProgressBar';

interface CharacterPanelProps {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  maxHp: number;
  maxMp: number;
  totalAttack: number;
  totalDefense: number;
  totalMagicAttack: number;
  critChance: number;
  finalCritDmg: number;
  dodgeChance: number;
  lifesteal: number;
  totalLuck: number;
  totalStatusChance: number;
  setBonusGoldPct: number;
  setBonusExpPct: number;
  barMode: 'bar' | 'number' | 'percent';
  setBarMode: React.Dispatch<React.SetStateAction<'bar' | 'number' | 'percent'>>;
  sysStatusTab: 'ATTRIBUTES' | 'EQUIPPED' | 'CHARACTER';
  setSysStatusTab: (tab: 'ATTRIBUTES' | 'EQUIPPED' | 'CHARACTER') => void;
  allocateStat: (stat: keyof Player['stats']) => void;
  chooseClass: (cls: PlayerClass) => void;
  strMilestones: number;
  agiMilestones: number;
  vitMilestones: number;
  intMilestones: number;
  lukMilestones: number;
  activeSets: string[];
  inventorySort: 'STAT' | 'RARITY' | 'NAME';
  setInventorySort: (sort: 'STAT' | 'RARITY' | 'NAME') => void;
  sortedInventory: Item[];
  equipItem: (item: Item) => void;
  getEquipmentValue: (item: Item | null) => number;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  player,
  maxHp,
  maxMp,
  totalAttack,
  totalDefense,
  totalMagicAttack,
  critChance,
  finalCritDmg,
  dodgeChance,
  lifesteal,
  totalLuck,
  totalStatusChance,
  setBonusGoldPct,
  setBonusExpPct,
  barMode,
  setBarMode,
  sysStatusTab,
  setSysStatusTab,
  allocateStat,
  chooseClass,
  strMilestones,
  agiMilestones,
  vitMilestones,
  intMilestones,
  lukMilestones,
  activeSets,
  inventorySort,
  setInventorySort,
  sortedInventory,
  equipItem,
  getEquipmentValue
}) => {
  return (
    <div className="w-full md:w-1/4 flex flex-col gap-4 md:h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent pr-2">
      <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm shadow-[0_0_10px_rgba(0,255,0,0.1)]">
        <div className="flex items-center justify-between mb-4 border-b border-[#00ff00]/30 pb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal size={20} /> SYS_STATUS
          </h2>
          <button 
            onClick={() => setBarMode(prev => prev === 'bar' ? 'number' : prev === 'number' ? 'percent' : 'bar')}
            className="text-xs border border-gray-700 px-2 py-1 hover:bg-gray-800 text-gray-400"
          >
            Mode: {barMode.toUpperCase()}
          </button>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setSysStatusTab('ATTRIBUTES')}
            className={`flex-1 py-1 text-xs font-bold border ${sysStatusTab === 'ATTRIBUTES' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
          >
            ATTRIBUTES
          </button>
          <button 
            onClick={() => setSysStatusTab('EQUIPPED')}
            className={`flex-1 py-1 text-xs font-bold border ${sysStatusTab === 'EQUIPPED' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
          >
            EQUIPPED
          </button>
          <button 
            onClick={() => setSysStatusTab('CHARACTER')}
            className={`flex-1 py-1 text-xs font-bold border ${sysStatusTab === 'CHARACTER' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
          >
            CHARACTER
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>CLASS:</span> <span className="text-purple-400">{player.playerClass}</span></div>
          <div className="flex justify-between"><span>STAGE:</span> <span className="text-yellow-400">{Math.floor(player.stage)}</span></div>
          <div className="flex justify-between"><span>LEVEL:</span> <span>{Math.floor(player.level)}</span></div>
          <div>
            <div className="flex justify-between mb-1"><span>EXP:</span></div>
            <ProgressBar current={Math.floor(player.exp)} max={Math.floor(player.maxExp)} color="bg-yellow-500" barMode={barMode} />
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <span className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> HP:</span>
            </div>
            <ProgressBar current={Math.floor(player.hp)} max={Math.floor(maxHp)} color="bg-red-500" barMode={barMode} />

            <div className="flex justify-between mb-1 mt-2">
              <span className="flex items-center gap-1"><Zap size={14} className="text-blue-500" /> MP:</span>
            </div>
            <ProgressBar current={Math.floor(player.mp)} max={Math.floor(maxMp)} color="bg-blue-500" barMode={barMode} />
          </div>

          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-gray-400">
              <span className="flex items-center gap-1"><Sword size={14} /> ATK:</span> 
              <span>{Math.floor(totalAttack)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span className="flex items-center gap-1"><Shield size={14} /> DEF:</span> 
              <span>{Math.floor(totalDefense)}</span>
            </div>
            <div className="flex justify-between text-yellow-400">
              <span className="flex items-center gap-1"><Coins size={14} /> GOLD:</span> 
              <span>{Math.floor(player.gold)}</span>
            </div>
          </div>

          {sysStatusTab === 'ATTRIBUTES' && (
            <>
              {/* Stats Allocation */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between mb-2 text-xs text-gray-400">
                  <span>ATTRIBUTES</span>
                  {player.statPoints > 0 && <span className="text-yellow-400 animate-pulse">{Math.floor(player.statPoints)} PTS</span>}
                </div>
                {(['str', 'agi', 'vit', 'int', 'luk'] as const).map(stat => (
                  <div key={stat} className="flex justify-between items-center text-xs mb-1">
                    <span className="uppercase">{stat}: {Math.floor(player.stats[stat])}</span>
                    {player.statPoints > 0 && (
                      <button onClick={() => allocateStat(stat)} className="text-[#00ff00] hover:text-white"><ArrowUpCircle size={14} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* Milestone Bonuses */}
              <div className="mt-4 pt-4 border-t border-gray-800 text-[10px] text-gray-500 space-y-1">
                <div className="text-gray-400 mb-1">MILESTONE BONUSES (Every 10 pts)</div>
                {strMilestones > 0 && <div>STR: +{strMilestones * 5}% ATK, +{strMilestones * 10}% Crit DMG</div>}
                {agiMilestones > 0 && <div>AGI: +{agiMilestones * 2}% Crit Rate, +{agiMilestones * 2}% Dodge</div>}
                {vitMilestones > 0 && <div>VIT: +{vitMilestones * 5}% HP/DEF</div>}
                {intMilestones > 0 && <div>INT: +{intMilestones * 2} MP Regen, +{intMilestones * 5}% Magic DMG</div>}
                {lukMilestones > 0 && <div>LUK: +{lukMilestones * 1}% Drop Rarity Chance</div>}
                {strMilestones === 0 && agiMilestones === 0 && vitMilestones === 0 && intMilestones === 0 && lukMilestones === 0 && <div>None active.</div>}
              </div>

              {/* Class Passives */}
              {player.playerClass !== 'Novice' && (
                <div className="mt-4 pt-4 border-t border-gray-800 text-[10px] text-purple-400/80 space-y-1">
                  <div className="text-purple-400 mb-1">CLASS PASSIVE</div>
                  {player.playerClass === 'Warrior' && <div>Toughness: +10% Base HP & DEF</div>}
                  {player.playerClass === 'Rogue' && <div>Lethality: +10% Crit Rate, +20% Crit DMG</div>}
                  {player.playerClass === 'Mage' && <div>Arcane Mastery: +20% Magic DMG, +5 MP Regen</div>}
                  {player.playerClass === 'Paladin' && <div>Divine Protection: +20% HP/DEF, +10% Magic DMG</div>}
                  {player.playerClass === 'Berserker' && <div>Bloodlust: +30% ATK, +10% Lifesteal</div>}
                  {player.playerClass === 'Assassin' && <div>Lethality II: +20% Crit Rate, +40% Crit DMG</div>}
                  {player.playerClass === 'Ranger' && <div>Eagle Eye: +15% Crit Rate, +15% Dodge</div>}
                  {player.playerClass === 'Archmage' && <div>Arcane Supremacy: +40% Magic DMG, +15 MP Regen</div>}
                  {player.playerClass === 'Necromancer' && <div>Dark Arts: +20% Magic DMG, +15% Lifesteal</div>}
                </div>
              )}

              {/* Class Selection */}
              {player.level >= 10 && player.playerClass === 'Novice' && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <span className="text-xs text-yellow-400 mb-2 block animate-pulse">CLASS UPGRADE AVAILABLE</span>
                  <div className="flex gap-2">
                    <button onClick={() => chooseClass('Warrior')} className="flex-1 border border-red-500/50 text-red-400 text-xs p-1 hover:bg-red-500/20">Warrior</button>
                    <button onClick={() => chooseClass('Rogue')} className="flex-1 border border-green-500/50 text-green-400 text-xs p-1 hover:bg-green-500/20">Rogue</button>
                    <button onClick={() => chooseClass('Mage')} className="flex-1 border border-blue-500/50 text-blue-400 text-xs p-1 hover:bg-blue-500/20">Mage</button>
                  </div>
                </div>
              )}

              {/* Tier 2 Class Selection */}
              {player.level >= 50 && player.stage >= 10 && ['Warrior', 'Rogue', 'Mage'].includes(player.playerClass) && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <span className="text-xs text-yellow-400 mb-2 block animate-pulse">TIER 2 CLASS UPGRADE AVAILABLE</span>
                  <div className="flex gap-2">
                    {player.playerClass === 'Warrior' && (
                      <>
                        <button onClick={() => chooseClass('Paladin')} className="flex-1 border border-yellow-500/50 text-yellow-400 text-xs p-1 hover:bg-yellow-500/20">Paladin</button>
                        <button onClick={() => chooseClass('Berserker')} className="flex-1 border border-red-600/50 text-red-500 text-xs p-1 hover:bg-red-600/20">Berserker</button>
                      </>
                    )}
                    {player.playerClass === 'Rogue' && (
                      <>
                        <button onClick={() => chooseClass('Assassin')} className="flex-1 border border-green-600/50 text-green-500 text-xs p-1 hover:bg-green-600/20">Assassin</button>
                        <button onClick={() => chooseClass('Ranger')} className="flex-1 border border-emerald-500/50 text-emerald-400 text-xs p-1 hover:bg-emerald-500/20">Ranger</button>
                      </>
                    )}
                    {player.playerClass === 'Mage' && (
                      <>
                        <button onClick={() => chooseClass('Archmage')} className="flex-1 border border-blue-600/50 text-blue-500 text-xs p-1 hover:bg-blue-600/20">Archmage</button>
                        <button onClick={() => chooseClass('Necromancer')} className="flex-1 border border-purple-600/50 text-purple-500 text-xs p-1 hover:bg-purple-600/20">Necromancer</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {sysStatusTab === 'EQUIPPED' && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="space-y-2">
                {(['weapon', 'armor', 'accessory'] as const).map(slot => {
                  const item = player.equipment[slot];
                  return (
                    <div key={slot} className="border border-gray-800 p-2 text-xs flex flex-col">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase">{slot.substring(0,3)}:</span>
                        {item ? <span className={RARITY_COLORS[item.rarity]}>{item.name} {item.upgradeLevel && item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}</span> : <span className="text-gray-600">NONE</span>}
                      </div>
                      {item && (
                        <div className="text-[10px] text-gray-500 mt-1 text-right">
                          +{item.value} {item.type === 'Weapon' ? 'ATK' : 'DEF'}
                          {item.effect && ` | +${item.effect.value}% ${item.effect.type}`}
                        </div>
                      )}
                    </div>
                  );
                })}
                {activeSets.length > 0 && (
                  <div className="text-[10px] text-purple-400 mt-2">
                    Active Sets: {activeSets.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {sysStatusTab === 'CHARACTER' && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between"><span>Max HP:</span> <span className="text-red-400">{Math.floor(maxHp)}</span></div>
                <div className="flex justify-between"><span>Max MP:</span> <span className="text-blue-400">{Math.floor(maxMp)}</span></div>
                <div className="flex justify-between"><span>Attack:</span> <span className="text-gray-300">{Math.floor(totalAttack)}</span></div>
                <div className="flex justify-between"><span>Defense:</span> <span className="text-gray-300">{Math.floor(totalDefense)}</span></div>
                <div className="flex justify-between"><span>Magic ATK:</span> <span className="text-purple-400">{Math.floor(totalMagicAttack)}</span></div>
                <div className="flex justify-between"><span>Crit Chance:</span> <span className="text-yellow-400">{Math.floor(critChance)}%</span></div>
                <div className="flex justify-between"><span>Crit Damage:</span> <span className="text-yellow-400">{Math.floor(finalCritDmg * 100)}%</span></div>
                <div className="flex justify-between"><span>Dodge Chance:</span> <span className="text-green-400">{Math.floor(dodgeChance)}%</span></div>
                <div className="flex justify-between"><span>Lifesteal:</span> <span className="text-red-500">{Math.floor(lifesteal)}%</span></div>
                <div className="flex justify-between"><span>Luck:</span> <span className="text-emerald-400">{Math.floor(totalLuck)}</span></div>
                <div className="flex justify-between"><span>Status Chance:</span> <span className="text-blue-400">{Math.floor(totalStatusChance)}/10</span></div>
                <div className="flex justify-between"><span>Bonus Gold:</span> <span className="text-yellow-500">{Math.floor(setBonusGoldPct * 100)}%</span></div>
                <div className="flex justify-between"><span>Bonus EXP:</span> <span className="text-blue-300">{Math.floor(setBonusExpPct * 100)}%</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                    <span className="text-gray-500 mr-1">[{item.type.substring(0,3).toUpperCase()}]</span>
                    {item.name} {item.upgradeLevel > 0 && `+${item.upgradeLevel}`}
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
    </div>
  );
};

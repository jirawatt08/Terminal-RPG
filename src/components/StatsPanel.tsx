import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerClass } from '../types';
import { ProgressBar } from './ProgressBar';
import { Heart, Zap, Sword, Shield, Coins, ArrowUpCircle, Info, Activity, ShieldCheck, Trophy } from 'lucide-react';
import { SET_BONUSES } from '../constants';

type StatsTab = 'ATTRIBUTES' | 'COMBAT' | 'PASSIVES' | 'REBORN';

export const StatsPanel: React.FC = () => {
  const { player, stats, actions, setPlayer } = useGame();
  const [activeTab, setActiveTab] = useState<StatsTab>('ATTRIBUTES');

  const classes: PlayerClass[] = ['Warrior', 'Rogue', 'Mage'];
  const t2Classes: Record<string, PlayerClass[]> = {
    Warrior: ['Paladin', 'Berserker'],
    Rogue: ['Assassin', 'Ranger'],
    Mage: ['Archmage', 'Necromancer']
  };

  const barMode = player.settings.barMode;
  const toggleBarMode = () => {
    const modes: ('bar' | 'number' | 'percent')[] = ['bar', 'number', 'percent'];
    const nextMode = modes[(modes.indexOf(barMode) + 1) % modes.length];
    setPlayer(p => ({ ...p, settings: { ...p.settings, barMode: nextMode } }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* OS Status Header */}
      <div className="border border-[#00ff00]/30 bg-[#050505] p-4 rounded-sm relative overflow-hidden group shadow-[0_0_15px_rgba(0,255,0,0.05)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff00]/20 group-hover:bg-[#00ff00]/40 transition-colors"></div>
        <div className="flex justify-between items-center mb-4 border-b border-[#00ff00]/10 pb-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#00ff00]/60" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">SYS_STATUS</span>
          </div>
          <button 
            onClick={toggleBarMode}
            className="text-[9px] border border-[#00ff00]/20 px-2 py-0.5 hover:bg-[#00ff00]/10 text-[#00ff00]/40 hover:text-[#00ff00] transition-all uppercase"
          >
            Mode: {barMode}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 border border-[#00ff00]/20 bg-[#00ff00]/5 rounded-sm overflow-hidden flex-shrink-0 relative">
            {player.photoURL ? (
              <img src={player.photoURL} alt="User" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#00ff00]/20 font-bold text-xl">?</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate uppercase tracking-widest text-[#00ff00]">{player.displayName || 'GUEST_01'}</div>
            <div className="text-[10px] text-[#00ff00]/60 font-bold uppercase tracking-tighter">
              {player.playerClass} | STAGE {Math.floor(player.stage)}
            </div>
            <div className="text-[10px] text-[#00ff00]/40 uppercase">Level {Math.floor(player.level)}</div>
          </div>
        </div>

        <div className="space-y-3">
          <ProgressBar
            label="EXP"
            current={Math.floor(player.exp)}
            max={Math.floor(player.maxExp)}
            color="bg-yellow-500"
            barMode={barMode}
            height="h-1.5"
          />
          <ProgressBar
            label="HEALTH"
            current={Math.floor(player.hp)}
            max={Math.floor(stats.maxHp)}
            color="bg-red-500"
            barMode={barMode}
            height="h-1.5"
          />
          <ProgressBar
            label="ENERGY"
            current={Math.floor(player.mp)}
            max={Math.floor(stats.maxMp)}
            color="bg-blue-500"
            barMode={barMode}
            height="h-1.5"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[#00ff00]/10 text-center">
          <div>
            <div className="text-[8px] text-[#00ff00]/40 uppercase">Atk</div>
            <div className="text-[10px] font-bold">{Math.floor(stats.totalAttack)}</div>
          </div>
          <div>
            <div className="text-[8px] text-cyan-500/40 uppercase">M.Atk</div>
            <div className="text-[10px] font-bold text-cyan-400">{Math.floor(stats.totalMagicAttack)}</div>
          </div>
          <div>
            <div className="text-[8px] text-[#00ff00]/40 uppercase">Def</div>
            <div className="text-[10px] font-bold">{Math.floor(stats.totalDefense)}</div>
          </div>
          <div>
            <div className="text-[8px] text-yellow-500/40 uppercase">Gold</div>
            <div className="text-[10px] font-bold text-yellow-500">{Math.floor(player.gold)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#00ff00]/5 p-1 rounded-sm border border-[#00ff00]/10">
        {(['ATTRIBUTES', 'COMBAT', 'PASSIVES', 'REBORN'] as StatsTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[9px] font-bold transition-all uppercase tracking-tighter ${activeTab === tab ? 'bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/30' : 'text-[#00ff00]/30 hover:text-[#00ff00]/60 border border-transparent'}`}
          >
            {tab === 'ATTRIBUTES' ? 'ATTR' : tab === 'COMBAT' ? 'STAT' : tab === 'PASSIVES' ? 'BUFF' : 'RB'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="border border-[#00ff00]/20 bg-[#050505] p-4 rounded-sm min-h-[300px]">
        {activeTab === 'ATTRIBUTES' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-[#00ff00]/40 uppercase tracking-[0.2em]">Primary_Attributes</span>
              {player.statPoints > 0 && (
                <span className="text-[10px] text-yellow-500 font-bold animate-pulse">{player.statPoints} PTS AVAILABLE</span>
              )}
            </div>
            
            <div className="space-y-3">
              {(['str', 'agi', 'vit', 'int', 'luk'] as const).map(stat => {
                const total = stats[`total${stat.charAt(0).toUpperCase()}${stat.slice(1)}` as keyof typeof stats];
                const base = player.stats[stat];
                const bonus = total - base;
                
                // For Luck, we have a multiplier from potions
                const isLuck = stat === 'luk';
                const potionBonus = isLuck ? stats.potionLuckBonus : 0;
                
                return (
                  <div key={stat} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#00ff00]/80 uppercase group-hover:text-[#00ff00] transition-colors">{stat}</span>
                      <span className="text-[9px] text-[#00ff00]/30 uppercase italic">{stats[`${stat}Milestones` as keyof typeof stats]} Milestones</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right flex flex-col items-end" title={isLuck ? `Base: ${base} | Items: +${bonus - Math.floor(base * (potionBonus/100))} | Potion: +${potionBonus}%` : `Base: ${base} | Items: +${bonus}`}>
                        <span className="text-sm font-mono">{total}</span>
                        {(bonus > 0 || potionBonus > 0) && (
                          <div className="flex gap-1 items-center">
                            <span className="text-[8px] text-cyan-400 font-bold">({base} + {isLuck ? bonus : bonus})</span>
                            {isLuck && potionBonus > 0 && <span className="text-[8px] text-yellow-500 font-bold">x{1 + potionBonus/100}</span>}
                          </div>
                        )}
                      </div>
                      {player.statPoints > 0 && (
                        <button 
                          onClick={() => actions.allocateStat(stat)}
                          className="w-5 h-5 border border-[#00ff00]/30 flex items-center justify-center hover:bg-[#00ff00]/20 transition-all rounded-sm"
                        >
                          <ArrowUpCircle size={12} className="text-[#00ff00]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Milestones Info */}
            <div className="mt-4 pt-4 border-t border-[#00ff00]/10">
              <div className="text-[9px] text-[#00ff00]/40 uppercase mb-2 tracking-widest flex items-center gap-1">
                <Info size={10} /> Active_Milestones
              </div>
              <div className="space-y-1.5">
                {Object.entries(stats.milestoneBonuses).map(([key, bonus]) => (
                  bonus && (
                    <div key={key} className="text-[10px] flex gap-2">
                      <span className="text-[#00ff00]/60 font-bold uppercase w-8">{key}:</span>
                      <span className="text-[#00ff00]/40">{bonus as string}</span>
                    </div>
                  )
                ))}
                {!Object.values(stats.milestoneBonuses).some(Boolean) && (
                  <div className="text-[9px] text-[#00ff00]/20 italic">No milestones achieved. (10 pts req.)</div>
                )}
              </div>
            </div>

            {/* Class Selection UI */}
            {player.level >= 10 && player.playerClass === 'Novice' && (
              <div className="mt-4 pt-4 border-t border-[#00ff00]/10 animate-pulse">
                <div className="text-[10px] text-cyan-400 mb-2 uppercase text-center font-bold tracking-widest">Specialization_Available</div>
                <div className="flex gap-2">
                  {classes.map(cls => (
                    <button key={cls} onClick={() => actions.chooseClass(cls)} className="flex-1 py-1.5 border border-cyan-400/30 text-cyan-400 text-[10px] font-bold hover:bg-cyan-400/10 transition-all uppercase">
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {player.level >= 50 && player.stage >= 10 && ['Warrior', 'Rogue', 'Mage'].includes(player.playerClass) && (
              <div className="mt-4 pt-4 border-t border-[#00ff00]/10">
                <div className="text-[10px] text-purple-400 mb-2 uppercase text-center font-bold tracking-widest">Tier_2_Advancement</div>
                <div className="flex gap-2">
                  {t2Classes[player.playerClass].map(cls => (
                    <button key={cls} onClick={() => actions.chooseClass(cls)} className="flex-1 py-1.5 border border-purple-400/30 text-purple-400 text-[10px] font-bold hover:bg-purple-400/10 transition-all uppercase">
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'COMBAT' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="text-[10px] text-[#00ff00]/40 uppercase tracking-[0.2em] mb-2 border-b border-[#00ff00]/10 pb-1">Derived_Combat_Stats</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Magic Attack</span>
                <span className="font-mono text-cyan-400">{stats.totalMagicAttack}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Critical Chance</span>
                <span className="font-mono text-yellow-500">{stats.critChance}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Critical Damage</span>
                <span className="font-mono text-yellow-500">{Math.floor(stats.finalCritDmg * 100)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Skill Haste (CDR)</span>
                <span className="font-mono text-purple-400">{stats.skillHaste}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Dodge Chance</span>
                <span className="font-mono text-green-400">{stats.dodgeChance}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Lifesteal</span>
                <span className="font-mono text-red-500">{stats.lifesteal}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Status Chance</span>
                <span className="font-mono text-blue-400">{stats.totalStatusChance}/10</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Luck Rating</span>
                <span className="font-mono text-emerald-400">{stats.totalLuck}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-[#00ff00]/5">
                <span className="text-[#00ff00]/60 uppercase">Bonus Gold</span>
                <div className="flex gap-1 items-center font-mono">
                  <span className="text-yellow-600">+{Math.floor(stats.setBonusGoldPct * 100)}%</span>
                  {stats.potionGoldBonus > 0 && <span className="text-yellow-500 font-bold"> (+{stats.potionGoldBonus}%)</span>}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#00ff00]/60 uppercase">Bonus EXP</span>
                <div className="flex gap-1 items-center font-mono">
                  <span className="text-blue-300">+{Math.floor(stats.setBonusExpPct * 100)}%</span>
                  {stats.potionExpBonus > 0 && <span className="text-blue-400 font-bold"> (+{stats.potionExpBonus}%)</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PASSIVES' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div>
              <div className="text-[10px] text-[#00ff00]/40 uppercase tracking-[0.2em] mb-2 border-b border-[#00ff00]/10 pb-1 flex items-center gap-2">
                <ShieldCheck size={12} /> Class_Passives
              </div>
              <div className="space-y-2">
                {player.playerClass === 'Novice' ? (
                  <div className="text-[10px] text-[#00ff00]/20 italic">No class specialization detected.</div>
                ) : (
                  <div className="text-[10px] p-2 bg-[#00ff00]/5 border border-[#00ff00]/10 rounded-sm">
                    <div className="text-[#00ff00]/80 font-bold uppercase mb-1">
                      {player.playerClass === 'Warrior' ? 'TOUGHNESS' :
                       player.playerClass === 'Rogue' ? 'LETHALITY' :
                       player.playerClass === 'Mage' ? 'ARCANE_MASTERY' :
                       player.playerClass === 'Paladin' ? 'DIVINE_PROTECTION' :
                       player.playerClass === 'Berserker' ? 'BLOODLUST' :
                       player.playerClass === 'Assassin' ? 'LETHALITY_II' :
                       player.playerClass === 'Ranger' ? 'EAGLE_EYE' :
                       player.playerClass === 'Archmage' ? 'ARCANE_SUPREMACY' :
                       player.playerClass === 'Necromancer' ? 'DARK_ARTS' : 'UNIDENTIFIED'}
                    </div>
                    <div className="text-[#00ff00]/40 leading-relaxed uppercase tracking-tighter">
                      {player.playerClass === 'Warrior' ? '+10% Base HP & DEF' :
                       player.playerClass === 'Rogue' ? '+10% Crit Rate, +20% Crit DMG' :
                       player.playerClass === 'Mage' ? '+20% Magic DMG, +5 MP Regen' :
                       player.playerClass === 'Paladin' ? '+20% HP/DEF, +10% Magic DMG' :
                       player.playerClass === 'Berserker' ? '+30% ATK, +10% Lifesteal' :
                       player.playerClass === 'Assassin' ? '+20% Crit Rate, +40% Crit DMG' :
                       player.playerClass === 'Ranger' ? '+15% Crit Rate, +15% Dodge' :
                       player.playerClass === 'Archmage' ? '+40% Magic DMG, +15 MP Regen' :
                       player.playerClass === 'Necromancer' ? '+20% Magic DMG, +15% Lifesteal' : 'Calculating...'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-yellow-500/40 uppercase tracking-[0.2em] mb-2 border-b border-yellow-500/10 pb-1 flex items-center gap-2">
                <Trophy size={12} /> Set_Bonuses
              </div>
              <div className="space-y-2">
                {stats.activeSets.length > 0 ? (
                  stats.activeSets.map(set => (
                    <div key={set} className="flex flex-col gap-1 p-2 bg-yellow-500/5 border border-yellow-500/10 rounded-sm">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-yellow-500 font-bold uppercase tracking-widest">[{set}]</span>
                        <span className="text-[#00ff00]/60 font-bold">ACTIVE</span>
                      </div>
                      <div className="text-[9px] text-yellow-500/40 uppercase tracking-tighter italic">
                        {SET_BONUSES[set] || 'No detail found.'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-[#00ff00]/20 italic py-2 text-center border border-dashed border-[#00ff00]/5 uppercase">No set resonance detected.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'REBORN' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-end border-b border-[#00ff00]/10 pb-2">
              <div>
                <div className="text-[8px] text-[#00ff00]/40 uppercase tracking-widest">Global_Cycles</div>
                <div className="text-xl font-bold font-mono">{player.rebornCount}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-yellow-500 uppercase tracking-widest">Reborn_Points</div>
                <div className="text-xl font-bold font-mono text-yellow-500">{Math.floor(player.rebornPoints)}</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-[9px] text-[#00ff00]/40 uppercase tracking-[0.2em] mb-1">Permanent_Upgrades</div>
              <div className="grid grid-cols-2 gap-2">
                {(['atkBonus', 'hpBonus', 'expBonus', 'goldBonus', 'statBonus', 'pointBonus'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => actions.buyRebornUpgrade(type)}
                    className="flex flex-col p-2 border border-[#00ff00]/10 bg-[#00ff00]/2 hover:border-[#00ff00]/40 hover:bg-[#00ff00]/5 transition-all group"
                    title={`Cost: ${type === 'pointBonus' ? '10' : '5'} RP`}
                  >
                    <div className="flex justify-between w-full">
                      <span className="text-[8px] text-[#00ff00]/40 uppercase tracking-tighter group-hover:text-[#00ff00]/60">{type.replace('Bonus', '')}</span>
                      <span className="text-[8px] text-yellow-600 font-bold">{type === 'pointBonus' ? '10' : '5'} RP</span>
                    </div>
                    <span className="text-[10px] font-bold text-yellow-500/80">+{player.rebornUpgrades[type]}{type === 'statBonus' ? '' : '%'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-500/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] text-[#00ff00]/40 uppercase tracking-widest">Projected_RP_Yield</span>
                <span className="text-sm font-bold text-yellow-500 font-mono">+{stats.nextRebornPoints} RP</span>
              </div>
              <button
                onClick={actions.reborn}
                disabled={player.level < 20}
                className={`w-full py-3 text-[10px] font-bold border transition-all uppercase tracking-[0.2em] ${player.level >= 20 ? 'border-red-500 text-red-500 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-gray-800 text-gray-800 opacity-30 cursor-not-allowed'}`}
              >
                Execute_Reborn_Sequence
              </button>
              {player.level < 20 && (
                <div className="text-[8px] text-center mt-2 text-gray-600 uppercase tracking-tighter italic">Error: Insufficient data levels (LV.20 required)</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

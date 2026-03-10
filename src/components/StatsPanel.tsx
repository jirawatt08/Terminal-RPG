import React, { useState } from 'react';
import { Terminal, Heart, Zap, Sword, Shield, Coins, ArrowUpCircle } from 'lucide-react';
import { Player, PlayerClass } from '../types';
import { RARITY_COLORS, SET_BONUSES } from '../constants';
import { ProgressBar } from './ProgressBar';

interface StatsPanelProps {
    player: Player;
    stats: any;
    allocateStat: (stat: keyof Player['stats']) => void;
    chooseClass: (cls: PlayerClass) => void;
    reborn: () => void;
    buyRebornUpgrade: (type: keyof Player['rebornUpgrades']) => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ player, stats, allocateStat, chooseClass, reborn, buyRebornUpgrade }) => {
    const [sysStatusTab, setSysStatusTab] = useState<'ATTRIBUTES' | 'EQUIPPED' | 'CHARACTER' | 'REBORN'>('ATTRIBUTES');
    const { barMode, reduceUi } = player.settings;

    return (
        <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm shadow-[0_0_10px_rgba(0,255,0,0.1)]">
            <div className="flex items-center justify-between mb-4 border-b border-[#00ff00]/30 pb-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal size={20} /> SYS_STATUS
                </h2>
                {reduceUi && <span className="text-[10px] text-gray-500 border border-gray-800 px-1">REDUCED UI</span>}
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
                {(player.level >= 20 || player.rebornCount > 0) && (
                    <button
                        onClick={() => setSysStatusTab('REBORN')}
                        className={`flex-1 py-1 text-xs font-bold border ${sysStatusTab === 'REBORN' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                    >
                        REBORN
                    </button>
                )}
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>CLASS:</span> <span className="text-purple-400">{player.playerClass}</span></div>
                <div className="flex justify-between"><span>STAGE:</span> <span className="text-yellow-400">{player.stage}</span></div>
                <div className="flex justify-between"><span>LEVEL:</span> <span>{player.level}</span></div>
                <div>
                    <div className="flex justify-between mb-1"><span>EXP:</span></div>
                    <ProgressBar current={player.exp} max={player.maxExp} color="bg-yellow-500" barMode={barMode} />
                </div>

                <div className="mt-2">
                    <div className="flex justify-between mb-1">
                        <span className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> HP:</span>
                    </div>
                    <ProgressBar current={Math.floor(player.hp)} max={stats.maxHp} color="bg-red-500" barMode={barMode} />

                    <div className="flex justify-between mb-1 mt-2">
                        <span className="flex items-center gap-1"><Zap size={14} className="text-blue-500" /> MP:</span>
                    </div>
                    <ProgressBar current={Math.floor(player.mp)} max={stats.maxMp} color="bg-blue-500" barMode={barMode} />
                </div>

                <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Sword size={14} /> ATK:</span>
                        <span>{Math.floor(stats.totalAttack)}</span>
                    </div>
                    <div className="flex justify-between text-blue-400/70">
                        <span className="flex items-center gap-1"><Zap size={14} /> M.ATK:</span>
                        <span>{Math.floor(stats.totalMagicAttack)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1"><Shield size={14} /> DEF:</span>
                        <span>{Math.floor(stats.totalDefense)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-400">
                        <span className="flex items-center gap-1"><Coins size={14} /> GOLD:</span>
                        <span>{Math.floor(player.gold)}</span>
                    </div>
                </div>

                {sysStatusTab === 'ATTRIBUTES' && (
                    <>
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="flex justify-between mb-2 text-xs text-gray-400">
                                <span>ATTRIBUTES</span>
                                {player.statPoints > 0 && <span className="text-yellow-400 animate-pulse">{player.statPoints} PTS</span>}
                            </div>
                            {(['str', 'agi', 'vit', 'int', 'luk'] as const).map(stat => (
                                <div key={stat} className="flex justify-between items-center text-xs mb-1">
                                    <span className="uppercase">
                                        {stat}: <span className="text-white">{stats['total' + stat.charAt(0).toUpperCase() + stat.slice(1)]}</span>
                                        <span className="text-[10px] text-gray-600 ml-1">({player.stats[stat]})</span>
                                    </span>
                                    {player.statPoints > 0 && (
                                        <button onClick={() => allocateStat(stat)} className="text-[#00ff00] hover:text-white"><ArrowUpCircle size={14} /></button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!reduceUi && (
                            <div className="mt-4 pt-4 border-t border-gray-800 text-[10px] text-gray-500 space-y-1">
                                <div className="text-gray-400 mb-1">MILESTONE BONUSES (Every 10 pts)</div>
                                {stats.strMilestones > 0 && <div>STR: +{stats.strMilestones * 5}% ATK, +{stats.strMilestones * 10}% Crit DMG</div>}
                                {stats.agiMilestones > 0 && <div>AGI: +{stats.agiMilestones * 2}% Crit Rate, +{stats.agiMilestones * 2}% Dodge</div>}
                                {stats.vitMilestones > 0 && <div>VIT: +{stats.vitMilestones * 5}% HP/DEF</div>}
                                {stats.intMilestones > 0 && <div>INT: +{stats.intMilestones * 2} MP Regen, +{stats.intMilestones * 5}% Magic DMG</div>}
                                {stats.lukMilestones > 0 && <div>LUK: +{stats.lukMilestones * 1}% Drop Rarity Chance</div>}
                                {stats.strMilestones === 0 && stats.agiMilestones === 0 && stats.vitMilestones === 0 && stats.intMilestones === 0 && stats.lukMilestones === 0 && <div>None active.</div>}
                            </div>
                        )}

                        {!reduceUi && player.playerClass !== 'Novice' && (
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
                                            <span className="text-gray-400 uppercase">{slot.substring(0, 3)}:</span>
                                            {item ? <span className={RARITY_COLORS[item.rarity]}>{item.name} {item.upgradeLevel && item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}</span> : <span className="text-gray-600">NONE</span>}
                                        </div>
                                        {item && !reduceUi && (
                                            <div className="text-[10px] text-gray-500 mt-1 text-right">
                                                +{item.value} {item.type === 'Weapon' ? 'ATK' : 'DEF'}
                                                {item.effect && ` | +${item.effect.value}% ${item.effect.type}`}
                                                {item.stats && Object.entries(item.stats).map(([s, v]) => ` | ${v}${s.toUpperCase()}`)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {stats.activeSets.length > 0 && (
                                <div className="mt-4 p-2 bg-purple-900/10 border border-purple-500/30">
                                    <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Active Set Bonuses</div>
                                    <div className="space-y-1">
                                        {stats.activeSets.map(setName => (
                                            <div key={setName} className="flex justify-between items-center text-[10px]">
                                                <span className="text-purple-300 font-bold">{setName.toUpperCase()}</span>
                                                <span className="text-gray-500">{SET_BONUSES[setName] || 'Active'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {sysStatusTab === 'CHARACTER' && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="space-y-1 text-xs text-gray-400">
                            <div className="flex justify-between"><span>Max HP:</span> <span className="text-red-400">{Math.floor(stats.maxHp)}</span></div>
                            <div className="flex justify-between"><span>Max MP:</span> <span className="text-blue-400">{Math.floor(stats.maxMp)}</span></div>
                            <div className="flex justify-between"><span>Attack:</span> <span className="text-gray-300">{Math.floor(stats.totalAttack)}</span></div>
                            <div className="flex justify-between"><span>Defense:</span> <span className="text-gray-300">{Math.floor(stats.totalDefense)}</span></div>
                            {!reduceUi && (
                                <>
                                    <div className="flex justify-between"><span>Magic ATK:</span> <span className="text-purple-400">{Math.floor(stats.totalMagicAttack)}</span></div>
                                    <div className="flex justify-between"><span>Crit Chance:</span> <span className="text-yellow-400">{Math.floor(stats.critChance)}%</span></div>
                                    <div className="flex justify-between"><span>Crit Damage:</span> <span className="text-yellow-400">{Math.floor(stats.finalCritDmg * 100)}%</span></div>
                                    <div className="flex justify-between"><span>Dodge Chance:</span> <span className="text-green-400">{Math.floor(stats.dodgeChance)}%{stats.dodgeChance >= 75 ? ' (MAX)' : ''}</span></div>
                                    <div className="flex justify-between"><span>Lifesteal:</span> <span className="text-red-500">{Math.floor(stats.lifesteal)}%{stats.lifesteal >= 100 ? ' (MAX)' : ''}</span></div>
                                    <div className="flex justify-between"><span>Reduction:</span> <span className="text-blue-400">{Math.floor(stats.reduction)}%{stats.reduction >= 80 ? ' (MAX)' : ''}</span></div>
                                    <div className="flex justify-between"><span>Luck:</span> <span className="text-emerald-400">{Math.floor(stats.totalLuck)}</span></div>
                                    <div className="flex justify-between"><span>Status Chance:</span> <span className="text-blue-400">{Math.floor(stats.totalStatusChance)}/10</span></div>
                                    <div className="flex justify-between"><span>Bonus Gold:</span> <span className="text-yellow-500">{Math.floor((stats.setBonusGoldPct + (stats.potionGoldBonus / 100)) * 100)}%</span></div>
                                    <div className="flex justify-between"><span>Bonus EXP:</span> <span className="text-blue-300">{Math.floor((stats.setBonusExpPct + (stats.potionExpBonus / 100)) * 100)}%</span></div>

                                    <div className="mt-2 pt-2 border-t border-gray-800">
                                        <div className="text-[10px] text-yellow-500/70 mb-1 uppercase">Stage Rarity Unlocks</div>
                                        <div className="grid grid-cols-3 gap-1 text-[9px]">
                                            <div className={player.stage >= 1 ? 'text-purple-400' : 'text-gray-600'}>STAGE 1: LEGENDARY</div>
                                            <div className={player.stage >= 5 ? 'text-red-500' : 'text-gray-600'}>STAGE 5: MYTHIC</div>
                                            <div className={player.stage >= 10 ? 'text-yellow-300' : 'text-gray-600'}>STAGE 10: DIVINE</div>
                                        </div>
                                    </div>
                                    {player.potions.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-800">
                                            <div className="text-[10px] text-green-500 mb-1 uppercase">Active Potions</div>
                                            {player.potions.map((p, idx) => (
                                                <div key={idx} className="flex justify-between text-[10px]">
                                                    <span className="text-green-400/70">{p.type.toUpperCase()} ({Math.floor(p.duration)})</span>
                                                    <span className="text-gray-600">{p.type === 'health' ? 'USES' : 'KILLS'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
                {sysStatusTab === 'REBORN' && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-purple-400">REBORN POINTS:</span>
                            <span className="text-yellow-400 font-bold">{player.rebornPoints}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] text-gray-500 uppercase">Permanent Upgrades</div>
                            <div className="grid grid-cols-1 gap-2">
                                {(() => {
                                    const limits: Record<string, number> = {
                                        atkBonus: 1000, hpBonus: 1000, expBonus: 500, goldBonus: 500, statBonus: 20, pointBonus: 200
                                    };
                                    const upgrades = [
                                        { key: 'atkBonus', label: 'ATK BONUS', suffix: '%' },
                                        { key: 'hpBonus', label: 'HP BONUS', suffix: '%' },
                                        { key: 'expBonus', label: 'EXP BONUS', suffix: '%' },
                                        { key: 'goldBonus', label: 'GOLD BONUS', suffix: '%' },
                                        { key: 'statBonus', label: 'EXTRA STATS', suffix: '/LV', prefix: '+' },
                                        { key: 'pointBonus', label: 'POINTS BONUS', suffix: '%' }
                                    ];
                                    const costs: Record<string, number> = {
                                        atkBonus: 5, hpBonus: 5, expBonus: 10, goldBonus: 10, statBonus: 20, pointBonus: 30
                                    };
                                    return upgrades.map(upg => {
                                        const current = (player.rebornUpgrades as any)[upg.key] || 0;
                                        const isMax = current >= limits[upg.key];
                                        return (
                                            <button
                                                key={upg.key}
                                                onClick={() => buyRebornUpgrade(upg.key as any)}
                                                disabled={isMax}
                                                className={`flex justify-between items-center border border-gray-800 p-2 text-[10px] hover:border-purple-500 transition-colors ${isMax ? 'opacity-50' : ''}`}
                                            >
                                                <span>{upg.label} ({upg.prefix || '+'}{current}{upg.suffix})</span>
                                                <span className="text-yellow-500">{isMax ? 'MAX' : `${costs[upg.key]} RP`}</span>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <div className="text-[10px] text-gray-500 mb-2">
                                Reborn resets your Level, Stage, Gold, and Inventory, but gives you Reborn Points based on your progress.
                            </div>
                            <button
                                onClick={reborn}
                                disabled={player.level < 20}
                                className={`w-full py-2 text-xs font-bold border ${player.level >= 20 ? 'border-purple-500 text-purple-400 hover:bg-purple-500/20' : 'border-gray-800 text-gray-700 cursor-not-allowed'}`}
                            >
                                {player.level >= 20 ? `EXECUTE REBORN.EXE (+${stats.nextRebornPoints} RP)` : 'LEVEL 20 REQUIRED'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

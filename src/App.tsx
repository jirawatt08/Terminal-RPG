import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Shield, Sword, Coins, Heart, Zap, Package, Skull, Play, Square, ChevronRight, Star, ArrowUpCircle, Home, Hammer } from 'lucide-react';
import { Player, Enemy, GameState, LogEntry, Item, PlayerClass } from './types';
import { RARITY_COLORS } from './constants';
import { generateEnemies, generateLoot, generateId } from './utils';

const CLASS_SKILLS = {
  Novice: null,
  Warrior: { name: 'Heavy Strike', cost: 20, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: false },
  Rogue: { name: 'Assassinate', cost: 15, type: 'physical', mult: 1.5, guaranteedCrit: true, aoe: false },
  Mage: { name: 'Fireball', cost: 30, type: 'magic', mult: 2.5, guaranteedCrit: false, aoe: true }
} as const;

type TerminalTab = 'ALL' | 'FIGHT' | 'DROP' | 'SELL';

export default function App() {
  const [player, setPlayer] = useState<Player>({
    level: 1, exp: 0, maxExp: 100, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    baseAttack: 10, baseDefense: 5, gold: 0, stage: 1, statPoints: 0,
    stats: { str: 5, agi: 5, vit: 5, int: 5 },
    playerClass: 'Novice', inventory: [],
    equipment: { weapon: null, armor: null, accessory: null },
    autoSell: { Common: false, Uncommon: false, Rare: false, Epic: false, Legendary: false, Mythic: false, Divine: false },
    autoSkill: false,
  });

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TerminalTab>('ALL');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const queuedSkillRef = useRef(false);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-99), { id: generateId(), timestamp: new Date(), text, type }]);
  }, []);

  useEffect(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [logs]);

  useEffect(() => {
    addLog('SYSTEM INITIALIZED. WELCOME TO TERMINAL RPG v2.0.0', 'system');
    addLog('Type or click commands to begin your process.', 'info');
  }, [addLog]);

  // Calculate derived stats
  const strMilestones = Math.floor(player.stats.str / 10);
  const agiMilestones = Math.floor(player.stats.agi / 10);
  const vitMilestones = Math.floor(player.stats.vit / 10);
  const intMilestones = Math.floor(player.stats.int / 10);

  const bonusAtkPct = strMilestones * 0.05;
  const bonusCritDmg = 1.5 + (strMilestones * 0.10) + (player.playerClass === 'Rogue' ? 0.2 : 0);
  
  const bonusCritChance = agiMilestones * 2 + (player.playerClass === 'Rogue' ? 10 : 0);
  const bonusDodgeChance = agiMilestones * 2;

  const bonusHpPct = vitMilestones * 0.05 + (player.playerClass === 'Warrior' ? 0.1 : 0);
  const bonusDefPct = vitMilestones * 0.05 + (player.playerClass === 'Warrior' ? 0.1 : 0);

  const bonusManaRegen = intMilestones * 2 + (player.playerClass === 'Mage' ? 5 : 0);
  const bonusMagicDmgPct = intMilestones * 0.05 + (player.playerClass === 'Mage' ? 0.2 : 0);

  const getSetBonus = () => {
    const eq = player.equipment;
    const sets = [eq.weapon?.setName, eq.armor?.setName, eq.accessory?.setName].filter(Boolean);
    const counts = sets.reduce((acc, name) => { acc[name!] = (acc[name!] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).filter(([_, count]) => count >= 2).map(([name]) => name);
  };

  const activeSets = getSetBonus();
  const setBonusMultiplier = 1 + (activeSets.length * 0.15); // 15% bonus per active set

  const maxHp = Math.floor((player.maxHp + (player.stats.vit * 10)) * (1 + bonusHpPct));
  const maxMp = 50 + (player.stats.int * 5);

  const getEquipmentValue = (item: Item | null) => {
    if (!item) return 0;
    return Math.floor(item.value * (1 + item.upgradeLevel * 0.2));
  };

  const totalAttack = Math.floor((player.baseAttack + (player.stats.str * 2) + getEquipmentValue(player.equipment.weapon)) * setBonusMultiplier * (1 + bonusAtkPct));
  const totalDefense = Math.floor((player.baseDefense + (player.stats.vit * 1.5) + getEquipmentValue(player.equipment.armor)) * setBonusMultiplier * (1 + bonusDefPct));
  const totalMagicAttack = Math.floor((player.stats.int * 2 + getEquipmentValue(player.equipment.weapon)) * setBonusMultiplier * (1 + bonusMagicDmgPct));
  
  const getEffectTotal = (type: 'lifesteal' | 'crit' | 'dodge') => {
    let total = 0;
    Object.values(player.equipment).forEach(item => {
      if (item?.effect?.type === type) total += item.effect.value;
    });
    return total;
  };

  const critChance = getEffectTotal('crit') + bonusCritChance;
  const dodgeChance = getEffectTotal('dodge') + bonusDodgeChance;
  const lifesteal = getEffectTotal('lifesteal');

  // Game Loop
  useEffect(() => {
    if (gameState === 'IDLE') return;

    const interval = setInterval(() => {
      setPlayer(prevPlayer => {
        let newPlayer = { ...prevPlayer };

        if (gameState === 'DEAD') {
          if (newPlayer.hp < maxHp) {
            newPlayer.hp = Math.min(maxHp, newPlayer.hp + maxHp * 0.1);
            if (newPlayer.hp === maxHp) {
              addLog('SYSTEM REBOOT COMPLETE. HP RESTORED.', 'success');
              setGameState('IDLE');
            } else addLog(`Rebooting... HP: ${Math.floor(newPlayer.hp)}/${maxHp}`, 'system');
          }
          return newPlayer;
        }

        // Regen MP
        if (newPlayer.mp < maxMp && gameState !== 'DEAD') {
          newPlayer.mp = Math.min(maxMp, newPlayer.mp + 1 + bonusManaRegen);
        }

        if (gameState === 'VILLAGE') return newPlayer;

        let enemies = [...currentEnemies];

        if (enemies.length === 0) {
          enemies = generateEnemies(newPlayer.level, newPlayer.stage, gameState === 'BOSS_FIGHT');
          setCurrentEnemies(enemies);
          if (enemies.length > 1) {
            addLog(`[ENCOUNTER] Found a group of ${enemies.length} monsters!`, 'warning');
          } else {
            addLog(`[ENCOUNTER] Found ${enemies[0].name} (HP: ${enemies[0].hp})`, 'warning');
          }
          return newPlayer;
        }

        // Player attacks
        let usedSkill = false;
        let skillName = '';
        let isCrit = Math.random() * 100 < critChance;

        const skill = CLASS_SKILLS[newPlayer.playerClass];
        const canCastSkill = skill && newPlayer.mp >= skill.cost;
        const shouldCastSkill = canCastSkill && (newPlayer.autoSkill || queuedSkillRef.current);

        let targets = [enemies[0]];
        let damageToEnemy = 0;

        if (shouldCastSkill && skill) {
          usedSkill = true;
          skillName = skill.name;
          newPlayer.mp -= skill.cost;
          queuedSkillRef.current = false;

          if (skill.aoe) {
            targets = [...enemies];
          }

          if (skill.type === 'physical') {
            if (skill.guaranteedCrit) isCrit = true;
            damageToEnemy = Math.floor(totalAttack * skill.mult);
          } else if (skill.type === 'magic') {
            damageToEnemy = Math.floor(totalMagicAttack * skill.mult);
          }
        } else {
          damageToEnemy = totalAttack + Math.floor(Math.random() * 5);
        }

        if (isCrit) {
          damageToEnemy = Math.floor(damageToEnemy * bonusCritDmg);
        }

        let totalLifestealHeal = 0;

        targets.forEach(target => {
          let finalDamage = Math.max(1, damageToEnemy - (usedSkill && skill?.type === 'magic' ? Math.floor(target.defense * 0.5) : target.defense));
          
          if (isCrit) {
            if (usedSkill) {
              addLog(`> CRITICAL SKILL! Used [${skillName}] on ${target.name} for ${finalDamage} dmg.`, 'combat');
            } else {
              addLog(`> CRITICAL HIT! Executed attack on ${target.name} for ${finalDamage} dmg.`, 'combat');
            }
          } else {
            if (usedSkill) {
              addLog(`> Used [${skillName}] on ${target.name} for ${finalDamage} dmg.`, 'combat');
            } else {
              addLog(`> Executed attack on ${target.name} for ${finalDamage} dmg.`, 'combat');
            }
          }
          
          target.hp -= finalDamage;

          if (lifesteal > 0) {
            totalLifestealHeal += Math.floor(finalDamage * (lifesteal / 100));
          }
        });

        if (totalLifestealHeal > 0 && newPlayer.hp < maxHp) {
          newPlayer.hp = Math.min(maxHp, newPlayer.hp + totalLifestealHeal);
          addLog(`> Lifesteal restored ${totalLifestealHeal} HP.`, 'success');
        }

        // Process dead enemies
        const survivingEnemies = [];
        for (const target of enemies) {
          if (target.hp <= 0) {
            addLog(`[KILL] ${target.name} terminated.`, 'success');
            newPlayer.exp += target.expReward;
            newPlayer.gold += target.goldReward;
            addLog(`+ ${target.expReward} EXP | + ${target.goldReward} Gold`, 'info');

            if (newPlayer.exp >= newPlayer.maxExp) {
              newPlayer.level += 1;
              newPlayer.exp -= newPlayer.maxExp;
              newPlayer.maxExp = Math.floor(newPlayer.maxExp * 1.5);
              newPlayer.statPoints += 3;
              newPlayer.hp = maxHp;
              addLog(`[LEVEL UP] Reached Level ${newPlayer.level}! +3 Stat Points.`, 'success');
              if (newPlayer.level === 10 && newPlayer.playerClass === 'Novice') {
                addLog(`[CLASS UNLOCK] You reached Lv.10! Choose a class in the stats panel.`, 'system');
              }
            }

            const loot = generateLoot(newPlayer.level, newPlayer.stage, target.isBoss);
            if (loot) {
              if (newPlayer.autoSell[loot.rarity]) {
                newPlayer.gold += loot.sellPrice;
                addLog(`[AUTO-SELL] Sold ${loot.name} (${loot.rarity}) for ${loot.sellPrice}G.`, 'sell');
              } else {
                newPlayer.inventory.push(loot);
                addLog(`[LOOT] Acquired ${loot.name} (${loot.rarity})!`, 'loot');
              }
            }
          } else {
            survivingEnemies.push(target);
          }
        }
        
        enemies = survivingEnemies;

        if (enemies.length === 0) {
          setCurrentEnemies([]);
          if (gameState === 'BOSS_FIGHT') {
            newPlayer.stage += 1;
            addLog(`Boss defeated! Advancing to Stage ${newPlayer.stage}. Returning to IDLE mode.`, 'system');
            setGameState('IDLE');
          }
          return newPlayer;
        }

        // Enemies attack
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          const isDodged = Math.random() * 100 < dodgeChance;
          if (isDodged) {
            addLog(`< EVADED! ${enemy.name}'s attack missed.`, 'success');
          } else {
            let damageToPlayer = 0;
            if (enemy.skill && enemy.skill.currentCooldown <= 0) {
              damageToPlayer = Math.max(1, Math.floor(enemy.attack * enemy.skill.mult) - totalDefense + Math.floor(Math.random() * 3));
              enemy.skill.currentCooldown = enemy.skill.cooldown;
              addLog(`< [SKILL] ${enemy.name} used ${enemy.skill.name} for ${damageToPlayer} dmg!`, 'error');
            } else {
              damageToPlayer = Math.max(1, enemy.attack - totalDefense + Math.floor(Math.random() * 3));
              if (enemy.skill) enemy.skill.currentCooldown -= 1;
              addLog(`< ${enemy.name} attacked you for ${damageToPlayer} dmg.`, 'error');
            }
            newPlayer.hp -= damageToPlayer;
          }

          if (newPlayer.hp <= 0) {
            newPlayer.hp = 0;
            addLog('CRITICAL FAILURE. HP DEPLETED. INITIATING REBOOT SEQUENCE...', 'error');
            setGameState('DEAD');
            setCurrentEnemies([]);
            break;
          }
        }

        if (newPlayer.hp > 0) {
          setCurrentEnemies(enemies);
        }
        return newPlayer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentEnemies, totalAttack, totalDefense, totalMagicAttack, maxHp, maxMp, critChance, dodgeChance, lifesteal, bonusCritDmg, bonusManaRegen, addLog]);

  // Actions
  const startFarming = () => { if (gameState !== 'DEAD') { setGameState('FARMING'); addLog('Starting auto-farm routine...', 'system'); } };
  const startBossFight = () => { if (gameState !== 'DEAD') { setGameState('BOSS_FIGHT'); addLog('WARNING: Initiating boss encounter...', 'warning'); } };
  const stopAction = () => { if (gameState !== 'DEAD') { setGameState('IDLE'); setCurrentEnemies([]); addLog('Routine halted. Standing by.', 'system'); } };
  const enterVillage = () => { if (gameState !== 'DEAD' && gameState !== 'BOSS_FIGHT') { setGameState('VILLAGE'); setCurrentEnemies([]); addLog('Entering Village...', 'system'); } };

  const equipItem = (item: Item) => {
    setPlayer(prev => {
      const newPlayer = { ...prev };
      const currentEquipped = newPlayer.equipment[item.type.toLowerCase() as keyof typeof newPlayer.equipment];
      newPlayer.inventory = newPlayer.inventory.filter(i => i.id !== item.id);
      if (currentEquipped) newPlayer.inventory.push(currentEquipped);
      newPlayer.equipment[item.type.toLowerCase() as keyof typeof newPlayer.equipment] = item;
      addLog(`Equipped ${item.name}.`, 'system');
      return newPlayer;
    });
  };

  const sellItem = (item: Item) => {
    setPlayer(prev => {
      const newPlayer = { ...prev };
      newPlayer.inventory = newPlayer.inventory.filter(i => i.id !== item.id);
      newPlayer.gold += item.sellPrice;
      addLog(`Sold ${item.name} for ${item.sellPrice} Gold.`, 'sell');
      return newPlayer;
    });
  };

  const upgradeItem = (item: Item, isEquipped: boolean) => {
    const cost = Math.floor(item.value * 0.5 * Math.pow(1.5, item.upgradeLevel));
    if (player.gold < cost) {
      addLog(`Not enough gold to upgrade ${item.name}. Need ${cost}G.`, 'error');
      return;
    }

    setPlayer(prev => {
      const newPlayer = { ...prev };
      newPlayer.gold -= cost;
      
      const upgradedItem = { ...item, upgradeLevel: item.upgradeLevel + 1 };

      if (isEquipped) {
        newPlayer.equipment[item.type] = upgradedItem;
      } else {
        const idx = newPlayer.inventory.findIndex(i => i.id === item.id);
        if (idx !== -1) newPlayer.inventory[idx] = upgradedItem;
      }
      return newPlayer;
    });
    addLog(`Upgraded ${item.name} to +${item.upgradeLevel + 1}!`, 'success');
  };

  const heal = () => {
    if (player.gold >= 50 && player.hp < maxHp) {
      setPlayer(prev => ({ ...prev, gold: prev.gold - 50, hp: maxHp }));
      addLog('Executed healing protocol. -50 Gold.', 'success');
    } else if (player.gold < 50) addLog('Insufficient funds for healing protocol.', 'error');
    else addLog('HP already at maximum capacity.', 'info');
  };

  const allocateStat = (stat: keyof Player['stats']) => {
    if (player.statPoints > 0) {
      setPlayer(prev => ({
        ...prev,
        statPoints: prev.statPoints - 1,
        stats: { ...prev.stats, [stat]: prev.stats[stat] + 1 }
      }));
    }
  };

  const chooseClass = (cls: PlayerClass) => {
    if (player.level >= 10 && player.playerClass === 'Novice') {
      setPlayer(prev => ({ ...prev, playerClass: cls }));
      addLog(`Class upgraded to ${cls}!`, 'success');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'FIGHT') return ['combat', 'warning', 'error'].includes(log.type);
    if (activeTab === 'DROP') return log.type === 'loot';
    if (activeTab === 'SELL') return log.type === 'sell';
    return true;
  });

  return (
    <div className="min-h-screen md:h-screen bg-[#0a0a0a] text-[#00ff00] font-mono p-4 flex flex-col md:flex-row gap-4 selection:bg-[#00ff00] selection:text-black md:overflow-hidden">
      
      {/* Left Panel: Stats & Equipment */}
      <div className="w-full md:w-1/4 flex flex-col gap-4 md:h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent pr-2">
        <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm shadow-[0_0_10px_rgba(0,255,0,0.1)]">
          <h2 className="text-xl font-bold mb-4 border-b border-[#00ff00]/30 pb-2 flex items-center gap-2">
            <Terminal size={20} /> SYS_STATUS
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>CLASS:</span> <span className="text-purple-400">{player.playerClass}</span></div>
            <div className="flex justify-between"><span>STAGE:</span> <span className="text-yellow-400">{player.stage}</span></div>
            <div className="flex justify-between"><span>LEVEL:</span> <span>{player.level}</span></div>
            <div className="flex justify-between"><span>EXP:</span> <span>{player.exp} / {player.maxExp}</span></div>
            
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> HP:</span>
                <span>{Math.floor(player.hp)} / {maxHp}</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-red-900/50">
                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${(player.hp / maxHp) * 100}%` }} />
              </div>

              <div className="flex justify-between mb-1 mt-2">
                <span className="flex items-center gap-1"><Zap size={14} className="text-blue-500" /> MP:</span>
                <span>{Math.floor(player.mp)} / {maxMp}</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-blue-900/50">
                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${(player.mp / maxMp) * 100}%` }} />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1"><Sword size={14} /> ATK:</span> 
                <span>{totalAttack}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1"><Shield size={14} /> DEF:</span> 
                <span>{totalDefense}</span>
              </div>
              <div className="flex justify-between text-yellow-400">
                <span className="flex items-center gap-1"><Coins size={14} /> GOLD:</span> 
                <span>{player.gold}</span>
              </div>
            </div>

            {/* Stats Allocation */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between mb-2 text-xs text-gray-400">
                <span>ATTRIBUTES</span>
                {player.statPoints > 0 && <span className="text-yellow-400 animate-pulse">{player.statPoints} PTS</span>}
              </div>
              {(['str', 'agi', 'vit', 'int'] as const).map(stat => (
                <div key={stat} className="flex justify-between items-center text-xs mb-1">
                  <span className="uppercase">{stat}: {player.stats[stat]}</span>
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
              {strMilestones === 0 && agiMilestones === 0 && vitMilestones === 0 && intMilestones === 0 && <div>None active.</div>}
            </div>

            {/* Class Passives */}
            {player.playerClass !== 'Novice' && (
              <div className="mt-4 pt-4 border-t border-gray-800 text-[10px] text-purple-400/80 space-y-1">
                <div className="text-purple-400 mb-1">CLASS PASSIVE</div>
                {player.playerClass === 'Warrior' && <div>Toughness: +10% Base HP & DEF</div>}
                {player.playerClass === 'Rogue' && <div>Lethality: +10% Crit Rate, +20% Crit DMG</div>}
                {player.playerClass === 'Mage' && <div>Arcane Mastery: +20% Magic DMG, +5 MP Regen</div>}
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
          </div>
        </div>

        <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm flex-1">
          <h2 className="text-xl font-bold mb-4 border-b border-[#00ff00]/30 pb-2 flex items-center gap-2">
            <Package size={20} /> INVENTORY
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xs text-gray-500 mb-2">EQUIPPED</h3>
            <div className="space-y-2">
              {(['weapon', 'armor', 'accessory'] as const).map(slot => {
                const item = player.equipment[slot];
                return (
                  <div key={slot} className="border border-gray-800 p-2 text-xs flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 uppercase">{slot.substring(0,3)}:</span>
                      {item ? <span className={RARITY_COLORS[item.rarity]}>{item.name}</span> : <span className="text-gray-600">NONE</span>}
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
                  Active Sets: {activeSets.join(', ')} (+{activeSets.length * 15}% Stats)
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs text-gray-500 mb-2">ITEMS ({player.inventory.length})</h3>
            <div className="space-y-2">
              {player.inventory.length === 0 && <div className="text-gray-600 text-xs text-center py-4">EMPTY</div>}
              {player.inventory.map(item => (
                <div key={item.id} className="border border-gray-800 p-2 text-xs group hover:border-[#00ff00]/50 transition-colors">
                  <div className="flex justify-between mb-1">
                    <span className={RARITY_COLORS[item.rarity]}>{item.name}</span>
                    <span className="text-gray-400">+{item.value} {item.type === 'Weapon' ? 'ATK' : 'DEF'}</span>
                  </div>
                  {item.effect && <div className="text-[10px] text-blue-400 mb-1">+{item.effect.value}% {item.effect.type}</div>}
                  <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-yellow-500">{item.sellPrice}G</span>
                    <div className="flex gap-2">
                      <button onClick={() => equipItem(item)} className="px-2 py-1 bg-[#00ff00]/10 hover:bg-[#00ff00]/30 text-[#00ff00] rounded cursor-pointer">Equip</button>
                      <button onClick={() => sellItem(item)} className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-500 rounded cursor-pointer">Sell</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel: Console Log */}
      <div className="w-full md:w-2/4 flex flex-col border border-[#00ff00]/30 bg-[#050505] rounded-sm relative shadow-[0_0_20px_rgba(0,255,0,0.05)] h-[60vh] md:h-full">
        <div className="bg-[#111] border-b border-[#00ff00]/30 p-2 flex justify-between items-center text-xs text-gray-400">
          <span>root@terminal-rpg:~</span>
          <span className="flex items-center gap-2">
            STATE: 
            <span className={`font-bold ${
              gameState === 'IDLE' ? 'text-gray-400' : 
              gameState === 'FARMING' ? 'text-green-400' : 
              gameState === 'BOSS_FIGHT' ? 'text-red-500' : 'text-red-700 animate-pulse'
            }`}>
              [{gameState}]
            </span>
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-mono scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 leading-relaxed">
              <span className="text-gray-600 shrink-0">
                [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
              </span>
              <span className={`
                ${log.type === 'info' ? 'text-gray-300' : ''}
                ${log.type === 'combat' ? 'text-gray-400' : ''}
                ${log.type === 'loot' ? 'text-blue-400' : ''}
                ${log.type === 'error' ? 'text-red-500' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'system' ? 'text-[#00ff00]' : ''}
                ${log.type === 'warning' ? 'text-yellow-400' : ''}
              `}>
                {log.type === 'system' && '> '}
                {log.text}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Current Enemy HUD */}
        {currentEnemies.length > 0 && (
          <div className="absolute top-12 right-4 flex flex-col gap-2 w-48">
            {currentEnemies.map((enemy, idx) => (
              <div key={enemy.id} className={`border ${idx === 0 ? 'border-red-500' : 'border-red-900/50'} bg-black/80 backdrop-blur p-3 rounded-sm shadow-lg`}>
                <div className="text-xs text-red-500 font-bold mb-1 flex justify-between">
                  <span className="truncate pr-2">{idx === 0 ? 'TARGET: ' : ''}{enemy.name}</span>
                  {enemy.isBoss && <Skull size={14} className="shrink-0" />}
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-red-500 h-full transition-all duration-300" 
                    style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-gray-500">
                    {Math.max(0, enemy.hp)} / {enemy.maxHp} HP
                  </div>
                  {enemy.skill && (
                    <div className="text-[9px] text-orange-400">
                      {enemy.skill.currentCooldown <= 0 ? 'SKILL READY' : `CD: ${enemy.skill.currentCooldown}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Command Input Area (Visual only) */}
        <div className="border-t border-[#00ff00]/30 p-3 bg-[#0a0a0a] flex items-center gap-2 text-sm">
          <ChevronRight size={16} className="text-[#00ff00]" />
          <span className="text-[#00ff00] animate-pulse">_</span>
        </div>
      </div>

      {/* Right Panel: Controls */}
      <div className="w-full md:w-1/4 flex flex-col gap-4 md:h-full">
        <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm">
          <h2 className="text-xl font-bold mb-4 border-b border-[#00ff00]/30 pb-2 flex items-center gap-2">
            <Zap size={20} /> COMMANDS
          </h2>
          
          <div className="space-y-3">
            <button 
              onClick={startFarming}
              disabled={gameState === 'FARMING' || gameState === 'DEAD'}
              className="w-full flex items-center justify-between p-3 border border-[#00ff00]/50 hover:bg-[#00ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./run_auto_farm.sh</span>
              <Play size={16} />
            </button>

            <button 
              onClick={startBossFight}
              disabled={gameState === 'BOSS_FIGHT' || gameState === 'DEAD'}
              className="w-full flex items-center justify-between p-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./execute_boss.exe</span>
              <Skull size={16} />
            </button>

            <button 
              onClick={stopAction}
              disabled={gameState === 'IDLE' || gameState === 'DEAD'}
              className="w-full flex items-center justify-between p-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>^C (SIGINT)</span>
              <Square size={16} />
            </button>

            <div className="pt-4 border-t border-gray-800">
              <button 
                onClick={heal}
                disabled={player.gold < 50 || player.hp >= maxHp || gameState === 'DEAD'}
                className="w-full flex items-center justify-between p-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
              >
                <span>sudo apt-get heal</span>
                <span className="text-xs">-50G</span>
              </button>
            </div>

            {player.playerClass !== 'Novice' && CLASS_SKILLS[player.playerClass] && (
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                  <span>CLASS SKILL</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={player.autoSkill} 
                      onChange={(e) => setPlayer(p => ({ ...p, autoSkill: e.target.checked }))}
                      className="accent-[#00ff00]"
                    />
                    Auto
                  </label>
                </div>
                <button 
                  onClick={() => { queuedSkillRef.current = true; }}
                  disabled={player.mp < CLASS_SKILLS[player.playerClass]!.cost || gameState === 'DEAD' || gameState === 'IDLE'}
                  className="w-full flex items-center justify-between p-3 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                >
                  <span>Cast {CLASS_SKILLS[player.playerClass]!.name}</span>
                  <span className="text-xs">-{CLASS_SKILLS[player.playerClass]!.cost} MP</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border border-[#00ff00]/30 bg-[#111] p-4 rounded-sm flex-1 overflow-y-auto">
          <h2 className="text-sm font-bold mb-2 text-gray-500">SYSTEM_INFO</h2>
          <div className="text-xs text-gray-600 space-y-2">
            <p>Welcome to Terminal RPG v2.</p>
            <p>Defeat bosses to advance stages and get better loot.</p>
            <p>Level up to gain Stat Points. At Lv.10, choose a Class.</p>
            <p className="text-purple-400/70">Equip items with the same Set Name to gain a 15% stat multiplier.</p>
            <p className="text-blue-400/70">Epic+ items have special effects (Lifesteal, Crit, Dodge).</p>
          </div>

          <h2 className="text-sm font-bold mt-6 mb-2 text-gray-500">AUTO-SELL FILTER</h2>
          <div className="flex flex-wrap gap-2">
            {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine'] as const).map(r => (
              <button
                key={r}
                onClick={() => setPlayer(p => ({ ...p, autoSell: { ...p.autoSell, [r]: !p.autoSell[r] } }))}
                className={`text-[10px] px-2 py-1 border rounded transition-colors cursor-pointer ${
                  player.autoSell[r] 
                    ? 'bg-[#00ff00]/20 border-[#00ff00] text-[#00ff00]' 
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

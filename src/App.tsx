import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Shield, Sword, Coins, Heart, Zap, Package, Skull, Play, Square, ChevronRight, Star, ArrowUpCircle, Home, Hammer, Info } from 'lucide-react';
import { Player, Enemy, GameState, LogEntry, Item, PlayerClass, Rarity } from './types';
import { RARITY_COLORS } from './constants';
import { generateEnemies, generateLoot, generateId } from './utils';

const CLASS_SKILLS = {
  Novice: null,
  Warrior: { name: 'Heavy Strike', cost: 20, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: false, cooldown: 3 },
  Rogue: { name: 'Assassinate', cost: 15, type: 'physical', mult: 1.5, guaranteedCrit: true, aoe: false, cooldown: 2 },
  Mage: { name: 'Fireball', cost: 30, type: 'magic', mult: 2.5, guaranteedCrit: false, aoe: true, cooldown: 4 },
  Paladin: { name: 'Holy Smite', cost: 40, type: 'magic', mult: 3.0, guaranteedCrit: false, aoe: true, cooldown: 5 },
  Berserker: { name: 'Rampage', cost: 35, type: 'physical', mult: 3.5, guaranteedCrit: false, aoe: false, cooldown: 4 },
  Assassin: { name: 'Shadow Strike', cost: 25, type: 'physical', mult: 2.5, guaranteedCrit: true, aoe: false, cooldown: 3 },
  Ranger: { name: 'Arrow Rain', cost: 30, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: true, cooldown: 4 },
  Archmage: { name: 'Meteor', cost: 60, type: 'magic', mult: 5.0, guaranteedCrit: false, aoe: true, cooldown: 6 },
  Necromancer: { name: 'Soul Drain', cost: 45, type: 'magic', mult: 3.0, guaranteedCrit: false, aoe: false, cooldown: 5 }
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
    inventoryLimit: 20,
    autoSellUnlocked: false,
    skillCooldown: 0,
    statusEffects: [],
  });

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TerminalTab>('ALL');
  const [sysStatusTab, setSysStatusTab] = useState<'ATTRIBUTES' | 'EQUIPPED' | 'CHARACTER'>('ATTRIBUTES');
  const [villageTab, setVillageTab] = useState<'BLACKSMITH' | 'MERCHANT'>('BLACKSMITH');
  const [inventorySort, setInventorySort] = useState<'STAT' | 'RARITY'>('STAT');
  const [barMode, setBarMode] = useState<'bar' | 'number' | 'percent'>('bar');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const queuedSkillRef = useRef(false);

  const ProgressBar = ({ current, max, color }: { current: number, max: number, color: string }) => {
    const pct = Math.min(100, Math.max(0, (current / max) * 100));
    if (barMode === 'number') return <div className="text-right text-xs font-mono -mt-4">{current} / {max}</div>;
    if (barMode === 'percent') return <div className="text-right text-xs font-mono -mt-4">{pct.toFixed(1)}%</div>;
    return (
      <>
        <div className="text-right text-xs font-mono -mt-5 mb-1">{current} / {max}</div>
        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
          <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
        </div>
      </>
    );
  };

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

  const bonusAtkPct = strMilestones * 0.05 + (player.playerClass === 'Berserker' ? 0.3 : 0);
  const bonusCritDmg = 1.5 + (strMilestones * 0.10) + (player.playerClass === 'Rogue' ? 0.2 : player.playerClass === 'Assassin' ? 0.4 : 0);
  
  const bonusCritChance = agiMilestones * 2 + (player.playerClass === 'Rogue' ? 10 : player.playerClass === 'Assassin' ? 20 : player.playerClass === 'Ranger' ? 15 : 0);
  const bonusDodgeChance = agiMilestones * 2 + (player.playerClass === 'Ranger' ? 15 : 0);

  const bonusHpPct = vitMilestones * 0.05 + (player.playerClass === 'Warrior' ? 0.1 : player.playerClass === 'Paladin' ? 0.2 : 0);
  const bonusDefPct = vitMilestones * 0.05 + (player.playerClass === 'Warrior' ? 0.1 : player.playerClass === 'Paladin' ? 0.2 : 0);

  const bonusManaRegen = intMilestones * 2 + (player.playerClass === 'Mage' ? 5 : player.playerClass === 'Archmage' ? 15 : 0);
  const bonusMagicDmgPct = intMilestones * 0.05 + (player.playerClass === 'Mage' ? 0.2 : player.playerClass === 'Archmage' ? 0.4 : player.playerClass === 'Necromancer' ? 0.2 : player.playerClass === 'Paladin' ? 0.1 : 0);


  const getSetBonus = () => {
    const eq = player.equipment;
    const sets = [eq.weapon?.setName, eq.armor?.setName, eq.accessory?.setName].filter(Boolean);
    const counts = sets.reduce((acc, name) => { acc[name!] = (acc[name!] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).filter(([_, count]) => (count as number) >= 2).map(([name]) => name);
  };

  const activeSets = getSetBonus();
  const hasSet = (name: string) => activeSets.includes(name);
  
  const setBonusAtkPct = (hasSet('Berserker') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
  const setBonusDefPct = (hasSet('Iron') ? 0.2 : 0) + (hasSet('Guardian') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
  const setBonusMagicPct = (hasSet('Sage') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
  const setBonusHpPct = (hasSet('Guardian') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
  const setBonusMpPct = (hasSet('Sage') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
  const setBonusGoldPct = (hasSet('Merchant') ? 0.5 : 0);
  const setBonusExpPct = (hasSet('Explorer') ? 0.5 : 0);
  const setBonusDodge = (hasSet('Phantom') ? 15 : 0) + (hasSet('Shadow') ? 10 : 0);
  const setBonusCrit = (hasSet('Assassin') ? 15 : 0) + (hasSet('Shadow') ? 10 : 0);
  const setBonusLifesteal = (hasSet('Vampire') ? 15 : 0);

  const maxHp = Math.floor((player.maxHp + (player.stats.vit * 10)) * (1 + bonusHpPct + setBonusHpPct));
  const classBonusMp = (player.playerClass === 'Mage' ? 50 : player.playerClass === 'Archmage' ? 150 : player.playerClass === 'Necromancer' ? 100 : player.playerClass === 'Paladin' ? 50 : 0);
  const maxMp = Math.floor((player.maxMp + (player.stats.int * 5) + classBonusMp) * (1 + setBonusMpPct));

  const getEquipmentValue = (item: Item | null) => {
    if (!item) return 0;
    return Math.floor(item.value * (1 + (item.upgradeLevel || 0) * 0.2));
  };

  const totalAttack = Math.floor((player.baseAttack + (player.stats.str * 2) + getEquipmentValue(player.equipment.weapon)) * (1 + bonusAtkPct + setBonusAtkPct));
  const totalDefense = Math.floor((player.baseDefense + (player.stats.vit * 1.5) + getEquipmentValue(player.equipment.armor)) * (1 + bonusDefPct + setBonusDefPct));
  const totalMagicAttack = Math.floor((player.stats.int * 2 + getEquipmentValue(player.equipment.weapon)) * (1 + bonusMagicDmgPct + setBonusMagicPct));
  
  const getEffectTotal = (type: 'lifesteal' | 'crit' | 'dodge') => {
    let total = 0;
    Object.values(player.equipment).forEach(item => {
      const i = item as Item | null;
      if (i?.effect?.type === type) total += i.effect.value;
    });
    return total;
  };

  let critChance = getEffectTotal('crit') + bonusCritChance + setBonusCrit;
  let finalCritDmg = bonusCritDmg;
  if (critChance > 100) {
    finalCritDmg += (critChance - 100) / 100;
    critChance = 100;
  }
  const dodgeChance = getEffectTotal('dodge') + bonusDodgeChance + setBonusDodge;
  const lifesteal = getEffectTotal('lifesteal') + (player.playerClass === 'Berserker' ? 10 : player.playerClass === 'Necromancer' ? 15 : 0) + setBonusLifesteal;

  // Game Loop
  useEffect(() => {
    if (gameState === 'IDLE') return;

    const interval = setInterval(() => {
      setPlayer(prevPlayer => {
        let newPlayer = { 
          ...prevPlayer, 
          inventory: [...prevPlayer.inventory],
          equipment: { ...prevPlayer.equipment }
        };

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
          const isBossFight = gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT';
          const targetStage = gameState === 'NEXT_BOSS_FIGHT' ? newPlayer.stage + 1 : newPlayer.stage;
          enemies = generateEnemies(newPlayer.level, targetStage, isBossFight);
          setCurrentEnemies(enemies);
          if (enemies.length > 1) {
            addLog(`[ENCOUNTER] Found a group of ${enemies.length} monsters!`, 'warning');
          } else {
            addLog(`[ENCOUNTER] Found ${enemies[0].name} (HP: ${enemies[0].hp})`, 'warning');
          }
          return newPlayer;
        }

        // Process player status effects
        let isPlayerStunned = false;
        newPlayer.statusEffects = newPlayer.statusEffects.filter(effect => {
          if (effect.type === 'poison' || effect.type === 'burn') {
            const dmg = effect.value || 5;
            newPlayer.hp -= dmg;
            addLog(`[STATUS] You took ${dmg} damage from ${effect.type}.`, 'error');
          } else if (effect.type === 'stun' || effect.type === 'freeze') {
            isPlayerStunned = true;
          }
          effect.duration -= 1;
          return effect.duration > 0;
        });

        if (newPlayer.hp <= 0) {
          newPlayer.hp = 0;
          addLog('CRITICAL FAILURE. HP DEPLETED. INITIATING REBOOT SEQUENCE...', 'error');
          setGameState('DEAD');
          setCurrentEnemies([]);
          return newPlayer;
        }

        if (newPlayer.skillCooldown > 0) newPlayer.skillCooldown--;

        // Player attacks
        if (!isPlayerStunned) {
          let usedSkill = false;
          let skillName = '';
          let isCrit = Math.random() * 100 < critChance;

          const skill = CLASS_SKILLS[newPlayer.playerClass];
          const canCastSkill = skill && newPlayer.mp >= skill.cost && newPlayer.skillCooldown <= 0;
          const shouldCastSkill = canCastSkill && (newPlayer.autoSkill || queuedSkillRef.current);

          let targets = [enemies[0]];
          let damageToEnemy = 0;

          if (shouldCastSkill && skill) {
            usedSkill = true;
            skillName = skill.name;
            newPlayer.mp -= skill.cost;
            newPlayer.skillCooldown = skill.cooldown;
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
            damageToEnemy = Math.floor(damageToEnemy * finalCritDmg);
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

            // Apply item status effects
            Object.values(newPlayer.equipment).forEach(item => {
              const i = item as Item | null;
              if (i?.effect && ['poison', 'burn', 'stun', 'freeze'].includes(i.effect.type)) {
                if (Math.random() > 0.8) { // 20% chance to apply
                  let effectValue = i.effect.value;
                  if (i.effect.type === 'poison') {
                    effectValue = Math.floor(target.maxHp * 0.05); // 5% of enemy max HP
                  } else if (i.effect.type === 'burn') {
                    effectValue = Math.floor(totalDefense * 0.5); // 50% of player DEF
                  }
                  target.statusEffects.push({
                    type: i.effect.type as import('./types').StatusEffectType,
                    duration: 3,
                    value: effectValue
                  });
                  addLog(`> Applied ${i.effect.type} to ${target.name}!`, 'success');
                }
              }
            });

            if (lifesteal > 0) {
              totalLifestealHeal += Math.floor(finalDamage * (lifesteal / 100));
            }
          });

          if (totalLifestealHeal > 0 && newPlayer.hp < maxHp) {
            newPlayer.hp = Math.min(maxHp, newPlayer.hp + totalLifestealHeal);
            addLog(`> Lifesteal restored ${totalLifestealHeal} HP.`, 'success');
          }
        } else {
          addLog(`> You are stunned/frozen and cannot attack!`, 'warning');
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

            const targetStage = gameState === 'NEXT_BOSS_FIGHT' ? newPlayer.stage + 1 : newPlayer.stage;
            const loot = generateLoot(newPlayer.level, targetStage, target.isBoss);
            if (loot) {
              if (newPlayer.autoSellUnlocked && newPlayer.autoSell[loot.rarity]) {
                newPlayer.gold += loot.sellPrice;
                addLog(`[AUTO-SELL] Sold ${loot.name} (${loot.rarity}) for ${loot.sellPrice}G.`, 'sell');
              } else if (newPlayer.inventory.length < newPlayer.inventoryLimit) {
                newPlayer.inventory.push(loot);
                addLog(`[LOOT] Acquired ${loot.name} (${loot.rarity})!`, 'loot');
              } else {
                addLog(`[LOOT] Inventory full! Dropped ${loot.name} (${loot.rarity}).`, 'warning');
              }
            }
          } else {
            survivingEnemies.push(target);
          }
        }
        
        enemies = survivingEnemies;

        if (enemies.length === 0) {
          setCurrentEnemies([]);
          if (gameState === 'NEXT_BOSS_FIGHT') {
            newPlayer.stage += 1;
            addLog(`Next Boss defeated! Advancing to Stage ${newPlayer.stage}. Returning to IDLE mode.`, 'system');
            setGameState('IDLE');
          } else if (gameState === 'BOSS_FIGHT') {
            addLog(`Current Boss defeated! Returning to IDLE mode.`, 'system');
            setGameState('IDLE');
          }
          return newPlayer;
        }

        // Enemies attack
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          
          let isEnemyStunned = false;
          enemy.statusEffects = enemy.statusEffects.filter(effect => {
            if (effect.type === 'poison' || effect.type === 'burn') {
              const dmg = effect.value || 5;
              enemy.hp -= dmg;
              addLog(`[STATUS] ${enemy.name} took ${dmg} damage from ${effect.type}.`, 'success');
            } else if (effect.type === 'stun' || effect.type === 'freeze') {
              isEnemyStunned = true;
            }
            effect.duration -= 1;
            return effect.duration > 0;
          });

          if (enemy.hp <= 0) continue; // Enemy died from status effect

          if (isEnemyStunned) {
            addLog(`< ${enemy.name} is stunned/frozen and cannot attack!`, 'info');
            continue;
          }

          const isDodged = Math.random() * 100 < dodgeChance;
          if (isDodged) {
            addLog(`< EVADED! ${enemy.name}'s attack missed.`, 'success');
          } else {
            let damageToPlayer = 0;
            if (enemy.skill && enemy.skill.currentCooldown <= 0) {
              damageToPlayer = Math.max(1, Math.floor(enemy.attack * enemy.skill.mult) - totalDefense + Math.floor(Math.random() * 3));
              enemy.skill.currentCooldown = enemy.skill.cooldown;
              addLog(`< [SKILL] ${enemy.name} used ${enemy.skill.name} for ${damageToPlayer} dmg!`, 'error');
              
              if (enemy.skill.effect) {
                let effectValue = enemy.skill.effect.value;
                if (enemy.skill.effect.type === 'poison') {
                  effectValue = Math.floor(maxHp * 0.05); // 5% of player max HP
                } else if (enemy.skill.effect.type === 'burn') {
                  effectValue = Math.floor(enemy.defense * 0.5); // 50% of enemy DEF
                }
                newPlayer.statusEffects.push({ ...enemy.skill.effect, value: effectValue });
                addLog(`< ${enemy.name} applied ${enemy.skill.effect.type} to you!`, 'error');
              }
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

        // Clean up enemies that died from status effects
        enemies = enemies.filter(e => e.hp > 0);

        if (newPlayer.hp > 0) {
          setCurrentEnemies(enemies);
        }
        return newPlayer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentEnemies, totalAttack, totalDefense, totalMagicAttack, maxHp, maxMp, critChance, dodgeChance, lifesteal, finalCritDmg, bonusManaRegen, addLog]);

  // Actions
  const startFarming = () => { if (gameState !== 'DEAD') { setGameState('FARMING'); addLog('Starting auto-farm routine...', 'system'); } };
  const startBossFight = () => { 
    if (gameState !== 'DEAD') { 
      setGameState('BOSS_FIGHT'); 
      addLog(`WARNING: Initiating Stage ${player.stage} boss encounter...`, 'warning'); 
    }
  };
  const startNextBossFight = () => { 
    if (gameState !== 'DEAD' && player.level >= player.stage * 5) { 
      setGameState('NEXT_BOSS_FIGHT'); 
      addLog(`WARNING: Initiating Stage ${player.stage + 1} boss encounter...`, 'warning'); 
    } else if (player.level < player.stage * 5) {
      addLog(`Level ${player.stage * 5} required to challenge the next boss.`, 'error');
    }
  };
  const stopAction = () => { if (gameState !== 'DEAD') { setGameState('IDLE'); setCurrentEnemies([]); addLog('Routine halted. Standing by.', 'system'); } };
  const enterVillage = () => { if (gameState !== 'DEAD' && gameState !== 'BOSS_FIGHT' && gameState !== 'NEXT_BOSS_FIGHT') { setGameState('VILLAGE'); setCurrentEnemies([]); addLog('Entering Village...', 'system'); } };
  const runAway = () => { 
    if (gameState === 'FARMING' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT') { 
      setGameState('IDLE'); 
      setCurrentEnemies([]); 
      addLog('Escaped from combat. Returning to IDLE.', 'system'); 
    } 
  };

  const showHelp = () => {
    addLog('==================================================', 'system');
    addLog('TERMINAL RPG v2 - OFFICIAL DOCUMENTATION', 'system');
    addLog('==================================================', 'system');
    addLog('HOW TO PLAY:', 'info');
    addLog('- Use ./run_auto_farm.sh to start fighting monsters and gain EXP/Gold.', 'info');
    addLog('- At Level 10, you can choose a Class in the ATTRIBUTES tab.', 'info');
    addLog('- Use ./farm_boss.exe to fight the current stage boss for better loot.', 'info');
    addLog('- Use ./advance_stage.exe when you meet the level requirement to progress.', 'info');
    addLog('- cd /village allows you to buy/sell items and upgrade equipment.', 'info');
    addLog(' ', 'system');
    addLog('ITEM DATA & SETS:', 'warning');
    addLog('- Iron: +20% DEF | Berserker: +20% ATK', 'warning');
    addLog('- Guardian: +20% HP/DEF | Sage: +20% MP/Magic ATK', 'warning');
    addLog('- Phantom: +15% Dodge | Assassin: +15% Crit', 'warning');
    addLog('- Vampire: +15% Lifesteal | Shadow: +10% Dodge/Crit', 'warning');
    addLog('- Merchant: +50% Gold | Explorer: +50% EXP', 'warning');
    addLog('- Celestial: +10% All Stats', 'warning');
    addLog('- Mythic/Divine items are Unique (no set needed).', 'warning');
    addLog(' ', 'system');
    addLog('COMBAT MECHANICS:', 'error');
    addLog('- Crit Chance over 100% converts to extra Crit Damage.', 'error');
    addLog('- Poison/Burn deal damage based on Max HP and DEF.', 'error');
    addLog('- Stun/Freeze prevent the target from attacking.', 'error');
    addLog('==================================================', 'system');
  };

  const equipItem = (item: Item) => {
    setPlayer(prev => {
      const newPlayer = { 
        ...prev, 
        inventory: [...prev.inventory],
        equipment: { ...prev.equipment }
      };
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
      const newPlayer = { ...prev, inventory: [...prev.inventory] };
      newPlayer.inventory = newPlayer.inventory.filter(i => i.id !== item.id);
      newPlayer.gold += item.sellPrice;
      addLog(`Sold ${item.name} for ${item.sellPrice} Gold.`, 'sell');
      return newPlayer;
    });
  };

  const upgradeItem = (item: Item, isEquipped: boolean) => {
    const currentLevel = item.upgradeLevel || 0;
    const cost = Math.floor(item.value * 0.5 * Math.pow(1.5, currentLevel));
    if (player.gold < cost) {
      addLog(`Not enough gold to upgrade ${item.name}. Need ${cost}G.`, 'error');
      return;
    }

    setPlayer(prev => {
      const newPlayer = { 
        ...prev, 
        inventory: [...prev.inventory],
        equipment: { ...prev.equipment }
      };
      newPlayer.gold -= cost;
      
      const upgradedItem = { ...item, upgradeLevel: currentLevel + 1 };

      if (isEquipped) {
        newPlayer.equipment[item.type.toLowerCase() as keyof typeof newPlayer.equipment] = upgradedItem;
      } else {
        const idx = newPlayer.inventory.findIndex(i => i.id === item.id);
        if (idx !== -1) newPlayer.inventory[idx] = upgradedItem;
      }
      return newPlayer;
    });
    addLog(`Upgraded ${item.name} to +${currentLevel + 1}!`, 'success');
  };

  const heal = () => {
    if (player.gold >= 50 && (player.hp < maxHp || player.mp < maxMp)) {
      setPlayer(prev => ({ ...prev, gold: prev.gold - 50, hp: maxHp, mp: maxMp }));
      addLog('Executed healing protocol. HP and MP restored. -50 Gold.', 'success');
    } else if (player.gold < 50) addLog('Insufficient funds for healing protocol.', 'error');
    else addLog('HP and MP already at maximum capacity.', 'info');
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
    } else if (player.level >= 50 && player.stage >= 10 && ['Warrior', 'Rogue', 'Mage'].includes(player.playerClass)) {
      setPlayer(prev => ({ ...prev, playerClass: cls }));
      addLog(`Tier 2 Class upgraded to ${cls}!`, 'success');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'FIGHT') return ['combat', 'warning', 'error'].includes(log.type);
    if (activeTab === 'DROP') return log.type === 'loot';
    if (activeTab === 'SELL') return log.type === 'sell';
    return true;
  });

  const RARITY_WEIGHT: Record<Rarity, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, Mythic: 6, Divine: 7 };

  const sortedInventory = [...player.inventory].sort((a, b) => {
    if (inventorySort === 'STAT') {
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
    <div className="min-h-screen md:h-screen bg-[#0a0a0a] text-[#00ff00] font-mono p-4 flex flex-col md:flex-row gap-4 selection:bg-[#00ff00] selection:text-black md:overflow-hidden">
      
      {/* Left Panel: Stats & Equipment */}
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
            <div className="flex justify-between"><span>STAGE:</span> <span className="text-yellow-400">{player.stage}</span></div>
            <div className="flex justify-between"><span>LEVEL:</span> <span>{player.level}</span></div>
            <div>
              <div className="flex justify-between mb-1"><span>EXP:</span></div>
              <ProgressBar current={player.exp} max={player.maxExp} color="bg-yellow-500" />
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> HP:</span>
              </div>
              <ProgressBar current={Math.floor(player.hp)} max={maxHp} color="bg-red-500" />

              <div className="flex justify-between mb-1 mt-2">
                <span className="flex items-center gap-1"><Zap size={14} className="text-blue-500" /> MP:</span>
              </div>
              <ProgressBar current={Math.floor(player.mp)} max={maxMp} color="bg-blue-500" />
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

            {sysStatusTab === 'ATTRIBUTES' && (
              <>
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
                  <div className="flex justify-between"><span>Max HP:</span> <span className="text-red-400">{maxHp}</span></div>
                  <div className="flex justify-between"><span>Max MP:</span> <span className="text-blue-400">{maxMp}</span></div>
                  <div className="flex justify-between"><span>Attack:</span> <span className="text-gray-300">{totalAttack}</span></div>
                  <div className="flex justify-between"><span>Defense:</span> <span className="text-gray-300">{totalDefense}</span></div>
                  <div className="flex justify-between"><span>Magic ATK:</span> <span className="text-purple-400">{totalMagicAttack}</span></div>
                  <div className="flex justify-between"><span>Crit Chance:</span> <span className="text-yellow-400">{critChance}%</span></div>
                  <div className="flex justify-between"><span>Crit Damage:</span> <span className="text-yellow-400">{Math.floor(finalCritDmg * 100)}%</span></div>
                  <div className="flex justify-between"><span>Dodge Chance:</span> <span className="text-green-400">{dodgeChance}%</span></div>
                  <div className="flex justify-between"><span>Lifesteal:</span> <span className="text-red-500">{lifesteal}%</span></div>
                  <div className="flex justify-between"><span>Bonus Gold:</span> <span className="text-yellow-500">{setBonusGoldPct * 100}%</span></div>
                  <div className="flex justify-between"><span>Bonus EXP:</span> <span className="text-blue-300">{setBonusExpPct * 100}%</span></div>
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

      {/* Main Panel: Console Log */}
      <div className="w-full md:w-2/4 flex flex-col border border-[#00ff00]/30 bg-[#050505] rounded-sm relative shadow-[0_0_20px_rgba(0,255,0,0.05)] h-[60vh] md:h-full">
        {gameState === 'VILLAGE' ? (
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
                            <div style={{ color: RARITY_COLORS[i.rarity] }} className="text-sm font-bold">
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
                      )})}
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
                            <div style={{ color: RARITY_COLORS[item.rarity] }} className="text-sm font-bold">
                              {item.name} {item.upgradeLevel > 0 && `+${item.upgradeLevel}`}
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
                      {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine'] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => setPlayer(p => ({ ...p, autoSell: { ...p.autoSell, [r]: !p.autoSell[r] } }))}
                          className={`text-xs px-3 py-1 border rounded transition-colors cursor-pointer ${
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
                )}

                <div>
                  <h3 className="text-sm text-gray-500 mb-3 font-bold">SELL ITEMS</h3>
                  <div className="space-y-2">
                    {player.inventory.map(item => (
                      <div key={item.id} className="border border-gray-800 bg-black p-3 flex justify-between items-center group">
                        <div>
                          <div style={{ color: RARITY_COLORS[item.rarity] }} className="text-sm font-bold">
                            {item.name} {item.upgradeLevel > 0 && `+${item.upgradeLevel}`}
                          </div>
                          <div className="text-xs text-gray-500">Value: {getEquipmentValue(item)}</div>
                        </div>
                        <button 
                          onClick={() => sellItem(item)}
                          className="px-4 py-1 bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/50 rounded text-sm"
                        >
                          Sell ({item.sellPrice}G)
                        </button>
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
        ) : (
          <>
            <div className="bg-[#111] border-b border-[#00ff00]/30 p-2 flex justify-between items-center text-xs text-gray-400">
              <div className="flex gap-2">
                {(['ALL', 'FIGHT', 'DROP', 'SELL'] as TerminalTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs font-bold border ${activeTab === tab ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <span className="flex items-center gap-2">
                STATE: 
                <span className={`font-bold ${
                  gameState === 'IDLE' ? 'text-gray-400' : 
                  gameState === 'FARMING' ? 'text-green-400' : 
                  gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' ? 'text-red-500' : 'text-red-700 animate-pulse'
                }`}>
                  [{gameState}]
                </span>
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-mono scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent">
              {filteredLogs.map((log) => (
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
                    ${log.type === 'sell' ? 'text-green-600' : ''}
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
          </>
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
              disabled={gameState === 'FARMING' || gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT'}
              className="w-full flex items-center justify-between p-3 border border-[#00ff00]/50 hover:bg-[#00ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./auto_farm</span>
              <Play size={16} />
            </button>

            <button 
              onClick={startBossFight}
              disabled={gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'DEAD'}
              className="w-full flex items-center justify-between p-3 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./farm_boss</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-orange-500/70">Stage {player.stage}</span>
                <Skull size={16} />
              </div>
            </button>

            <button 
              onClick={startNextBossFight}
              disabled={gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'DEAD' || player.level < player.stage * 5}
              className="w-full flex items-center justify-between p-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./advance</span>
              <div className="flex items-center gap-2">
                {player.level < player.stage * 5 && <span className="text-[10px] text-red-500/70">Lv.{player.stage * 5} Req</span>}
                <Skull size={16} />
              </div>
            </button>

            <div className="flex gap-2">
              <button 
                onClick={stopAction}
                disabled={gameState === 'IDLE' || gameState === 'DEAD'}
                className="flex-1 flex items-center justify-between p-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
              >
                <span>^C (Stop)</span>
                <Square size={16} />
              </button>

              <button 
                onClick={runAway}
                disabled={gameState === 'IDLE' || gameState === 'DEAD' || gameState === 'VILLAGE'}
                className="flex-1 flex items-center justify-between p-3 border border-gray-500/50 text-gray-400 hover:bg-gray-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
              >
                <span>./run</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <button 
              onClick={enterVillage}
              disabled={gameState === 'DEAD' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'FARMING'}
              className="w-full flex items-center justify-between p-3 border border-blue-400/50 text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <span>./village</span>
              <Home size={16} />
            </button>

            <div className="pt-4 border-t border-gray-800">
              <button 
                onClick={showHelp}
                className="w-full flex items-center justify-between p-3 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left cursor-pointer mb-3"
              >
                <span>./help</span>
                <Info size={16} />
              </button>

              <button 
                onClick={heal}
                disabled={player.gold < 50 || (player.hp >= maxHp && player.mp >= maxMp) || gameState === 'DEAD'}
                className="w-full flex items-center justify-between p-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
              >
                <span>./heal</span>
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
                  <span>{CLASS_SKILLS[player.playerClass]!.name}</span>
                  <span className="text-xs">-{CLASS_SKILLS[player.playerClass]!.cost} MP</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

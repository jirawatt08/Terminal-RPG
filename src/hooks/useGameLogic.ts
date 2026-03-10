import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Enemy, GameState, LogEntry, Item, PlayerClass } from '../types';
import { CLASS_SKILLS } from '../constants';
import { generateEnemies, generateLoot, generateId } from '../utils';

export function useGameLogic() {
    const [player, setPlayer] = useState<Player>({
        level: 1, exp: 0, maxExp: 100, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
        baseAttack: 10, baseDefense: 5, gold: 0, stage: 1, statPoints: 0,
        stats: { str: 5, agi: 5, vit: 5, int: 5, luk: 5 },
        playerClass: 'Novice', inventory: [],
        equipment: { weapon: null, armor: null, accessory: null },
        autoSell: { Common: false, Uncommon: false, Rare: false, Epic: false, Legendary: false, Mythic: false, Divine: false },
        autoSkill: false,
        inventoryLimit: 20,
        autoSellUnlocked: false,
        skillCooldown: 0,
        statusEffects: [],
        settings: { barMode: 'bar', reduceUi: false },
        rebornPoints: 0,
        rebornCount: 0,
        rebornUpgrades: {
            atkBonus: 0,
            hpBonus: 0,
            expBonus: 0,
            goldBonus: 0,
            statBonus: 0
        }
    });

    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);

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

    // Derived stats
    const strMilestones = Math.floor(player.stats.str / 10);
    const agiMilestones = Math.floor(player.stats.agi / 10);
    const vitMilestones = Math.floor(player.stats.vit / 10);
    const intMilestones = Math.floor(player.stats.int / 10);
    const lukMilestones = Math.floor(player.stats.luk / 10);

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

    const maxHp = Math.floor((player.maxHp + (player.stats.vit * 10)) * (1 + bonusHpPct + setBonusHpPct + (player.rebornUpgrades.hpBonus / 100)));
    const classBonusMp = (player.playerClass === 'Mage' ? 50 : player.playerClass === 'Archmage' ? 150 : player.playerClass === 'Necromancer' ? 100 : player.playerClass === 'Paladin' ? 50 : 0);
    const maxMp = Math.floor((player.maxMp + (player.stats.int * 5) + classBonusMp) * (1 + setBonusMpPct));

    const getEquipmentValue = (item: Item | null) => {
        if (!item) return 0;
        return Math.floor(item.value * (1 + (item.upgradeLevel || 0) * 0.2));
    };

    const getEffectTotal = (type: 'lifesteal' | 'crit' | 'dodge' | 'luck' | 'statusChance') => {
        let total = 0;
        Object.values(player.equipment).forEach(item => {
            const i = item as Item | null;
            if (i?.effect?.type === type) total += i.effect.value;
        });
        return total;
    };

    const totalAttack = Math.floor((player.baseAttack + (player.stats.str * 2) + getEquipmentValue(player.equipment.weapon)) * (1 + bonusAtkPct + setBonusAtkPct + (player.rebornUpgrades.atkBonus / 100)));
    const totalDefense = Math.floor((player.baseDefense + (player.stats.vit * 1.5) + getEquipmentValue(player.equipment.armor)) * (1 + bonusDefPct + setBonusDefPct));
    const totalMagicAttack = Math.floor((player.stats.int * 2 + getEquipmentValue(player.equipment.weapon)) * (1 + bonusMagicDmgPct + setBonusMagicPct));
    const totalLuck = player.stats.luk + getEffectTotal('luck');
    const totalStatusChance = 2 + Math.floor(player.stats.int / 5) + getEffectTotal('statusChance');

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

                if (gameState === 'VILLAGE' || gameState === 'SETTINGS') return newPlayer;

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
                        if (enemies[0].passive) {
                            addLog(`[PASSIVE] ${enemies[0].name} has [${enemies[0].passive.type.toUpperCase()}]: ${enemies[0].passive.description}`, 'info');
                        }
                    }
                    return newPlayer;
                }

                // Enemy start-of-turn passives (Regen)
                enemies.forEach(enemy => {
                    if (enemy.passive?.type === 'regen' && enemy.hp < enemy.maxHp) {
                        const regenAmount = Math.floor(enemy.maxHp * (enemy.passive.value / 100));
                        enemy.hp = Math.min(enemy.maxHp, enemy.hp + regenAmount);
                        addLog(`[PASSIVE] ${enemy.name} regenerated ${regenAmount} HP.`, 'info');
                    }
                });

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
                        // Enemy Dodge Passive
                        if (target.passive?.type === 'dodge' && Math.random() * 100 < target.passive.value) {
                            addLog(`> MISSED! ${target.name} dodged the attack.`, 'info');
                            return;
                        }

                        let finalDamage = Math.max(1, damageToEnemy - (usedSkill && skill?.type === 'magic' ? Math.floor(target.defense * 0.5) : target.defense));

                        // Enemy Shield Passive
                        if (target.passive?.type === 'shield') {
                            finalDamage = Math.floor(finalDamage * (1 - target.passive.value / 100));
                        }

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

                        // Enemy Thorns/Reflect Passive
                        if (target.passive?.type === 'thorns' || target.passive?.type === 'reflect') {
                            const reflectedDmg = Math.floor(finalDamage * (target.passive.value / 100));
                            newPlayer.hp -= reflectedDmg;
                            addLog(`[PASSIVE] ${target.name} reflected ${reflectedDmg} damage back to you!`, 'error');
                        }

                        // Apply item status effects
                        Object.values(newPlayer.equipment).forEach(item => {
                            const i = item as Item | null;
                            if (i?.effect && ['poison', 'burn', 'stun', 'freeze'].includes(i.effect.type)) {
                                const roll = Math.floor(Math.random() * 10) + 1;
                                const successThreshold = totalStatusChance;
                                if (roll <= successThreshold) {
                                    let effectValue = i.effect.value;
                                    if (i.effect.type === 'poison') {
                                        effectValue = Math.floor(target.maxHp * 0.05); // 5% of enemy max HP
                                    } else if (i.effect.type === 'burn') {
                                        effectValue = Math.floor(totalDefense * 0.5); // 50% of player DEF
                                    }
                                    target.statusEffects.push({
                                        type: i.effect.type as import('../types').StatusEffectType,
                                        duration: 3,
                                        value: effectValue
                                    });
                                    addLog(`> [DICE ROLL: ${roll}/${successThreshold}] Applied ${i.effect.type} to ${target.name}!`, 'success');
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
                        const expGain = Math.floor(target.expReward * (1 + (newPlayer.rebornUpgrades.expBonus / 100) + setBonusExpPct));
                        const goldGain = Math.floor(target.goldReward * (1 + (newPlayer.rebornUpgrades.goldBonus / 100) + setBonusGoldPct));
                        newPlayer.exp += expGain;
                        newPlayer.gold += goldGain;
                        addLog(`+ ${expGain} EXP | + ${goldGain} Gold`, 'info');

                        if (newPlayer.exp >= newPlayer.maxExp) {
                            newPlayer.level += 1;
                            newPlayer.exp -= newPlayer.maxExp;
                            newPlayer.maxExp = Math.floor(newPlayer.maxExp * 1.5);
                            newPlayer.statPoints += 3 + newPlayer.rebornUpgrades.statBonus;
                            newPlayer.hp = maxHp;
                            addLog(`[LEVEL UP] Reached Level ${newPlayer.level}! +${3 + newPlayer.rebornUpgrades.statBonus} Stat Points.`, 'success');
                            if (newPlayer.level === 10 && newPlayer.playerClass === 'Novice') {
                                addLog(`[CLASS UNLOCK] You reached Lv.10! Choose a class in the stats panel.`, 'system');
                            }
                        }

                        const targetStage = gameState === 'NEXT_BOSS_FIGHT' ? newPlayer.stage + 1 : newPlayer.stage;
                        const loot = generateLoot(newPlayer.level, targetStage, target.isBoss, totalLuck);
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
                            
                            // Enemy Berserk Passive
                            if (enemy.passive?.type === 'berserk' && enemy.hp < enemy.maxHp * 0.3) {
                                damageToPlayer = Math.floor(damageToPlayer * (1 + enemy.passive.value / 100));
                                addLog(`[PASSIVE] ${enemy.name} is BERSERK! Damage increased.`, 'warning');
                            }

                            enemy.skill.currentCooldown = enemy.skill.cooldown;
                            addLog(`< [SKILL] ${enemy.name} used ${enemy.skill.name} for ${damageToPlayer} dmg!`, 'error');

                            if (enemy.skill.effect) {
                                const roll = Math.floor(Math.random() * 10) + 1;
                                const baseChance = 3; // Enemies have slightly higher status chance (30%)
                                if (roll <= baseChance) {
                                    let effectValue = enemy.skill.effect.value;
                                    if (enemy.skill.effect.type === 'poison') {
                                        effectValue = Math.floor(maxHp * 0.05); // 5% of player max HP
                                    } else if (enemy.skill.effect.type === 'burn') {
                                        effectValue = Math.floor(enemy.defense * 0.5); // 50% of enemy DEF
                                    }
                                    newPlayer.statusEffects.push({ ...enemy.skill.effect, value: effectValue });
                                    addLog(`< [DICE ROLL: ${roll}] ${enemy.name} applied ${enemy.skill.effect.type} to you!`, 'error');
                                }
                            }
                        } else {
                            damageToPlayer = Math.max(1, enemy.attack - totalDefense + Math.floor(Math.random() * 3));
                            
                            // Enemy Berserk Passive
                            if (enemy.passive?.type === 'berserk' && enemy.hp < enemy.maxHp * 0.3) {
                                damageToPlayer = Math.floor(damageToPlayer * (1 + enemy.passive.value / 100));
                                addLog(`[PASSIVE] ${enemy.name} is BERSERK! Damage increased.`, 'warning');
                            }

                            if (enemy.skill) enemy.skill.currentCooldown -= 1;
                            addLog(`< ${enemy.name} attacked you for ${damageToPlayer} dmg.`, 'error');
                        }
                        newPlayer.hp -= damageToPlayer;

                        // Enemy Lifesteal Passive
                        if (enemy.passive?.type === 'lifesteal') {
                            const healAmount = Math.floor(damageToPlayer * (enemy.passive.value / 100));
                            enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
                            addLog(`[PASSIVE] ${enemy.name} drained ${healAmount} HP from you.`, 'warning');
                        }
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
    const openSettings = () => { if (gameState !== 'DEAD' && gameState !== 'BOSS_FIGHT' && gameState !== 'NEXT_BOSS_FIGHT' && gameState !== 'FARMING') { setGameState('SETTINGS'); setCurrentEnemies([]); addLog('Opening Settings...', 'system'); } };
    const runAway = () => {
        if (gameState === 'FARMING' || gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT' || gameState === 'SETTINGS') {
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
        const healCost = Math.floor(50 + (player.stage * 10) + (maxHp * 0.05) + (maxMp * 0.05));
        if (player.gold >= healCost && (player.hp < maxHp || player.mp < maxMp)) {
            setPlayer(prev => ({ ...prev, gold: prev.gold - healCost, hp: maxHp, mp: maxMp }));
            addLog(`Executed healing protocol. HP and MP restored. -${healCost} Gold.`, 'success');
        } else if (player.gold < healCost) addLog(`Insufficient funds for healing protocol. Need ${healCost}G.`, 'error');
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

    const reborn = () => {
        if (player.level < 20) {
            addLog('Reborn requires Level 20.', 'error');
            return;
        }

        const pointsEarned = Math.floor(player.level / 10) + (player.stage);
        
        setPlayer(prev => ({
            ...prev,
            level: 1,
            exp: 0,
            maxExp: 100,
            hp: 100,
            mp: 50,
            baseAttack: 10,
            baseDefense: 5,
            gold: 0,
            stage: 1,
            statPoints: 0,
            stats: { str: 5, agi: 5, vit: 5, int: 5, luk: 5 },
            playerClass: 'Novice',
            inventory: [],
            equipment: { weapon: null, armor: null, accessory: null },
            rebornPoints: prev.rebornPoints + pointsEarned,
            rebornCount: prev.rebornCount + 1,
            statusEffects: [],
            skillCooldown: 0
        }));

        setGameState('IDLE');
        setCurrentEnemies([]);
        addLog(`REBORN SUCCESSFUL. Earned ${pointsEarned} Reborn Points. All progress reset.`, 'success');
    };

    const buyRebornUpgrade = (type: keyof Player['rebornUpgrades']) => {
        const costs: Record<keyof Player['rebornUpgrades'], number> = {
            atkBonus: 5,
            hpBonus: 5,
            expBonus: 10,
            goldBonus: 10,
            statBonus: 20
        };

        const cost = costs[type];
        if (player.rebornPoints < cost) {
            addLog(`Insufficient Reborn Points. Need ${cost}.`, 'error');
            return;
        }

        setPlayer(prev => ({
            ...prev,
            rebornPoints: prev.rebornPoints - cost,
            rebornUpgrades: {
                ...prev.rebornUpgrades,
                [type]: prev.rebornUpgrades[type] + (type === 'statBonus' ? 1 : 5)
            }
        }));
        addLog(`Upgrade purchased: ${type}.`, 'success');
    };

    return {
        player,
        setPlayer,
        gameState,
        setGameState,
        currentEnemies,
        logs,
        addLog,
        stats: {
            strMilestones, agiMilestones, vitMilestones, intMilestones, lukMilestones,
            activeSets, hasSet,
            setBonusGoldPct, setBonusExpPct,
            maxHp, maxMp, totalAttack, totalDefense, totalMagicAttack, totalLuck, totalStatusChance,
            critChance, finalCritDmg, dodgeChance, lifesteal, getEquipmentValue
        },
        actions: {
            startFarming, startBossFight, startNextBossFight, stopAction,
            enterVillage, openSettings, runAway, showHelp, equipItem, sellItem, upgradeItem,
            heal, allocateStat, chooseClass, reborn, buyRebornUpgrade
        },
        refs: {
            logsEndRef, queuedSkillRef
        }
    };
}

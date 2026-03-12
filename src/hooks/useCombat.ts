import React, { useState, useEffect, useRef } from 'react';
import { Player, Enemy, GameState, Item, StatusEffect } from '../types';
import { generateEnemy, generateEnemies, generateLoot } from '../utils';
import { CLASS_SKILLS } from '../constants';

interface UseCombatProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addLog: (msg: string, type?: any) => void;
    stats: any;
    queuedSkillRef: React.MutableRefObject<boolean>;
}

export function useCombat({ player, setPlayer, addLog, stats, queuedSkillRef }: UseCombatProps) {
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
    
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);

    // Sub-functions for Combat Tick
    const processPlayerStatusEffects = (p: Player) => {
        let isStunned = false;
        p.statusEffects = p.statusEffects.filter(effect => {
            if (effect.type === 'poison' || effect.type === 'burn') {
                p.hp -= (effect.value || 5);
                addLog(`[STATUS] You took ${effect.value || 5} damage from ${effect.type}.`, 'error');
            } else if (effect.type === 'stun' || effect.type === 'freeze') {
                isStunned = true;
            }
            effect.duration -= 1;
            return effect.duration > 0;
        });
        return isStunned;
    };

    const handlePlayerTurn = (p: Player, enemies: Enemy[]) => {
        const { totalAttack, totalMagicAttack, critChance, finalCritDmg, lifesteal, totalStatusChance, maxHp, totalDefense, totalStr, totalInt, skillHaste } = statsRef.current;
        
        let isCrit = Math.random() * 100 < critChance;
        const skills = CLASS_SKILLS[p.playerClass as keyof typeof CLASS_SKILLS] || [];
        const skill = [...skills].reverse().find(s => p.level >= s.unlockLevel);
        const canCastSkill = skill && p.mp >= skill.cost && p.skillCooldown <= 0;
        const shouldCastSkill = canCastSkill && (p.autoSkill || queuedSkillRef.current);

        let targets = [enemies[0]];
        let rawDamage = 0;
        let usedSkill = false;

        if (shouldCastSkill && skill) {
            usedSkill = true;
            p.mp -= skill.cost;
            // Apply Skill Haste (CDR)
            const actualCooldown = Math.max(1, Math.floor(skill.cooldown * (1 - (skillHaste || 0) / 100)));
            p.skillCooldown = actualCooldown;
            queuedSkillRef.current = false;
            if (skill.aoe) targets = [...enemies];
            
            // Scaled Damage Formula: Raw * SkillMult * (1 + Attribute/100)
            if (skill.type === 'physical') {
                rawDamage = Math.floor(totalAttack * skill.mult * (1 + totalStr / 100));
            } else {
                rawDamage = Math.floor(totalMagicAttack * skill.mult * (1 + totalInt / 100));
            }
            
            if (skill.guaranteedCrit) isCrit = true;
        } else {
            rawDamage = totalAttack + Math.floor(Math.random() * 5);
        }

        if (isCrit) rawDamage = Math.floor(rawDamage * finalCritDmg);

        let totalHeal = 0;
        targets.forEach(target => {
            if (target.passive?.type === 'dodge' && Math.random() * 100 < target.passive.value) {
                addLog(`> MISSED! ${target.name} dodged.`, 'info');
                return;
            }

            // Damage Reduction Formula: Final = Raw * (100 / (100 + Defense))
            // Players have 0 penetration by default for now (or maybe base on some stat?)
            const effectiveDef = target.defense;
            const damageFactor = 100 / (100 + effectiveDef);
            let finalDmg = Math.max(1, Math.floor(rawDamage * damageFactor));
            
            if (target.passive?.type === 'shield') finalDmg = Math.floor(finalDmg * (1 - target.passive.value / 100));

            addLog(`> ${isCrit ? 'CRITICAL ' : ''}${usedSkill ? '[' + skill!.name + ']' : 'Attack'} on ${target.name} for ${finalDmg} dmg.`, 'combat');
            target.hp -= finalDmg;

            // Apply Skill Status Effect if applicable
            if (usedSkill && skill?.statusEffect) {
                if (Math.random() * 100 < skill.statusEffect.chance) {
                    // Check Enemy Resistance
                    if (Math.random() * 100 < target.statusResistance) {
                        addLog(`> ${target.name} resisted the ${skill.name} effect!`, 'info');
                    } else {
                        target.statusEffects.push({
                            type: skill.statusEffect.type,
                            duration: skill.statusEffect.duration,
                            value: skill.type === 'magic' ? Math.floor(totalMagicAttack * 0.5) : Math.floor(totalAttack * 0.5)
                        });
                        addLog(`> ${skill.name} applied ${skill.statusEffect.type} to ${target.name}!`, 'success');
                    }
                }
            }

            if (target.passive?.type === 'thorns' || target.passive?.type === 'reflect') {
                const reflect = Math.floor(finalDmg * (target.passive.value / 100));
                p.hp -= reflect;
                addLog(`[PASSIVE] ${target.name} reflected ${reflect} damage!`, 'error');
            }

            // Status Procs
            Object.values(p.equipment).forEach(item => {
                const i = item as Item | null;
                if (i?.effect && ['poison', 'burn', 'stun', 'freeze'].includes(i.effect.type)) {
                    if ((Math.floor(Math.random() * 10) + 1) <= totalStatusChance) {
                        // Check Enemy Resistance
                        if (Math.random() * 100 < target.statusResistance) {
                            addLog(`> ${target.name} resisted the ${i.effect.type}!`, 'info');
                            return;
                        }

                        let val = i.effect.value;
                        if (i.effect.type === 'poison') val = Math.min(Math.floor(target.maxHp * 0.05), totalAttack * 10);
                        else if (i.effect.type === 'burn') val = Math.min(Math.floor(totalDefense * 0.5), totalAttack * 5);
                        target.statusEffects.push({ type: i.effect.type as any, duration: 3, value: val });
                        addLog(`> Applied ${i.effect.type} to ${target.name}!`, 'success');
                    }
                }
            });

            if (lifesteal > 0) totalHeal += Math.floor(finalDmg * (lifesteal / 100));
        });

        if (totalHeal > 0) {
            p.hp = Math.min(maxHp, p.hp + totalHeal);
            addLog(`> Lifesteal restored ${totalHeal} HP.`, 'success');
        }
    };

    const handleEnemyTurn = (p: Player, enemy: Enemy) => {
        const { totalDefense, dodgeChance, reduction, maxHp } = statsRef.current;
        
        let isStunned = false;
        enemy.statusEffects = enemy.statusEffects.filter(e => {
            if (e.type === 'poison' || e.type === 'burn') {
                enemy.hp -= (e.value || 5);
                addLog(`[STATUS] ${enemy.name} took damage from ${e.type}.`, 'success');
            } else if (e.type === 'stun' || e.type === 'freeze') isStunned = true;
            e.duration -= 1;
            return e.duration > 0;
        });

        if (enemy.hp <= 0 || isStunned) {
            if (isStunned) addLog(`< ${enemy.name} is incapacitated!`, 'info');
            return;
        }

        if (Math.random() * 100 < dodgeChance) {
            addLog(`< EVADED! ${enemy.name}'s attack missed.`, 'success');
            return;
        }

        let rawDamage = 0;
        let isEnemyCrit = Math.random() * 100 < enemy.critChance;

        if (enemy.skill && enemy.skill.currentCooldown <= 0) {
            rawDamage = Math.floor(enemy.attack * enemy.skill.mult);
            enemy.skill.currentCooldown = enemy.skill.cooldown;
        } else {
            rawDamage = enemy.attack;
            if (enemy.skill) enemy.skill.currentCooldown -= 1;
        }
        
        if (isEnemyCrit) rawDamage = Math.floor(rawDamage * enemy.critDamage);

        // Damage Reduction Formula: Final = Raw * (100 / (100 + EffectiveDefense))
        // Effective Defense = Defense * (1 - Penetration / 100)
        const effectiveDef = totalDefense * (1 - enemy.armorPenetration / 100);
        const damageFactor = 100 / (100 + effectiveDef);
        let dmg = Math.max(1, Math.floor(rawDamage * damageFactor));

        if (enemy.skill && enemy.skill.currentCooldown === enemy.skill.cooldown) {
            addLog(`< ${isEnemyCrit ? 'CRITICAL ' : ''}[SKILL] ${enemy.name} used ${enemy.skill.name} for ${dmg} dmg!`, 'error');
        } else {
            addLog(`< ${isEnemyCrit ? 'CRITICAL ' : ''}${enemy.name} attacked for ${dmg} dmg.`, 'error');
        }

        if (enemy.passive?.type === 'berserk' && enemy.hp < enemy.maxHp * 0.3) dmg = Math.floor(dmg * (1 + enemy.passive.value / 100));
        if (reduction > 0) dmg = Math.floor(dmg * (1 - reduction / 100));
        p.hp -= dmg;

        // Auto-Heal
        const potion = p.potions.find(pot => pot.type === 'health');
        if (p.autoHealUnlocked && p.autoHealEnabled && potion && potion.duration > 0) {
            if ((p.hp / maxHp) * 100 <= p.autoHealThreshold && p.hp > 0) {
                const heal = Math.floor(maxHp * 0.3 * (1 + (p.potionQualityUpgrade * 0.25)));
                p.hp = Math.min(maxHp, p.hp + heal);
                potion.duration -= 1;
                addLog(`[AUTO-HEAL] Used health potion! (+${heal} HP)`, 'success');
            }
        }
        if (enemy.passive?.type === 'lifesteal') enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.floor(dmg * (enemy.passive.value / 100)));
    };

    // Main Loop
    useEffect(() => {
        if (['IDLE', 'SETTINGS', 'VILLAGE'].includes(gameState)) return;

        const interval = setInterval(() => {
            if (document.hidden) return;

            setPlayer(prev => {
                let p = { ...prev, inventory: [...prev.inventory], equipment: { ...prev.equipment }, statusEffects: [...prev.statusEffects], potions: [...prev.potions] };
                const { maxHp, maxMp, bonusManaRegen, totalLuck, setBonusExpPct, setBonusGoldPct, potionExpBonus, potionGoldBonus } = statsRef.current;

                if (gameState === 'DEAD') {
                    if (p.hp < maxHp) {
                        p.hp = Math.min(maxHp, p.hp + maxHp * 0.1);
                        if (p.hp === maxHp) { addLog('SYSTEM REBOOT COMPLETE.', 'success'); setGameState('IDLE'); }
                        else addLog(`Rebooting... HP: ${Math.floor(p.hp)}/${maxHp}`, 'system');
                    }
                    return p;
                }

                if (p.mp < maxMp) p.mp = Math.min(maxMp, p.mp + 1 + bonusManaRegen);
                if (p.skillCooldown > 0) p.skillCooldown--;

                let enemies = [...currentEnemies];
                if (enemies.length === 0) {
                    const isBoss = gameState === 'BOSS_FIGHT' || gameState === 'NEXT_BOSS_FIGHT';
                    const stage = gameState === 'NEXT_BOSS_FIGHT' ? p.stage + 1 : p.stage;
                    if (gameState !== 'DASHBOARD' || isBoss) {
                        enemies = generateEnemies(p.level, stage, isBoss);
                        setCurrentEnemies(enemies);
                        addLog(`[ENCOUNTER] ${enemies.length > 1 ? 'A group appeared!' : 'Found ' + enemies[0].name}`, 'warning');
                    }
                    return p;
                }

                // Enemy Regen
                enemies.forEach(e => {
                    if (e.passive?.type === 'regen' && e.hp < e.maxHp) {
                        const regen = Math.floor(e.maxHp * (e.passive.value / 100));
                        e.hp = Math.min(e.maxHp, e.hp + regen);
                    }
                });

                const playerStunned = processPlayerStatusEffects(p);
                if (p.hp <= 0) {
                    p.hp = 0; addLog('CRITICAL FAILURE.', 'error'); setGameState('DEAD'); setCurrentEnemies([]);
                    return p;
                }

                if (!playerStunned) handlePlayerTurn(p, enemies);

                // Handle Deaths & Loot
                const surviving = [];
                for (const target of enemies) {
                    if (target.hp <= 0) {
                        addLog(`[KILL] ${target.name} terminated.`, 'success');
                        if (target.isBoss) p.bossesKilled++; else p.monstersKilled++;
                        
                        // Quests & Leveling
                        p.quests = p.quests.map(q => {
                            if (q.completed) return q;
                            if ((q.requirement.type === 'kill_monster' && !target.isBoss) || (q.requirement.type === 'kill_boss' && target.isBoss)) q.requirement.current++;
                            if (q.requirement.current >= q.requirement.target) { q.completed = true; addLog(`[QUEST] ${q.name} met!`, 'success'); }
                            return q;
                        });
                        p.potions = p.potions.map(pot => {
                            if (pot.type === 'health') return pot;
                            return { ...pot, duration: pot.duration - 1 };
                        }).filter(pot => pot.duration > 0);
                        
                        // EXP Rework: % of maxExp based on difficulty efficiency
                        const basePct = target.isBoss ? 0.025 : 0.005;
                        const currentStg = gameState === 'NEXT_BOSS_FIGHT' ? p.stage + 1 : p.stage;
                        // Efficiency: 1.0 if Stage = Level/5. Ranges 0.2 to 2.0.
                        const efficiency = Math.max(0.2, Math.min(2.0, currentStg / (Math.max(1, p.level) / 5)));
                        
                        const baseGained = (target.expReward * 0.2) + (p.maxExp * basePct * efficiency);
                        const expBonusMult = (1 + setBonusExpPct + (potionExpBonus / 100));
                        const exp = Math.floor(baseGained * expBonusMult);

                        const gold = Math.floor(target.goldReward * (1 + setBonusGoldPct + (potionGoldBonus / 100)));
                        p.exp += exp; p.gold += gold;
                        addLog(`+ ${exp} EXP | + ${gold} Gold`, 'info');

                        if (p.exp >= p.maxExp) {
                            p.level++; p.exp -= p.maxExp; p.maxExp = Math.floor(p.maxExp * (p.level < 25 ? 1.15 : 1.5));
                            p.statPoints += 3 + p.rebornUpgrades.statBonus; p.hp = maxHp;
                            addLog(`[LEVEL UP] LV.${p.level}!`, 'success');
                        }

                        const loot = generateLoot(p.level, (gameState === 'NEXT_BOSS_FIGHT' ? p.stage + 1 : p.stage), target.isBoss, totalLuck);
                        if (loot) {
                            if (p.autoSellUnlocked && p.autoSell[loot.rarity]) { p.gold += loot.sellPrice; addLog(`[AUTO-SELL] +${loot.sellPrice}G`, 'sell'); }
                            else if (p.inventory.length < p.inventoryLimit) { p.inventory.push(loot); addLog(`[LOOT] ${loot.name}!`, 'loot'); }
                        }
                    } else {
                        surviving.push(target);
                    }
                }

                if (surviving.length === 0) {
                    setCurrentEnemies([]);
                    if (gameState === 'NEXT_BOSS_FIGHT') { p.stage++; addLog(`Stage ${p.stage} reached.`, 'system'); setGameState('IDLE'); }
                    else if (gameState === 'BOSS_FIGHT' && !p.autoBoss) setGameState('IDLE');
                    return p;
                }

                // Enemy Attacks
                surviving.forEach(e => {
                    // Boss Summoning Mechanic
                    if (e.passive?.type === 'summoner' && surviving.length < 4) {
                        if (Math.random() * 100 < e.passive.value) {
                            const minion = generateEnemy(p.level, gameState === 'NEXT_BOSS_FIGHT' ? p.stage + 1 : p.stage, false);
                            surviving.push(minion);
                            addLog(`[SUMMON] ${e.name} summoned ${minion.name}!`, 'warning');
                        }
                    }
                    handleEnemyTurn(p, e);
                });
                const finalEnemies = surviving.filter(e => e.hp > 0);
                setCurrentEnemies(finalEnemies);

                if (p.hp <= 0) { p.hp = 0; addLog('CRITICAL FAILURE.', 'error'); setGameState('DEAD'); setCurrentEnemies([]); }
                return p;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, currentEnemies, addLog, setCurrentEnemies]);

    const showHelp = () => {
        addLog('==================================================', 'system');
        addLog('TERMINAL RPG v2.7 - SYSTEM DOCUMENTATION', 'system');
        addLog('==================================================', 'system');
        addLog('SKILL OVERDRIVE:', 'info');
        addLog('- Skills scale with your primary attribute (STR/INT).', 'info');
        addLog('- Cooldowns are reduced by Skill Haste (AGI/INT).', 'info');
        addLog('- Tier 2 skills can apply STATUS EFFECTS (Burn/Freeze/etc).', 'info');
        addLog('--------------------------------------------------', 'system');
        addLog('COMMANDS:', 'info');

        addLog('- Equip 2+ items of the same SET to unlock unique bonuses.', 'info');
        addLog('- [Berserker]: Massive Attack boost.', 'info');
        addLog('- [Guardian]: High HP and Defense increase.', 'info');
        addLog('- [Sage]: Enhanced MP and Magic Power.', 'info');
        addLog('- [Explorer]: Significant EXP gain boost.', 'info');
        addLog('- View active bonuses in SYS_STATUS > PASSIVES.', 'info');
        addLog('--------------------------------------------------', 'system');
        addLog('ATTRIBUTES & MILESTONES:', 'info');
        addLog('- STR: +Atk. Every 10 pts: +5% Atk, +10% Crit Dmg.', 'info');
        addLog('- AGI: +Crit/Dodge. Every 10 pts: +2% Crit, +2% Dodge.', 'info');
        addLog('- VIT: +HP/Def. Every 10 pts: +5% HP/Def.', 'info');
        addLog('- INT: +M.Atk/MP. Every 10 pts: +2 MP Regen, +5% M.Atk.', 'info');
        addLog('- LUK: +Drop Rate. Every 10 pts: +1% Drop Rarity.', 'info');
        addLog('--------------------------------------------------', 'system');
        addLog('COMBAT MECHANICS:', 'info');
        addLog('- Skill Haste: AGI and INT reduce skill cooldowns.', 'info');
        addLog('- Armor Pen: High-stage enemies ignore some Defense.', 'info');
        addLog('- Status Resist: Bosses can ignore status effects.', 'info');
        addLog('- Auto-Scroll: Toggle in header to scroll logs manually.', 'info');
        addLog('--------------------------------------------------', 'system');
        addLog('VILLAGE SECTORS:', 'info');
        addLog('- Blacksmith: Enhance equipment using Gold.', 'info');
        addLog('- Alchemist: Buy/Stack potions. Use "MAX" to fill.', 'info');
        addLog('- Merchant: Sell items. "Sell All" clears inventory.', 'info');
        addLog('- Quest Board: High-reward bounties per stage.', 'info');
        addLog('==================================================', 'system');
    };

    const openPatchNotes = () => {
        setGameState('PATCHES');
        addLog('Opening System Update History...', 'system');
    };

    return {
        gameState, setGameState, currentEnemies, setCurrentEnemies,
        runAway: () => { setGameState('IDLE'); setCurrentEnemies([]); addLog('Escaped.', 'system'); },
        openSettings: () => { if (!['BOSS_FIGHT', 'NEXT_BOSS_FIGHT', 'FARMING'].includes(gameState)) { setGameState('SETTINGS'); setCurrentEnemies([]); } },
        openDashboard: () => setGameState('DASHBOARD'),
        openPatchNotes,
        showHelp
    };
}

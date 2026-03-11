import React, { useState, useEffect, useRef } from 'react';
import { Player, Enemy, GameState, Item, StatusEffect } from '../types';
import { generateEnemies, generateLoot } from '../utils';
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
        const { totalAttack, totalMagicAttack, critChance, finalCritDmg, lifesteal, totalStatusChance, maxHp, totalDefense } = statsRef.current;
        
        let isCrit = Math.random() * 100 < critChance;
        const skill = CLASS_SKILLS[p.playerClass];
        const canCastSkill = skill && p.mp >= skill.cost && p.skillCooldown <= 0;
        const shouldCastSkill = canCastSkill && (p.autoSkill || queuedSkillRef.current);

        let targets = [enemies[0]];
        let damage = 0;
        let usedSkill = false;

        if (shouldCastSkill && skill) {
            usedSkill = true;
            p.mp -= skill.cost;
            p.skillCooldown = skill.cooldown;
            queuedSkillRef.current = false;
            if (skill.aoe) targets = [...enemies];
            damage = skill.type === 'physical' ? Math.floor(totalAttack * skill.mult) : Math.floor(totalMagicAttack * skill.mult);
            if (skill.guaranteedCrit) isCrit = true;
        } else {
            damage = totalAttack + Math.floor(Math.random() * 5);
        }

        if (isCrit) damage = Math.floor(damage * finalCritDmg);

        let totalHeal = 0;
        targets.forEach(target => {
            if (target.passive?.type === 'dodge' && Math.random() * 100 < target.passive.value) {
                addLog(`> MISSED! ${target.name} dodged.`, 'info');
                return;
            }

            let finalDmg = Math.max(1, damage - (usedSkill && skill?.type === 'magic' ? Math.floor(target.defense * 0.5) : target.defense));
            if (target.passive?.type === 'shield') finalDmg = Math.floor(finalDmg * (1 - target.passive.value / 100));

            addLog(`> ${isCrit ? 'CRITICAL ' : ''}${usedSkill ? '[' + skill!.name + ']' : 'Attack'} on ${target.name} for ${finalDmg} dmg.`, 'combat');
            target.hp -= finalDmg;

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

        let dmg = 0;
        if (enemy.skill && enemy.skill.currentCooldown <= 0) {
            dmg = Math.max(1, Math.floor(enemy.attack * enemy.skill.mult) - totalDefense);
            enemy.skill.currentCooldown = enemy.skill.cooldown;
            addLog(`< [SKILL] ${enemy.name} used ${enemy.skill.name} for ${dmg} dmg!`, 'error');
        } else {
            dmg = Math.max(1, enemy.attack - totalDefense);
            if (enemy.skill) enemy.skill.currentCooldown -= 1;
            addLog(`< ${enemy.name} attacked for ${dmg} dmg.`, 'error');
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
                        p.potions = p.potions.map(pot => ({ ...pot, duration: pot.duration - 1 })).filter(pot => pot.duration > 0);
                        
                        const exp = Math.floor(target.expReward * (1 + (p.rebornUpgrades.expBonus / 100) + setBonusExpPct + (potionExpBonus / 100)));
                        const gold = Math.floor(target.goldReward * (1 + (p.rebornUpgrades.goldBonus / 100) + setBonusGoldPct + (potionGoldBonus / 100)));
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
                surviving.forEach(e => handleEnemyTurn(p, e));
                const finalEnemies = surviving.filter(e => e.hp > 0);
                setCurrentEnemies(finalEnemies);

                if (p.hp <= 0) { p.hp = 0; addLog('CRITICAL FAILURE.', 'error'); setGameState('DEAD'); setCurrentEnemies([]); }
                return p;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, currentEnemies, addLog, setCurrentEnemies]);

    return {
        gameState, setGameState, currentEnemies, setCurrentEnemies,
        runAway: () => { setGameState('IDLE'); setCurrentEnemies([]); addLog('Escaped.', 'system'); },
        openSettings: () => { if (!['BOSS_FIGHT', 'NEXT_BOSS_FIGHT', 'FARMING'].includes(gameState)) { setGameState('SETTINGS'); setCurrentEnemies([]); } },
        openDashboard: () => setGameState('DASHBOARD'),
        showHelp: () => addLog('SYSTEM_DOCS_V2.2: Command list available in ./help', 'info')
    };
}

import React, { useState, useEffect, useRef } from 'react';
import { Player, Enemy, GameState, Item, StatusEffect, LogType, StatusEffectType, EquippableItem } from '../types';
import { generateEnemy, generateEnemies, generateLoot } from '../utils';
import { CLASS_SKILLS } from '../constants';
import { CalculatedStats } from '../logic/stats';
import { calculateAttack, processStatusTick } from '../logic/combatRules';

interface UseCombatProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addLog: (msg: string, type?: LogType) => void;
    stats: CalculatedStats;
    queuedSkillRef: React.MutableRefObject<boolean>;
}

export function useCombat({ player, setPlayer, addLog, stats, queuedSkillRef }: UseCombatProps) {
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
    
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);

    // Sub-functions for Combat Tick
    const processPlayerStatusEffects = (p: Player) => {
        const { tickDamage, isStunned, remainingEffects } = processStatusTick(p);
        
        if (tickDamage > 0) {
            p.hp -= tickDamage;
            addLog(`[STATUS] You took ${tickDamage} damage from status effects.`, 'error');
        }
        
        p.statusEffects = remainingEffects;
        return isStunned;
    };

    const handlePlayerTurn = (p: Player, enemies: Enemy[]) => {
        const currentStats = statsRef.current;
        const skills = CLASS_SKILLS[p.playerClass as keyof typeof CLASS_SKILLS] || [];
        const skill = [...skills].reverse().find(s => p.level >= s.unlockLevel);
        const canCastSkill = skill && p.mp >= skill.cost && p.skillCooldown <= 0;
        const shouldCastSkill = canCastSkill && (p.autoSkill || queuedSkillRef.current);

        let targets = [enemies[0]];
        let usedSkill = false;

        if (shouldCastSkill && skill) {
            usedSkill = true;
            p.mp -= skill.cost;
            const actualCooldown = Math.max(1, Math.floor(skill.cooldown * (1 - (currentStats.skillHaste || 0) / 100)));
            p.skillCooldown = actualCooldown;
            queuedSkillRef.current = false;
            if (skill.aoe) targets = [...enemies];
        }

        let totalHeal = 0;
        targets.forEach(target => {
            const result = calculateAttack(
                { name: p.displayName || 'Player', stats: currentStats },
                target,
                { skill: usedSkill ? skill : undefined, isPlayerAttacking: true }
            );

            result.logs.forEach(log => addLog(log.text, log.type));

            if (result.isDodged) return;

            addLog(`> ${result.isCrit ? 'CRITICAL ' : ''}${usedSkill ? '[' + skill!.name + ']' : 'Attack'} on ${target.name} for ${result.damage} dmg.`, 'combat');
            target.hp -= result.damage;

            if (result.statusApplied) {
                target.statusEffects.push(result.statusApplied);
                addLog(`> ${skill!.name} applied ${result.statusApplied.type} to ${target.name}!`, 'success');
            }

            if (result.reflectedDamage > 0) {
                p.hp -= result.reflectedDamage;
                addLog(`[PASSIVE] ${target.name} reflected ${result.reflectedDamage} damage!`, 'error');
            }

            // Status Procs from Equipment
            Object.values(p.equipment).forEach(item => {
                const i = item as EquippableItem | null;
                if (i?.effect && ['poison', 'burn', 'stun', 'freeze'].includes(i.effect.type)) {
                    if ((Math.floor(Math.random() * 10) + 1) <= currentStats.totalStatusChance) {
                        if (Math.random() * 100 < target.statusResistance) {
                            addLog(`> ${target.name} resisted the ${i.effect.type}!`, 'info');
                            return;
                        }

                        let val = i.effect.value;
                        if (i.effect.type === 'poison') val = Math.min(Math.floor(target.maxHp * 0.05), currentStats.totalAttack * 10);
                        else if (i.effect.type === 'burn') val = Math.min(Math.floor(currentStats.totalDefense * 0.5), currentStats.totalAttack * 5);
                        target.statusEffects.push({ type: i.effect.type as StatusEffectType, duration: 3, value: val });
                        addLog(`> Applied ${i.effect.type} to ${target.name}!`, 'success');
                    }
                }
            });

            if (currentStats.lifesteal > 0) totalHeal += Math.floor(result.damage * (currentStats.lifesteal / 100));
        });

        if (totalHeal > 0) {
            p.hp = Math.min(currentStats.maxHp, p.hp + totalHeal);
            addLog(`> Lifesteal restored ${totalHeal} HP.`, 'success');
        }
    };

    const handleEnemyTurn = (p: Player, enemy: Enemy) => {
        const currentStats = statsRef.current;
        const { tickDamage, isStunned, remainingEffects } = processStatusTick(enemy);
        
        if (tickDamage > 0) {
            enemy.hp -= tickDamage;
            addLog(`[STATUS] ${enemy.name} took ${tickDamage} damage from status effects.`, 'success');
        }
        enemy.statusEffects = remainingEffects;

        if (enemy.hp <= 0 || isStunned) {
            if (isStunned) addLog(`< ${enemy.name} is incapacitated!`, 'info');
            return;
        }

        const result = calculateAttack(
            { name: enemy.name, stats: { totalAttack: enemy.attack, critChance: enemy.critChance, finalCritDmg: enemy.critDamage } },
            p,
            { 
                skill: (enemy.skill && enemy.skill.currentCooldown <= 0) ? enemy.skill : undefined, 
                isPlayerAttacking: false 
            }
        );

        result.logs.forEach(log => addLog(log.text, log.type));

        if (result.isDodged) {
            addLog(`< EVADED! ${enemy.name}'s attack missed.`, 'success');
            return;
        }

        if (enemy.skill && enemy.skill.currentCooldown <= 0) {
            enemy.skill.currentCooldown = enemy.skill.cooldown;
            addLog(`< ${result.isCrit ? 'CRITICAL ' : ''}[SKILL] ${enemy.name} used ${enemy.skill.name} for ${result.damage} dmg!`, 'error');
        } else {
            if (enemy.skill) enemy.skill.currentCooldown -= 1;
            addLog(`< ${result.isCrit ? 'CRITICAL ' : ''}${enemy.name} attacked for ${result.damage} dmg.`, 'error');
        }

        p.hp -= result.damage;

        // Player Damage Reflection (Reflex Set)
        if (currentStats.setReflection > 0 && result.damage > 0) {
            const reflected = Math.floor(result.damage * (currentStats.setReflection / 100));
            if (reflected > 0) {
                enemy.hp -= reflected;
                addLog(`[SET] Reflected ${reflected} damage back to ${enemy.name}!`, 'success');
            }
        }

        // Auto-Heal
        const potion = p.potions.find(pot => pot.type === 'health');
        if (p.autoHealUnlocked && p.autoHealEnabled && potion && potion.duration > 0) {
            if ((p.hp / currentStats.maxHp) * 100 <= p.autoHealThreshold && p.hp > 0) {
                const heal = Math.floor(currentStats.maxHp * 0.3 * (1 + (p.potionQualityUpgrade * 0.25)));
                p.hp = Math.min(currentStats.maxHp, p.hp + heal);
                potion.duration -= 1;
                addLog(`[AUTO-HEAL] Used health potion! (+${heal} HP)`, 'success');
            }
        }
        if (enemy.passive?.type === 'lifesteal') enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.floor(result.damage * (enemy.passive.value / 100)));
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

                        while (p.exp >= p.maxExp) {
                            p.level++; 
                            p.exp -= p.maxExp; 
                            // Growth rate: 15% early, 50% mid, 10% late (40+)
                            const growthRate = p.level < 25 ? 1.15 : p.level < 40 ? 1.5 : 1.1;
                            p.maxExp = Math.floor(p.maxExp * growthRate);
                            p.statPoints += 3 + (p.rebornUpgrades?.statBonus || 0); 
                            p.hp = maxHp;
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
        addLog('TERMINAL RPG v3.0 - SYSTEM DOCUMENTATION', 'system');
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

import { Player, Enemy, StatusEffect, StatusEffectType, Item, EquippableItem } from '../types';
import { CalculatedStats } from './stats';
import { SafeMath } from '../utils/safeMath';

export interface Combatant {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    statusEffects: StatusEffect[];
    statusResistance: number;
}

export interface DamageResult {
    damage: number;
    isCrit: boolean;
    isDodged: boolean;
    isShielded: boolean;
    reflectedDamage: number;
    statusApplied?: StatusEffect;
    logs: { text: string; type: 'combat' | 'info' | 'success' | 'error' }[];
}

/**
 * Pure function to process a single attack from one entity to another.
 */
export const calculateAttack = (
    attacker: { name: string; stats: { totalAttack: number; critChance: number; finalCritDmg: number; totalStr?: number; totalInt?: number; totalMagicAttack?: number; dodgeChance?: number; reduction?: number } },
    defender: { name: string; hp: number; maxHp: number; defense: number; statusResistance: number; armorPenetration?: number; passive?: any },
    options: { 
        skill?: { name: string; mult: number; type: 'physical' | 'magic'; statusEffect?: any; guaranteedCrit?: boolean };
        isPlayerAttacking: boolean;
    }
): DamageResult => {
    const results: DamageResult = {
        damage: 0,
        isCrit: false,
        isDodged: false,
        isShielded: false,
        reflectedDamage: 0,
        logs: []
    };

    const { stats } = attacker;
    const { skill } = options;

    // 1. Check Dodge
    const dodgeChance = options.isPlayerAttacking 
        ? (defender.passive?.type === 'dodge' ? defender.passive!.value : 0)
        : (stats.dodgeChance || 0);

    if (Math.random() * 100 < dodgeChance) {
        results.isDodged = true;
        results.logs.push({ 
            text: `> MISSED! ${defender.name} dodged.`, 
            type: 'info' 
        });
        return results;
    }

    // 2. Calculate Raw Damage
    results.isCrit = Math.random() * 100 < (stats.critChance || 0) || (skill?.guaranteedCrit ?? false);
    
    let rawDamage = 0;
    const totalAttack = stats.totalAttack || 0;
    const totalMagicAttack = stats.totalMagicAttack || totalAttack;
    const totalStr = stats.totalStr || 0;
    const totalInt = stats.totalInt || 0;

    if (skill) {
        if (skill.type === 'physical') {
            const scaling = options.isPlayerAttacking ? (1 + totalStr / 100) : 1;
            rawDamage = SafeMath.mult(totalAttack, SafeMath.mult(skill.mult, scaling));
        } else {
            const scaling = options.isPlayerAttacking ? (1 + totalInt / 100) : 1;
            rawDamage = SafeMath.mult(totalMagicAttack, SafeMath.mult(skill.mult, scaling));
        }
    } else {
        rawDamage = SafeMath.add(totalAttack, Math.floor(Math.random() * 5));
    }

    if (results.isCrit) {
        rawDamage = SafeMath.mult(rawDamage, (stats.finalCritDmg || 1.5));
    }

    // 3. Apply Defense & Mitigation
    const armorPen = options.isPlayerAttacking ? 0 : (defender.armorPenetration || 0);
    const effectiveDef = SafeMath.mult((defender.defense || 0), (1 - armorPen / 100));
    // FIXED: Use SafeMath.div to prevent division by zero
    const damageFactor = SafeMath.div(100, SafeMath.add(100, effectiveDef), 1);
    
    let finalDmg = SafeMath.clamp(Math.floor(SafeMath.mult(rawDamage, damageFactor)), 1);

    // Passive Shielding
    const passive = defender.passive; 
    if (passive?.type === 'shield' && passive.value) {
        finalDmg = Math.floor(SafeMath.mult(finalDmg, (1 - passive.value / 100)));
        results.isShielded = true;
    }

    // Player Reduction stat
    if (!options.isPlayerAttacking && (stats.reduction || 0) > 0) {
        finalDmg = Math.floor(SafeMath.mult(finalDmg, (1 - stats.reduction! / 100)));
    }

    results.damage = SafeMath.clamp(finalDmg, 1);

    // 4. Reflection / Thorns
    if (options.isPlayerAttacking && (passive?.type === 'thorns' || passive?.type === 'reflect') && passive.value) {
        results.reflectedDamage = Math.floor(results.damage * (passive.value / 100));
    }

    // 5. Status Effects from Skills
    if (skill?.statusEffect && Math.random() * 100 < skill.statusEffect.chance) {
        // Fallback for statusResistance if missing
        const res = defender.statusResistance || 0;
        if (Math.random() * 100 < res) {
            results.logs.push({ text: `> ${defender.name} resisted the ${skill.name} effect!`, type: 'info' });
        } else {
            const statusValue = skill.statusEffect.value || (skill.type === 'magic' ? Math.floor(totalMagicAttack * 0.5) : Math.floor(totalAttack * 0.5));
            results.statusApplied = {
                type: skill.statusEffect.type,
                duration: skill.statusEffect.duration,
                value: isNaN(statusValue) ? 5 : statusValue
            };
        }
    }

    return results;
};

/**
 * Pure function to process status effects for a single entity tick.
 * Returns the damage taken and remaining effects.
 */
export const processStatusTick = (entity: { hp: number; statusEffects: StatusEffect[] }) => {
    let tickDamage = 0;
    let isStunned = false;
    const logs: { text: string; type: 'error' | 'success' | 'info' }[] = [];

    const remainingEffects = entity.statusEffects.filter(effect => {
        if (effect.type === 'poison' || effect.type === 'burn') {
            tickDamage += (effect.value || 5);
        } else if (effect.type === 'stun' || effect.type === 'freeze') {
            isStunned = true;
        }
        effect.duration -= 1;
        return effect.duration > 0;
    });

    return { tickDamage, isStunned, remainingEffects };
};

/**
 * Pure function to calculate EXP gain from a defeated enemy.
 */
export const calculateExpGain = (
    enemy: { expReward: number; isBoss: boolean },
    player: { level: number; maxExp: number; stage: number },
    bonuses: { setBonusExpPct: number; potionExpBonus: number },
    isNextBoss: boolean
): number => {
    const basePct = enemy.isBoss ? 0.025 : 0.005;
    const currentStg = isNextBoss ? player.stage + 1 : player.stage;
    // Efficiency: 1.0 if Stage = Level/5. Ranges 0.2 to 2.0.
    const efficiency = Math.max(0.2, Math.min(2.0, currentStg / (Math.max(1, player.level) / 5)));
    
    const baseGained = (enemy.expReward * 0.2) + (player.maxExp * basePct * efficiency);
    const expBonusMult = (1 + bonuses.setBonusExpPct + (bonuses.potionExpBonus / 100));
    return Math.floor(baseGained * expBonusMult);
};

/**
 * Pure function to calculate Gold gain from a defeated enemy.
 */
export const calculateGoldGain = (
    enemy: { goldReward: number },
    bonuses: { setBonusGoldPct: number; potionGoldBonus: number }
): number => {
    return Math.floor(enemy.goldReward * (1 + bonuses.setBonusGoldPct + (bonuses.potionGoldBonus / 100)));
};

/**
 * Pure function to process level up logic.
 * Returns updated level, exp, maxExp, and statPoints.
 */
export const calculateLevelUp = (
    player: { level: number; exp: number; maxExp: number; statPoints: number; rebornUpgrades: { statBonus: number } }
) => {
    let { level, exp, maxExp, statPoints } = player;
    let levelsGained = 0;

    while (exp >= maxExp) {
        level++;
        levelsGained++;
        exp -= maxExp;
        // Growth rate: 15% early, 50% mid, 10% late (40+)
        const growthRate = level < 25 ? 1.15 : level < 40 ? 1.5 : 1.1;
        maxExp = Math.floor(maxExp * growthRate);
        statPoints += 3 + (player.rebornUpgrades?.statBonus || 0);
    }

    return { level, exp, maxExp, statPoints, levelsGained };
};

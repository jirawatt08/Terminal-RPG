import { Player, Enemy, StatusEffect, StatusEffectType, Item, EquippableItem } from '../types';
import { CalculatedStats } from './stats';

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
    attacker: { name: string; stats: Partial<CalculatedStats> & { totalAttack: number } },
    defender: Enemy | Player,
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
        ? (defender as Enemy).passive?.type === 'dodge' ? (defender as Enemy).passive!.value : 0
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
    if (skill) {
        if (skill.type === 'physical') {
            rawDamage = Math.floor(stats.totalAttack! * skill.mult * (1 + (stats.totalStr || 0) / 100));
        } else {
            rawDamage = Math.floor(stats.totalMagicAttack! * skill.mult * (1 + (stats.totalInt || 0) / 100));
        }
    } else {
        rawDamage = stats.totalAttack! + Math.floor(Math.random() * 5);
    }

    if (results.isCrit) {
        rawDamage = Math.floor(rawDamage * (stats.finalCritDmg || 1.5));
    }

    // 3. Apply Defense & Mitigation
    // Effective Defense formula
    const armorPen = options.isPlayerAttacking ? 0 : (defender as Enemy).armorPenetration || 0;
    const effectiveDef = defender.defense * (1 - armorPen / 100);
    const damageFactor = 100 / (100 + effectiveDef);
    
    let finalDmg = Math.max(1, Math.floor(rawDamage * damageFactor));

    // Passive Shielding
    const passive = (defender as any).passive; // Simplified for this logic
    if (passive?.type === 'shield') {
        finalDmg = Math.floor(finalDmg * (1 - passive.value / 100));
        results.isShielded = true;
    }

    // Player Reduction stat
    if (!options.isPlayerAttacking && (stats.reduction || 0) > 0) {
        finalDmg = Math.floor(finalDmg * (1 - stats.reduction! / 100));
    }

    results.damage = finalDmg;

    // 4. Reflection / Thorns
    if (options.isPlayerAttacking && (passive?.type === 'thorns' || passive?.type === 'reflect')) {
        results.reflectedDamage = Math.floor(finalDmg * (passive.value / 100));
    }

    // 5. Status Effects from Skills
    if (skill?.statusEffect && Math.random() * 100 < skill.statusEffect.chance) {
        if (Math.random() * 100 < defender.statusResistance) {
            results.logs.push({ text: `> ${defender.name} resisted the ${skill.name} effect!`, type: 'info' });
        } else {
            results.statusApplied = {
                type: skill.statusEffect.type,
                duration: skill.statusEffect.duration,
                value: skill.type === 'magic' ? Math.floor(stats.totalMagicAttack! * 0.5) : Math.floor(stats.totalAttack! * 0.5)
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

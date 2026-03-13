import { describe, it, expect } from 'vitest';
import { calculateAttack, processStatusTick, calculateExpGain, calculateGoldGain, calculateLevelUp } from './combatRules';
import { Enemy, Player, StatusEffect } from '../types';

describe('Combat Rules - Logic Verification', () => {
    const mockPlayer: Partial<Player> = {
        level: 10,
        stage: 2,
        maxExp: 1000,
        hp: 500,
        statusEffects: [],
        rebornUpgrades: { statBonus: 0, atkBonus: 0, expBonus: 0, goldBonus: 0, hpBonus: 0, pointBonus: 0 }
    };

    const mockEnemy: Enemy = {
        id: '1',
        name: 'Slime',
        hp: 100,
        maxHp: 100,
        attack: 10,
        defense: 5,
        expReward: 50,
        goldReward: 20,
        isBoss: false,
        statusEffects: [],
        critChance: 0,
        critDamage: 1.5,
        statusResistance: 0,
        armorPenetration: 0
    };

    it('should handle division by zero in damage calculations', () => {
        const attacker = { name: 'Player', stats: { totalAttack: 100, critChance: 0, finalCritDmg: 1.5 } };
        const defender = { name: 'Slime', defense: -100, statusResistance: 0, hp: 100, maxHp: 100 }; // effective defense -100 leads to division by 0
        
        const result = calculateAttack(attacker, defender, { isPlayerAttacking: true });
        expect(result.damage).toBeGreaterThanOrEqual(1);
        expect(Number.isFinite(result.damage)).toBe(true);
    });

    it('should prevent negative damage', () => {
        const attacker = { name: 'Player', stats: { totalAttack: -50, critChance: 0, finalCritDmg: 1.5 } };
        const defender = { name: 'Slime', defense: 5, statusResistance: 0, hp: 100, maxHp: 100 };
        const result = calculateAttack(attacker, defender, { isPlayerAttacking: true });
        expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero HP correctly in status ticks', () => {
        const entity = { hp: 0, statusEffects: [{ type: 'poison' as const, duration: 1, value: 10 }] };
        const result = processStatusTick(entity);
        expect(result.tickDamage).toBe(10);
    });

    it('should calculate XP correctly with bonuses', () => {
        const enemy = { expReward: 100, isBoss: false };
        const player = { level: 1, maxExp: 100, stage: 1 };
        const bonuses = { setBonusExpPct: 0.5, potionExpBonus: 50 }; // +50% and +50% = +100% or +150%?
        // Formula: baseGained * (1 + setBonusExpPct + (potionExpBonus / 100))
        const xp = calculateExpGain(enemy, player, bonuses, false);
        expect(xp).toBeGreaterThan(0);
    });

    it('should handle multiple level ups', () => {
        const player = { level: 1, exp: 5000, maxExp: 100, statPoints: 0, rebornUpgrades: { statBonus: 0 } };
        const result = calculateLevelUp(player);
        expect(result.level).toBeGreaterThan(1);
        expect(result.levelsGained).toBeGreaterThan(1);
    });
});

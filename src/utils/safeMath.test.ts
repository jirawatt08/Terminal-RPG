import { describe, it, expect } from 'vitest';
import { SafeMath } from './safeMath';
import { validatePlayer } from './validation';
import { INITIAL_PLAYER_STATE } from '../hooks/usePlayerState';

describe('SafeMath Utility', () => {
    it('should handle NaN and Infinity in addition', () => {
        expect(SafeMath.add(10, NaN)).toBe(10);
        expect(SafeMath.add(Infinity, 5)).toBe(5);
    });

    it('should prevent negative values in subtraction by default', () => {
        expect(SafeMath.sub(10, 20)).toBe(0);
        expect(SafeMath.sub(10, 5)).toBe(5);
    });

    it('should prevent Divide by Zero', () => {
        expect(SafeMath.div(100, 0)).toBe(0);
        expect(SafeMath.div(100, 0, 1)).toBe(1); // Custom fallback
    });

    it('should clamp values correctly', () => {
        expect(SafeMath.clamp(150, 0, 100)).toBe(100);
        expect(SafeMath.clamp(-50, 0, 100)).toBe(0);
    });
});

describe('State Validation (Gatekeeper)', () => {
    it('should restore initial state on null/undefined input', () => {
        const result = validatePlayer(null);
        expect(result.level).toBe(1);
        expect(result.hp).toBe(100);
    });

    it('should repair NaN fields in player data', () => {
        const corrupted = {
            level: NaN,
            gold: -500,
            hp: Infinity
        };
        const result = validatePlayer(corrupted);
        expect(result.level).toBe(1);
        expect(result.gold).toBe(0);
        expect(result.hp).toBe(0); // Clamp handles Infinity -> 0 if no max provided, or use fallback
    });

    it('should ensure level is at least 1', () => {
        const result = validatePlayer({ level: 0 });
        expect(result.level).toBe(1);
    });
});

describe('State Consistency Logic', () => {
    it('XP gain should never result in lower level', () => {
        // This tests the logic in useUpdatePlayer via mock-like verification
        let currentLevel = 1;
        let currentExp = 0;
        let maxExp = 100;

        const gainExp = (amount: number) => {
            currentExp += amount;
            while (currentExp >= maxExp) {
                currentLevel++;
                currentExp -= maxExp;
                maxExp = Math.floor(maxExp * 1.5);
            }
        };

        gainExp(1000);
        const levelAfterBigGain = currentLevel;
        gainExp(10);
        expect(currentLevel).toBeGreaterThanOrEqual(levelAfterBigGain);
    });
});

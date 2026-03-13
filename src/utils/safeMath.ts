/**
 * Safe Math Utility for Terminal-RPG (TS 5.8)
 * Prevents NaN, Infinity, and unexpected negative values in game state.
 */

export const SafeMath = {
    /**
     * Safely adds values, ensuring the result is a finite number.
     * Optional min/max constraints.
     */
    add: (a: number, b: number, min?: number, max?: number): number => {
        const val = (Number.isFinite(a) ? a : 0) + (Number.isFinite(b) ? b : 0);
        return SafeMath.clamp(val, min, max);
    },

    /**
     * Safely subtracts values, ensuring the result doesn't drop below a minimum (e.g., 0 for Gold).
     */
    sub: (a: number, b: number, min: number = 0, max?: number): number => {
        const val = (Number.isFinite(a) ? a : 0) - (Number.isFinite(b) ? b : 0);
        return SafeMath.clamp(val, min, max);
    },

    /**
     * Safely divides values, preventing Divide by Zero (returns 0 instead of Infinity/NaN).
     */
    div: (num: number, den: number, fallback: number = 0): number => {
        if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return fallback;
        const result = num / den;
        return Number.isFinite(result) ? result : fallback;
    },

    /**
     * Safely multiplies values.
     */
    mult: (a: number, b: number, min?: number, max?: number): number => {
        const val = (Number.isFinite(a) ? a : 0) * (Number.isFinite(b) ? b : 0);
        return SafeMath.clamp(val, min, max);
    },

    /**
     * Clamps a value between min and max, ensuring it is never NaN.
     */
    clamp: (val: number, min?: number, max?: number): number => {
        let result = Number.isFinite(val) ? val : 0;
        if (min !== undefined) result = Math.max(min, result);
        if (max !== undefined) result = Math.min(max, result);
        return result;
    },

    /**
     * Validates if a value is safe for game state.
     */
    isSafe: (val: any): val is number => {
        return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
    }
} as const;

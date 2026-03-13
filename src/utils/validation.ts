import { Player } from '../types';
import { INITIAL_PLAYER_STATE } from '../hooks/usePlayerState';
import { SafeMath } from './safeMath';

/**
 * Validates player data before commitment to storage or Firebase.
 * Acts as a Gatekeeper to prevent corrupted state.
 */
export function validatePlayer(data: any): Player {
    if (!data || typeof data !== 'object') {
        return INITIAL_PLAYER_STATE;
    }

    // Clone initial state as base to ensure all required fields exist
    const player: Player = { ...INITIAL_PLAYER_STATE, ...data };

    // Core Numeric Gating
    player.level = SafeMath.clamp(Math.floor(Number(player.level)), 1, 999);
    player.exp = SafeMath.clamp(Number(player.exp), 0);
    player.maxExp = SafeMath.clamp(Number(player.maxExp), 100);
    
    player.hp = SafeMath.clamp(Number(player.hp), 0);
    player.maxHp = SafeMath.clamp(Number(player.maxHp), 1);
    player.mp = SafeMath.clamp(Number(player.mp), 0);
    player.maxMp = SafeMath.clamp(Number(player.maxMp), 1);
    
    player.gold = SafeMath.clamp(Math.floor(Number(player.gold)), 0);
    player.stage = SafeMath.clamp(Math.floor(Number(player.stage)), 1);
    
    // Ensure nested objects are valid
    if (!player.stats || typeof player.stats !== 'object') {
        player.stats = { ...INITIAL_PLAYER_STATE.stats };
    } else {
        player.stats.str = SafeMath.clamp(Number(player.stats.str), 0);
        player.stats.agi = SafeMath.clamp(Number(player.stats.agi), 0);
        player.stats.vit = SafeMath.clamp(Number(player.stats.vit), 0);
        player.stats.int = SafeMath.clamp(Number(player.stats.int), 0);
        player.stats.luk = SafeMath.clamp(Number(player.stats.luk), 0);
    }

    // Array Safety
    player.inventory = Array.isArray(player.inventory) ? player.inventory : [];
    player.equipment = (player.equipment && typeof player.equipment === 'object') 
        ? player.equipment 
        : { ...INITIAL_PLAYER_STATE.equipment };

    return player;
}

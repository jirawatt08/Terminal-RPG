export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';

export type ItemType = 'Weapon' | 'Armor' | 'Accessory';

export type EffectType = 'lifesteal' | 'crit' | 'dodge' | 'poison' | 'burn' | 'stun' | 'freeze';

export type StatusEffectType = 'poison' | 'burn' | 'stun' | 'freeze';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  value?: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  value: number; // Base stat (ATK or DEF)
  sellPrice: number;
  effect?: { type: EffectType; value: number };
  setName?: string;
  upgradeLevel?: number;
}

export type PlayerClass = 'Novice' | 'Warrior' | 'Rogue' | 'Mage' | 'Paladin' | 'Berserker' | 'Assassin' | 'Ranger' | 'Archmage' | 'Necromancer';

export interface PlayerStats {
  str: number; // Attack
  agi: number; // Crit & Dodge
  vit: number; // HP & Def
  int: number; // Skill/Magic
}

export interface Player {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  baseAttack: number;
  baseDefense: number;
  gold: number;
  stage: number;
  statPoints: number;
  stats: PlayerStats;
  playerClass: PlayerClass;
  inventory: Item[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
  autoSell: Record<Rarity, boolean>;
  autoSkill: boolean;
  inventoryLimit: number;
  autoSellUnlocked: boolean;
  skillCooldown: number;
  statusEffects: StatusEffect[];
}

export interface EnemySkill {
  name: string;
  mult: number;
  cooldown: number;
  currentCooldown: number;
  effect?: { type: StatusEffectType; duration: number; value?: number };
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  expReward: number;
  goldReward: number;
  isBoss: boolean;
  skill?: EnemySkill;
  statusEffects: StatusEffect[];
}

export type GameState = 'IDLE' | 'FARMING' | 'BOSS_FIGHT' | 'NEXT_BOSS_FIGHT' | 'VILLAGE' | 'DEAD';

export interface LogEntry {
  id: string;
  timestamp: Date;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'error' | 'success' | 'system' | 'warning';
}

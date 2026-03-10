export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';

export type ItemType = 'Weapon' | 'Armor' | 'Accessory';

export type EffectType = 'lifesteal' | 'crit' | 'dodge';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  value: number; // Base stat (ATK or DEF)
  sellPrice: number;
  effect?: { type: EffectType; value: number };
  setName?: string;
}

export type PlayerClass = 'Novice' | 'Warrior' | 'Rogue' | 'Mage';

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
}

export interface EnemySkill {
  name: string;
  mult: number;
  cooldown: number;
  currentCooldown: number;
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
}

export type GameState = 'IDLE' | 'FARMING' | 'BOSS_FIGHT' | 'DEAD';

export interface LogEntry {
  id: string;
  timestamp: Date;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'error' | 'success' | 'system' | 'warning';
}

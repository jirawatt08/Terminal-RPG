export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';

export type ItemType = 'Weapon' | 'Armor' | 'Accessory';

export type EffectType = 'lifesteal' | 'crit' | 'dodge' | 'poison' | 'burn' | 'stun' | 'freeze' | 'luck' | 'statusChance' | 'reduction' | 'expBonus' | 'goldBonus';

export interface PotionEffect {
  type: 'exp' | 'coin' | 'luck';
  value: number;
  duration: number; // in kills
}

export interface Potion {
  id: string;
  name: string;
  effect: PotionEffect;
  cost: number;
}

export interface QuestRequirement {
  type: 'kill_monster' | 'kill_boss';
  target: number;
  current: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  requirement: QuestRequirement;
  reward: {
    exp: number;
    gold: number;
  };
  completed: boolean;
}

export type StatusEffectType = 'poison' | 'burn' | 'stun' | 'freeze';

export type EnemyPassiveType = 'reflect' | 'regen' | 'thorns' | 'dodge' | 'lifesteal' | 'berserk' | 'shield';

export interface EnemyPassive {
  type: EnemyPassiveType;
  value: number;
  description: string;
}

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
  locked?: boolean;
}

export type PlayerClass = 'Novice' | 'Warrior' | 'Rogue' | 'Mage' | 'Paladin' | 'Berserker' | 'Assassin' | 'Ranger' | 'Archmage' | 'Necromancer';

export interface PlayerStats {
  str: number; // Attack
  agi: number; // Crit & Dodge
  vit: number; // HP & Def
  int: number; // Skill/Magic
  luk: number; // Luck
}

export interface PlayerSettings {
  barMode: 'bar' | 'number' | 'percent';
  reduceUi: boolean;
}

export interface Player {
  uid?: string;
  displayName?: string;
  photoURL?: string;
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
  autoBoss: boolean;
  inventoryLimit: number;
  autoSellUnlocked: boolean;
  skillCooldown: number;
  statusEffects: StatusEffect[];
  settings: PlayerSettings;
  rebornPoints: number;
  rebornCount: number;
  rebornUpgrades: {
    atkBonus: number; // Permanent ATK % bonus
    hpBonus: number;  // Permanent HP % bonus
    expBonus: number; // Permanent EXP % bonus
    goldBonus: number; // Permanent Gold % bonus
    statBonus: number; // Extra stat points per level
  };
  potions: PotionEffect[];
  quests: Quest[];
  monstersKilled: number;
  bossesKilled: number;
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
  passive?: EnemyPassive;
  statusEffects: StatusEffect[];
}

export type GameState = 'IDLE' | 'FARMING' | 'BOSS_FIGHT' | 'NEXT_BOSS_FIGHT' | 'VILLAGE' | 'DEAD' | 'SETTINGS' | 'DASHBOARD';

export interface LogEntry {
  id: string;
  timestamp: Date;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'error' | 'success' | 'system' | 'warning';
}

export interface RebornRecord {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  level: number;
  stage: number;
  gold: number;
  rebornCount: number;
  timestamp: any; // Firestore Timestamp
}

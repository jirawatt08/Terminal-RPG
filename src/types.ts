export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';

export type ItemType = 'Weapon' | 'Armor' | 'Accessory';

export type EffectType = 'lifesteal' | 'crit' | 'dodge' | 'poison' | 'burn' | 'stun' | 'freeze' | 'luck' | 'statusChance' | 'reduction' | 'expBonus' | 'goldBonus';

export type PotionType = 'exp' | 'coin' | 'luck' | 'health';

export interface PotionEffect {
  type: PotionType;
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

export type EnemyPassiveType = 'reflect' | 'regen' | 'thorns' | 'dodge' | 'lifesteal' | 'berserk' | 'shield' | 'summoner';

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

// Discriminated Union for Items
export interface BaseItem {
  id: string;
  name: string;
  rarity: Rarity;
  sellPrice: number;
  locked?: boolean;
}

export interface EquippableItem extends BaseItem {
  category: 'Equippable';
  type: ItemType;
  value: number; // Base stat (ATK or DEF)
  effect?: { type: EffectType; value: number };
  stats?: Partial<PlayerStats>;
  setName?: string;
  upgradeLevel?: number;
}

export interface ConsumableItem extends BaseItem {
  category: 'Consumable';
  type: 'Potion';
  effect: PotionEffect;
}

export type Item = EquippableItem | ConsumableItem;

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

export interface RebornHistoryEntry {
  id: string;
  level: number;
  stage: number;
  gold: number;
  monstersKilled: number;
  bossesKilled: number;
  timestamp: Date;
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
    weapon: EquippableItem | null;
    armor: EquippableItem | null;
    accessory: EquippableItem | null;
  };
  autoSell: Record<Rarity, boolean>;
  autoSkill: boolean;
  autoBoss: boolean;
  inventoryLimit: number;
  autoSellUnlocked: boolean;
  autoHealUnlocked: boolean;
  autoHealEnabled: boolean;
  autoHealThreshold: number; // HP % to trigger auto-heal
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
    pointBonus: number; // Permanent reborn point % bonus
  };
  potions: PotionEffect[];
  potionMaxBuyUpgrade: number;
  potionQualityUpgrade: number;
  quests: Quest[];
  rebornHistory: RebornHistoryEntry[];
  monstersKilled: number;
  bossesKilled: number;
}

// Discriminated Union for Game Events (TS 5.8 ready)
export type GameEvent =
  | { type: 'ATTACK'; attackerId: string; targetId: string; damage: number; isCrit: boolean; isSkill?: boolean; skillName?: string }
  | { type: 'LOOT'; item: Item; goldGained: number }
  | { type: 'LEVEL_UP'; oldLevel: number; newLevel: number; statPointsGained: number }
  | { type: 'SYNC'; method: 'CLOUD' | 'LOCAL'; timestamp: Date; success: boolean };

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
  critChance: number;
  critDamage: number;
  statusResistance: number;
  armorPenetration: number;
}

export type GameState = 'IDLE' | 'FARMING' | 'BOSS_FIGHT' | 'NEXT_BOSS_FIGHT' | 'VILLAGE' | 'DEAD' | 'SETTINGS' | 'DASHBOARD' | 'PATCHES';

export type LogType = 'info' | 'combat' | 'loot' | 'error' | 'success' | 'system' | 'warning' | 'sell';

export interface LogEntry {
  id: string;
  timestamp: Date;
  text: string;
  type: LogType;
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
  monstersKilled: number;
  bossesKilled: number;
  timestamp: Date | { seconds: number; nanoseconds: number }; // Supports both native Date and Firestore Timestamp
}

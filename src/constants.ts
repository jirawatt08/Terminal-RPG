import { Rarity, StatusEffectType } from './types';

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
  Mythic: 'text-red-500',
  Divine: 'text-cyan-400',
};

export const WEAPON_NAMES = ['Sword', 'Dagger', 'Axe', 'Mace', 'Spear', 'Bow', 'Staff', 'Wand'];
export const ARMOR_NAMES = ['Tunic', 'Chainmail', 'Plate Armor', 'Leather Vest', 'Robes', 'Cloak'];
export const ACCESSORY_NAMES = ['Ring', 'Amulet', 'Pendant', 'Charm', 'Bracelet'];

export const ADJECTIVES = ['Rusty', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Demonic', 'Divine', 'Cursed', 'Blessed', 'Ancient', 'Void'];
export const SET_NAMES = ['Phantom', 'Berserker', 'Guardian', 'Sage', 'Shadow', 'Celestial', 'Iron', 'Merchant', 'Explorer', 'Vampire', 'Assassin', 'Reflex', 'Scholar', 'Warlord', 'Duelist'];

export interface StatModifiers {
  str?: number;
  agi?: number;
  vit?: number;
  int?: number;
  luk?: number;
  atk?: number;
  def?: number;
  hp?: number;
  mp?: number;
  magicAtk?: number;
  gold?: number;
  exp?: number;
  dodge?: number;
  crit?: number;
  critDmg?: number;
  lifesteal?: number;
  skillHaste?: number;
  reflection?: number;
}

export const CLASS_MODIFIERS: Record<string, StatModifiers> = {
  Warrior: { vit: 1.2, str: 1.1, hp: 1.1, def: 1.1 },
  Rogue: { agi: 1.2, luk: 1.1, crit: 10, critDmg: 0.2 },
  Mage: { int: 1.2, vit: 1.1, magicAtk: 1.2 },
  Paladin: { vit: 1.3, int: 1.2, hp: 1.2, def: 1.2, magicAtk: 1.1 },
  Berserker: { str: 1.3, agi: 1.2, atk: 0.3, lifesteal: 10 },
  Assassin: { agi: 1.3, luk: 1.2, crit: 20, critDmg: 0.4 },
  Ranger: { agi: 1.2, str: 1.2, crit: 15, dodge: 15 },
  Archmage: { int: 1.4, vit: 1.2, magicAtk: 1.4 },
  Necromancer: { int: 1.3, luk: 1.3, magicAtk: 1.2, lifesteal: 15 }
};

export const SET_BONUSES_DATA: Record<string, StatModifiers> = {
  Berserker: { atk: 0.2 },
  Iron: { def: 0.2 },
  Guardian: { hp: 0.2, def: 0.2 },
  Sage: { mp: 0.2, magicAtk: 0.2 },
  Celestial: { str: 0.1, agi: 0.1, vit: 0.1, int: 0.1, luk: 0.1 },
  Merchant: { gold: 0.5 },
  Explorer: { exp: 0.5 },
  Phantom: { dodge: 15 },
  Shadow: { crit: 10, dodge: 10 },
  Assassin: { crit: 15 },
  Vampire: { lifesteal: 15 },
  Reflex: { reflection: 20 },
  Scholar: { skillHaste: 20 },
  Warlord: { str: 0.15, agi: 0.15, vit: 0.15, int: 0.15, luk: 0.15 },
  Duelist: { critDmg: 0.4 }
};

export const SET_BONUSES: Record<string, string> = {
  Berserker: "+20% Attack",
  Iron: "+20% Defense",
  Guardian: "+20% HP & Defense",
  Sage: "+20% MP & Magic Power",
  Celestial: "+10% All Stats",
  Merchant: "+50% Gold Gain",
  Explorer: "+50% EXP Gain",
  Phantom: "+15% Dodge Rate",
  Shadow: "+10% Crit & Dodge Rate",
  Assassin: "+15% Crit Rate",
  Vampire: "+15% Lifesteal",
  Reflex: "+20% Damage Reflection",
  Scholar: "+20% Skill Haste",
  Warlord: "+15% All Stats",
  Duelist: "+40% Crit Damage"
};

export interface Skill {
  name: string;
  cost: number;
  type: 'physical' | 'magic';
  mult: number;
  guaranteedCrit: boolean;
  aoe: boolean;
  cooldown: number;
  unlockLevel: number;
  statusEffect?: { type: StatusEffectType; chance: number; duration: number };
}

export const CLASS_SKILLS: Record<string, Skill[]> = {
  Novice: [
    { name: 'Quick Slash', cost: 20, type: 'physical', mult: 1.2, guaranteedCrit: false, aoe: false, cooldown: 3, unlockLevel: 1 }
  ],
  Warrior: [
    { name: 'Heavy Strike', cost: 40, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: false, cooldown: 5, unlockLevel: 1 },
    { name: 'Shield Bash', cost: 100, type: 'physical', mult: 2.5, guaranteedCrit: false, aoe: true, cooldown: 8, unlockLevel: 30, statusEffect: { type: 'freeze', chance: 20, duration: 2 } }
  ],
  Rogue: [
    { name: 'Assassinate', cost: 35, type: 'physical', mult: 1.5, guaranteedCrit: true, aoe: false, cooldown: 4, unlockLevel: 1 },
    { name: 'Fan of Knives', cost: 90, type: 'physical', mult: 1.8, guaranteedCrit: false, aoe: true, cooldown: 6, unlockLevel: 30, statusEffect: { type: 'poison', chance: 25, duration: 3 } }
  ],
  Mage: [
    { name: 'Fireball', cost: 50, type: 'magic', mult: 2.5, guaranteedCrit: false, aoe: true, cooldown: 6, unlockLevel: 1, statusEffect: { type: 'burn', chance: 30, duration: 3 } },
    { name: 'Chain Lightning', cost: 120, type: 'magic', mult: 3.5, guaranteedCrit: false, aoe: true, cooldown: 10, unlockLevel: 30 }
  ],
  Paladin: [
    { name: 'Holy Smite', cost: 60, type: 'magic', mult: 3.0, guaranteedCrit: false, aoe: true, cooldown: 8, unlockLevel: 1 },
    { name: 'Divine Storm', cost: 150, type: 'magic', mult: 4.5, guaranteedCrit: false, aoe: true, cooldown: 12, unlockLevel: 30, statusEffect: { type: 'burn', chance: 20, duration: 3 } }
  ],
  Berserker: [
    { name: 'Rampage', cost: 55, type: 'physical', mult: 3.5, guaranteedCrit: false, aoe: false, cooldown: 10, unlockLevel: 1 },
    { name: 'Whirlwind', cost: 130, type: 'physical', mult: 4.0, guaranteedCrit: false, aoe: true, cooldown: 14, unlockLevel: 30 }
  ],
  Assassin: [
    { name: 'Shadow Strike', cost: 45, type: 'physical', mult: 2.5, guaranteedCrit: true, aoe: false, cooldown: 6, unlockLevel: 1, statusEffect: { type: 'poison', chance: 40, duration: 4 } },
    { name: 'Blade Flurry', cost: 110, type: 'physical', mult: 3.0, guaranteedCrit: true, aoe: true, cooldown: 9, unlockLevel: 30, statusEffect: { type: 'poison', chance: 30, duration: 3 } }
  ],
  Ranger: [
    { name: 'Arrow Rain', cost: 50, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: true, cooldown: 7, unlockLevel: 1 },
    { name: 'Explosive Shot', cost: 125, type: 'physical', mult: 3.5, guaranteedCrit: true, aoe: true, cooldown: 11, unlockLevel: 30, statusEffect: { type: 'burn', chance: 50, duration: 2 } }
  ],
  Archmage: [
    { name: 'Meteor', cost: 80, type: 'magic', mult: 5.0, guaranteedCrit: false, aoe: true, cooldown: 15, unlockLevel: 1, statusEffect: { type: 'burn', chance: 40, duration: 4 } },
    { name: 'Arcane Nova', cost: 200, type: 'magic', mult: 7.0, guaranteedCrit: true, aoe: true, cooldown: 20, unlockLevel: 30, statusEffect: { type: 'freeze', chance: 30, duration: 2 } }
  ],
  Necromancer: [
    { name: 'Soul Drain', cost: 70, type: 'magic', mult: 3.0, guaranteedCrit: false, aoe: false, cooldown: 9, unlockLevel: 1 },
    { name: 'Death Coil', cost: 180, type: 'magic', mult: 5.0, guaranteedCrit: false, aoe: true, cooldown: 14, unlockLevel: 30, statusEffect: { type: 'poison', chance: 50, duration: 5 } }
  ]
} as const;

export type TerminalTab = 'ALL' | 'FIGHT' | 'DROP' | 'SELL';

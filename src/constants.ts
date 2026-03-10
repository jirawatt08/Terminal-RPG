import { Rarity } from './types';

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
  Mythic: 'text-red-500',
  Divine: 'text-cyan-400',
};

export const MONSTER_NAMES = ['Slime', 'Goblin', 'Skeleton', 'Wolf', 'Spider', 'Bat', 'Zombie', 'Orc', 'Troll', 'Golem'];
export const BOSS_NAMES = ['Dragon', 'Lich', 'Demon Lord', 'Giant Behemoth', 'Vampire King', 'Fallen Angel', 'Titan'];

export const WEAPON_NAMES = ['Sword', 'Dagger', 'Axe', 'Mace', 'Spear', 'Bow', 'Staff', 'Wand'];
export const ARMOR_NAMES = ['Tunic', 'Chainmail', 'Plate Armor', 'Leather Vest', 'Robes', 'Cloak'];
export const ACCESSORY_NAMES = ['Ring', 'Amulet', 'Pendant', 'Charm', 'Bracelet'];

export const ADJECTIVES = ['Rusty', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Demonic', 'Divine', 'Cursed', 'Blessed', 'Ancient', 'Void'];
export const SET_NAMES = ['Phantom', 'Berserker', 'Guardian', 'Sage', 'Shadow', 'Celestial', 'Iron', 'Merchant', 'Explorer', 'Vampire', 'Assassin'];

export const CLASS_SKILLS = {
  Novice: null,
  Warrior: { name: 'Heavy Strike', cost: 20, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: false, cooldown: 3 },
  Rogue: { name: 'Assassinate', cost: 15, type: 'physical', mult: 1.5, guaranteedCrit: true, aoe: false, cooldown: 2 },
  Mage: { name: 'Fireball', cost: 30, type: 'magic', mult: 2.5, guaranteedCrit: false, aoe: true, cooldown: 4 },
  Paladin: { name: 'Holy Smite', cost: 40, type: 'magic', mult: 3.0, guaranteedCrit: false, aoe: true, cooldown: 5 },
  Berserker: { name: 'Rampage', cost: 35, type: 'physical', mult: 3.5, guaranteedCrit: false, aoe: false, cooldown: 4 },
  Assassin: { name: 'Shadow Strike', cost: 25, type: 'physical', mult: 2.5, guaranteedCrit: true, aoe: false, cooldown: 3 },
  Ranger: { name: 'Arrow Rain', cost: 30, type: 'physical', mult: 2.0, guaranteedCrit: false, aoe: true, cooldown: 4 },
  Archmage: { name: 'Meteor', cost: 60, type: 'magic', mult: 5.0, guaranteedCrit: false, aoe: true, cooldown: 6 },
  Necromancer: { name: 'Soul Drain', cost: 45, type: 'magic', mult: 3.0, guaranteedCrit: false, aoe: false, cooldown: 5 }
} as const;

export type TerminalTab = 'ALL' | 'FIGHT' | 'DROP' | 'SELL';

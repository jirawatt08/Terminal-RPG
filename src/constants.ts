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
export const SET_NAMES = ['Phantom', 'Berserker', 'Guardian', 'Sage', 'Shadow', 'Celestial'];

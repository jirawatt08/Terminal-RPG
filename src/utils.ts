import { Enemy, Item, ItemType, Rarity, EffectType } from './types';
import { MONSTER_NAMES, BOSS_NAMES, WEAPON_NAMES, ARMOR_NAMES, ACCESSORY_NAMES, ADJECTIVES, SET_NAMES } from './constants';

export const generateId = () => Math.random().toString(36).substring(2, 9);

const ENEMY_SKILLS = [
  { name: 'Slam', mult: 1.5, cooldown: 3 },
  { name: 'Bite', mult: 1.2, cooldown: 2 },
  { name: 'Venom Strike', mult: 1.8, cooldown: 4 },
];
const BOSS_SKILLS = [
  { name: 'Inferno', mult: 2.5, cooldown: 4 },
  { name: 'Annihilate', mult: 3.0, cooldown: 5 },
  { name: 'Earthquake', mult: 2.0, cooldown: 3 },
];

export const generateEnemy = (playerLevel: number, stage: number, isBoss: boolean = false): Enemy => {
  const multiplier = (isBoss ? 5 : 1) * (1 + stage * 0.2);
  const levelVariance = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);
  
  const hasSkill = isBoss || Math.random() > 0.6;
  let skill;
  if (hasSkill) {
    const skillTemplate = isBoss 
      ? BOSS_SKILLS[Math.floor(Math.random() * BOSS_SKILLS.length)]
      : ENEMY_SKILLS[Math.floor(Math.random() * ENEMY_SKILLS.length)];
    skill = { ...skillTemplate, currentCooldown: 2 }; // Starts with 2 turns before first use
  }

  return {
    id: generateId(),
    name: isBoss ? BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)] : `${MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)]} Lv.${levelVariance}`,
    hp: Math.floor((20 + levelVariance * 10) * multiplier),
    maxHp: Math.floor((20 + levelVariance * 10) * multiplier),
    attack: Math.floor((5 + levelVariance * 2) * multiplier),
    defense: Math.floor((2 + levelVariance) * multiplier),
    expReward: Math.floor((10 + levelVariance * 5) * multiplier),
    goldReward: Math.floor((5 + levelVariance * 2) * multiplier),
    isBoss,
    skill
  };
};

export const generateEnemies = (playerLevel: number, stage: number, isBoss: boolean = false): Enemy[] => {
  if (isBoss) return [generateEnemy(playerLevel, stage, true)];
  const countRoll = Math.random();
  const count = countRoll > 0.85 ? 3 : countRoll > 0.5 ? 2 : 1;
  return Array.from({ length: count }, () => generateEnemy(playerLevel, stage, false));
};

export const generateLoot = (playerLevel: number, stage: number, isBoss: boolean = false): Item | null => {
  const chance = Math.random();
  if (chance > (isBoss ? 0.9 : 0.35)) return null;

  const typeRoll = Math.random();
  const type: ItemType = typeRoll > 0.66 ? 'Weapon' : typeRoll > 0.33 ? 'Armor' : 'Accessory';
  
  let rarity: Rarity = 'Common';
  const baseRoll = Math.random();
  const rarityRoll = baseRoll + (stage * 0.01); // +1% chance per stage to roll higher

  if (isBoss) {
    if (rarityRoll > 0.98) rarity = 'Divine';
    else if (rarityRoll > 0.90) rarity = 'Mythic';
    else if (rarityRoll > 0.75) rarity = 'Legendary';
    else rarity = 'Epic';
  } else {
    if (rarityRoll > 0.999) rarity = 'Divine';
    else if (rarityRoll > 0.99) rarity = 'Mythic';
    else if (rarityRoll > 0.95) rarity = 'Legendary';
    else if (rarityRoll > 0.85) rarity = 'Epic';
    else if (rarityRoll > 0.60) rarity = 'Rare';
    else if (rarityRoll > 0.30) rarity = 'Uncommon';
  }

  const rarityMultiplier = { Common: 1, Uncommon: 1.5, Rare: 2, Epic: 3, Legendary: 5, Mythic: 8, Divine: 15 }[rarity];
  const value = Math.floor((playerLevel * 2 + stage * 5 + Math.random() * 5) * rarityMultiplier);
  
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = type === 'Weapon' ? WEAPON_NAMES[Math.floor(Math.random() * WEAPON_NAMES.length)] 
             : type === 'Armor' ? ARMOR_NAMES[Math.floor(Math.random() * ARMOR_NAMES.length)]
             : ACCESSORY_NAMES[Math.floor(Math.random() * ACCESSORY_NAMES.length)];
  
  let effect: { type: EffectType; value: number } | undefined;
  let setName: string | undefined;

  if (rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Divine') {
    const effectTypes: EffectType[] = ['lifesteal', 'crit', 'dodge'];
    effect = {
      type: effectTypes[Math.floor(Math.random() * effectTypes.length)],
      value: Math.floor(Math.random() * 10) + (rarityMultiplier * 2)
    };
    if (Math.random() > 0.5) {
      setName = SET_NAMES[Math.floor(Math.random() * SET_NAMES.length)];
    }
  }

  let finalName = `${adj} ${noun}`;
  if (setName) finalName = `${setName}'s ${finalName}`;

  return {
    id: generateId(),
    name: finalName,
    type,
    rarity,
    value,
    sellPrice: value * 10,
    effect,
    setName
  };
};

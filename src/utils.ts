import { Enemy, Item, ItemType, Rarity, EffectType } from './types';
import { WEAPON_NAMES, ARMOR_NAMES, ACCESSORY_NAMES, ADJECTIVES, SET_NAMES } from './constants';
import { MONSTER_TEMPLATES } from './data/monsters';
import { BOSS_TEMPLATES } from './data/bosses';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateEnemy = (playerLevel: number, stage: number, isBoss: boolean = false): Enemy => {
  const stageMultiplier = 1 + stage * 0.2;
  const levelVariance = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);

  const template = isBoss
    ? BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)]
    : MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];

  const skill = template.skill ? { ...template.skill, currentCooldown: 2 } : undefined;
  const passive = template.passive ? { ...template.passive } : undefined;

  return {
    id: generateId(),
    name: isBoss ? `BOSS: ${template.name}` : `${template.name} Lv.${levelVariance}`,
    hp: Math.floor((20 + levelVariance * 10) * template.hpMult * stageMultiplier),
    maxHp: Math.floor((20 + levelVariance * 10) * template.hpMult * stageMultiplier),
    attack: Math.floor((5 + levelVariance * 2) * template.atkMult * stageMultiplier),
    defense: Math.floor((2 + levelVariance) * template.defMult * stageMultiplier),
    expReward: Math.floor((10 + levelVariance * 5) * (isBoss ? 5 : 1) * stageMultiplier),
    goldReward: Math.floor((5 + levelVariance * 2) * (isBoss ? 5 : 1) * stageMultiplier),
    isBoss,
    skill,
    passive,
    statusEffects: []
  };
};

export const generateEnemies = (playerLevel: number, stage: number, isBoss: boolean = false): Enemy[] => {
  if (isBoss) return [generateEnemy(playerLevel, stage, true)];
  const countRoll = Math.random();
  const count = countRoll > 0.85 ? 3 : countRoll > 0.5 ? 2 : 1;
  return Array.from({ length: count }, () => generateEnemy(playerLevel, stage, false));
};

export const generateLoot = (playerLevel: number, stage: number, isBoss: boolean = false, luck: number = 0): Item | null => {
  const chance = Math.random();
  // Luck increases drop chance slightly
  // Luck increases drop chance slightly (Nerfed: 0.0005 per point)
  const dropThreshold = isBoss ? 0.95 : (0.4 + (luck * 0.0005));
  if (chance > dropThreshold) return null;

  const typeRoll = Math.random();
  const type: ItemType = typeRoll > 0.66 ? 'Weapon' : typeRoll > 0.33 ? 'Armor' : 'Accessory';

  let rarity: Rarity = 'Common';
  const baseRoll = Math.random();
  // Luck increases rarity roll: each point of luck adds 0.05% chance (Nerfed from 0.1%)
  const rarityRoll = baseRoll + (stage * 0.004) + (luck * 0.0005);

  if (isBoss) {
    if (rarityRoll > 0.995) rarity = 'Divine';
    else if (rarityRoll > 0.97) rarity = 'Mythic';
    else if (rarityRoll > 0.9) rarity = 'Legendary';
    else rarity = 'Epic';
  } else {
    if (rarityRoll > 0.99995) rarity = 'Divine';
    else if (rarityRoll > 0.997) rarity = 'Mythic';
    else if (rarityRoll > 0.99) rarity = 'Legendary';
    else if (rarityRoll > 0.94) rarity = 'Epic';
    else if (rarityRoll > 0.8) rarity = 'Rare';
    else if (rarityRoll > 0.5) rarity = 'Uncommon';
  }

  const rarityMultiplier = { Common: 1, Uncommon: 1.5, Rare: 2, Epic: 3, Legendary: 5, Mythic: 8, Divine: 15 }[rarity];
  const value = Math.floor((playerLevel * 1.2 + stage * 2 + Math.random() * 3) * rarityMultiplier);

  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = type === 'Weapon' ? WEAPON_NAMES[Math.floor(Math.random() * WEAPON_NAMES.length)]
    : type === 'Armor' ? ARMOR_NAMES[Math.floor(Math.random() * ARMOR_NAMES.length)]
      : ACCESSORY_NAMES[Math.floor(Math.random() * ACCESSORY_NAMES.length)];

  let effect: { type: EffectType; value: number } | undefined;
  let setName: string | undefined;

  if (rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Divine') {
    const effectTypes: EffectType[] = ['lifesteal', 'crit', 'dodge', 'poison', 'burn', 'stun', 'freeze', 'luck', 'statusChance'];
    const selectedType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
    effect = {
      type: selectedType,
      value: selectedType === 'luck'
        ? Math.floor(Math.random() * 10) + (rarityMultiplier * 2)
        : selectedType === 'statusChance'
          ? Math.floor(Math.random() * 5) + rarityMultiplier
          : Math.floor(Math.random() * 10) + (rarityMultiplier * 2)
    };

    // Unique items (Mythic/Divine) don't need a set name, they are unique
    if (rarity === 'Mythic' || rarity === 'Divine') {
      setName = undefined;
    } else if (Math.random() > 0.5) {
      setName = SET_NAMES[Math.floor(Math.random() * SET_NAMES.length)];
    }
  }

  let finalName = `${adj} ${noun}`;
  if (setName) finalName = `${setName}'s ${finalName}`;
  else if (rarity === 'Mythic' || rarity === 'Divine') finalName = `${finalName} of the Ancients`;

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

import { Enemy, Item, ItemType, Rarity, EffectType, PlayerStats } from './types';
import { WEAPON_NAMES, ARMOR_NAMES, ACCESSORY_NAMES, ADJECTIVES, SET_NAMES } from './constants';
import { MONSTER_TEMPLATES } from './data/monsters';
import { BOSS_TEMPLATES } from './data/bosses';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateEnemy = (playerLevel: number, stage: number, isBoss: boolean = false): Enemy => {
  // Hybrid scaling: linear for early game, exponential for late game
  let stageMultiplier = 1.0;
  if (stage <= 5) {
    // Linear: 0.7, 0.9, 1.1, 1.3, 1.5
    stageMultiplier = 0.7 + (stage - 1) * 0.2;
  } else {
    // Exponential: 1.5 * 1.12^(stage-5)
    stageMultiplier = 1.5 * Math.pow(1.12, stage - 5);
  }

  // Bosses are stronger, but less overwhelmingly so in early stages (1.25x vs 1.5x)
  const bossBonus = stage <= 5 ? 1.25 : 1.5;
  const bossStageMultiplier = isBoss ? stageMultiplier * bossBonus : stageMultiplier;
  
  const expStageMultiplier = 1 + Math.pow(stage, 1.2) * 0.5;
  const levelVariance = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);

  const template = isBoss
    ? BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)]
    : MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];

  const skill = template.skill ? { ...template.skill, currentCooldown: 2 } : undefined;
  const passive = template.passive ? { ...template.passive } : undefined;

  // New Enemy Stats: Crit and Resistance
  const critChance = Math.min(50, (stage * 0.5) + (isBoss ? 10 : 0));
  const critDamage = 1.2 + (stage * 0.01) + (isBoss ? 0.3 : 0);
  const statusResistance = Math.min(80, (stage * 1.5) + (isBoss ? 30 : 0));
  
  // New Enemy Stat: Armor Penetration (Reduced growth for early game)
  const armorPenetration = isBoss 
    ? Math.min(75, (stage <= 5 ? 5 : 15) + stage * 1.5) 
    : Math.min(50, stage * 0.5);

  return {
    id: generateId(),
    name: isBoss ? `BOSS: ${template.name}` : `${template.name} Lv.${levelVariance}`,
    // Reduced growth: 20 -> 12 HP/lvl, 4 -> 2.5 ATK/lvl
    hp: Math.floor((20 + levelVariance * 12) * template.hpMult * bossStageMultiplier),
    maxHp: Math.floor((20 + levelVariance * 12) * template.hpMult * bossStageMultiplier),
    attack: Math.floor((5 + levelVariance * 2.5) * template.atkMult * bossStageMultiplier),
    defense: Math.floor((2 + levelVariance * 1.2) * template.defMult * bossStageMultiplier),
    expReward: Math.floor((15 + levelVariance * 5) * (isBoss ? 5 : 1) * expStageMultiplier),
    goldReward: Math.floor((5 + levelVariance * 2) * (isBoss ? 5 : 1) * bossStageMultiplier),
    isBoss,
    skill,
    passive,
    statusEffects: [],
    critChance,
    critDamage,
    statusResistance,
    armorPenetration
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
  // Luck increases rarity roll: each point of luck adds 0.08% chance
  const rarityRoll = baseRoll + (stage * 0.004) + (luck * 0.0008); // Increased from 0.0005

  if (isBoss) {
    if (rarityRoll > 1.15) rarity = 'Divine';
    else if (rarityRoll > 1.05) rarity = 'Mythic';
    else if (rarityRoll > 0.95) rarity = 'Legendary';
    else rarity = 'Epic';
  } else {
    if (rarityRoll > 1.3) rarity = 'Divine';
    else if (rarityRoll > 1.2) rarity = 'Mythic';
    else if (rarityRoll > 1.1) rarity = 'Legendary';
    else if (rarityRoll > 1.0) rarity = 'Epic';
    else if (rarityRoll > 0.8) rarity = 'Rare';
    else if (rarityRoll > 0.45) rarity = 'Uncommon';
  }

  // Rarity Gating by Stage
  if (rarity === 'Divine' && stage < 10) rarity = 'Mythic';
  if (rarity === 'Mythic' && stage < 5) rarity = 'Legendary';
  // Legendary is base (Stage 1) as requested.

  const rarityMultiplier = { Common: 1, Uncommon: 1.5, Rare: 2, Epic: 3, Legendary: 5, Mythic: 7.2, Divine: 11.25 }[rarity];
  const value = Math.floor((playerLevel * 1.2 + stage * 2 + Math.random() * 3) * rarityMultiplier);

  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = type === 'Weapon' ? WEAPON_NAMES[Math.floor(Math.random() * WEAPON_NAMES.length)]
    : type === 'Armor' ? ARMOR_NAMES[Math.floor(Math.random() * ARMOR_NAMES.length)]
      : ACCESSORY_NAMES[Math.floor(Math.random() * ACCESSORY_NAMES.length)];

  let effect: { type: EffectType; value: number } | undefined;
  let setName: string | undefined;

  if (rarity !== 'Common' && rarity !== 'Divine') {
    const effectTypes: EffectType[] = ['lifesteal', 'crit', 'dodge', 'poison', 'burn', 'stun', 'freeze', 'luck', 'statusChance'];
    const selectedType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
    
    // Luck Cap Logic: max 5 at start, increasing up to 20 based on stage
    const maxLuckForStage = Math.min(20, 5 + Math.floor(stage / 2));
    
    effect = {
      type: selectedType,
      value: selectedType === 'luck'
        ? Math.min(maxLuckForStage, Math.floor(Math.random() * 5) + Math.floor(rarityMultiplier / 2))
        : selectedType === 'statusChance'
          ? Math.floor(Math.random() * 5) + rarityMultiplier
          : Math.floor(Math.random() * 10) + (rarityMultiplier * 2)
    };

    // Mythic items always have a set effect. Other non-common, non-divine items have a 50% chance.
    if (rarity === 'Mythic' || Math.random() > 0.5) {
      setName = SET_NAMES[Math.floor(Math.random() * SET_NAMES.length)];
    }
  }

  // Generate Stats (Uncommon+)
  let itemStats: any = undefined;
  if (rarity !== 'Common') {
    itemStats = { str: 0, agi: 0, vit: 0, int: 0, luk: 0 };
    const statPool: (keyof PlayerStats)[] = ['str', 'agi', 'vit', 'int', 'luk'];
    
    // Calculate total point pool based on stage and rarity
    const basePool = 5 + (stage * 3);
    const totalPool = Math.floor(basePool * rarityMultiplier);
    let remainingPoints = totalPool;

    // 1. Handle Luck Cap (most restrictive)
    const maxLuckForStage = Math.min(20, 5 + Math.floor(stage / 2));
    const luckRoll = Math.random();
    // Only give luck if rarity is Rare+ or by small chance
    if (rarityMultiplier >= 2 || luckRoll > 0.7) {
        const luckPoints = Math.min(remainingPoints, Math.floor(Math.random() * maxLuckForStage));
        itemStats.luk = luckPoints;
        remainingPoints -= luckPoints;
    }

    // 2. Distribute remaining points randomly among the other 4 stats
    // We allow stats to be 0 by randomly picking how many stats to distribute to
    const otherStats = ['str', 'agi', 'vit', 'int'] as (keyof PlayerStats)[];
    
    // Randomly shuffle the stats to ensure varied distribution
    const shuffled = [...otherStats].sort(() => Math.random() - 0.5);
    
    // Distribute points in chunks to make it more "swingy" (some high, some low)
    while (remainingPoints > 0) {
        const stat = shuffled[Math.floor(Math.random() * shuffled.length)];
        const chunk = Math.min(remainingPoints, Math.ceil(Math.random() * (totalPool / 2)));
        itemStats[stat] = (itemStats[stat] || 0) + chunk;
        remainingPoints -= chunk;
    }

    // Remove 0 stats to keep item tooltip clean if needed (optional, keeping for now)
    Object.keys(itemStats).forEach(k => {
        if (itemStats[k] === 0) delete itemStats[k];
    });
  }

  let finalName = `${adj} ${noun}`;
  if (setName) finalName = `${setName}'s ${finalName}`;
  else if (rarity === 'Mythic' || rarity === 'Divine') finalName = `${finalName} of the Ancients`;

  return {
    id: generateId(),
    name: finalName,
    category: 'Equippable',
    type,
    rarity,
    value,
    sellPrice: value * 10,
    effect,
    stats: itemStats,
    setName
  };
};

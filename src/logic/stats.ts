import { Player, Item, PlayerStats } from '../types';
import { CLASS_MODIFIERS, SET_BONUSES_DATA } from '../constants';

export const getEquipmentStatBonus = (player: Player, stat: keyof PlayerStats) => {
    let total = 0;
    Object.values(player.equipment).forEach(item => {
        const i = item as Item | null;
        if (i?.stats && i.stats[stat]) {
            // Apply upgrade scaling: +20% per level
            const multiplier = 1 + (i.upgradeLevel || 0) * 0.2;
            total += Math.floor(i.stats[stat]! * multiplier);
        }
    });
    return total;
};

export const getEquipmentValue = (item: Item | null) => {
    if (!item) return 0;
    return Math.floor(item.value * (1 + (item.upgradeLevel || 0) * 0.2));
};

export const getSetBonus = (player: Player) => {
    const eq = player.equipment;
    const sets = [eq.weapon?.setName, eq.armor?.setName, eq.accessory?.setName].filter(Boolean);
    const counts = sets.reduce((acc, name) => {
        acc[name!] = (acc[name!] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
        .filter(([_, count]) => (count as number) >= 2)
        .map(([name]) => name);
};

export const getEffectTotal = (player: Player, type: 'lifesteal' | 'crit' | 'dodge' | 'luck' | 'statusChance' | 'reduction') => {
    let total = 0;
    Object.values(player.equipment).forEach(item => {
        const i = item as Item | null;
        if (i?.effect?.type === type) total += i.effect.value;
    });
    return total;
};

export const calculateStats = (player: Player) => {
    // 1. Pre-calculate equipment values
    const weaponVal = getEquipmentValue(player.equipment.weapon);
    const armorVal = getEquipmentValue(player.equipment.armor);
    const accessoryVal = getEquipmentValue(player.equipment.accessory);

    const activeSets = getSetBonus(player);
    const hasSet = (name: string) => activeSets.includes(name);

    // 2. Identify all modifiers
    const clsMod = CLASS_MODIFIERS[player.playerClass] || {};
    const setMods = activeSets.map(setName => SET_BONUSES_DATA[setName]).filter(Boolean);

    const getMod = (key: keyof typeof clsMod) => {
        let val = (clsMod[key] || 0);
        setMods.forEach(m => { val += (m[key] || 0); });
        return val;
    };

    // Stat multipliers (1.0 base + sum of bonuses)
    const strMult = 1 + (clsMod.str ? clsMod.str - 1 : 0) + setMods.reduce((acc, m) => acc + (m.str || 0), 0);
    const agiMult = 1 + (clsMod.agi ? clsMod.agi - 1 : 0) + setMods.reduce((acc, m) => acc + (m.agi || 0), 0);
    const vitMult = 1 + (clsMod.vit ? clsMod.vit - 1 : 0) + setMods.reduce((acc, m) => acc + (m.vit || 0), 0);
    const intMult = 1 + (clsMod.int ? clsMod.int - 1 : 0) + setMods.reduce((acc, m) => acc + (m.int || 0), 0);
    const lukMult = 1 + (clsMod.luk ? clsMod.luk - 1 : 0) + setMods.reduce((acc, m) => acc + (m.luk || 0), 0);

    // 3. Calculate Base + Equipment Attributes
    const totalStr = Math.floor((player.stats.str + getEquipmentStatBonus(player, 'str')) * strMult);
    const totalAgi = Math.floor((player.stats.agi + getEquipmentStatBonus(player, 'agi')) * agiMult);
    const totalVit = Math.floor((player.stats.vit + getEquipmentStatBonus(player, 'vit')) * vitMult);
    const totalInt = Math.floor((player.stats.int + getEquipmentStatBonus(player, 'int')) * intMult);
    const totalLuk = Math.floor((player.stats.luk + getEquipmentStatBonus(player, 'luk')) * lukMult);

    // Derived milestones
    const strMilestones = Math.floor(totalStr / 10);
    const agiMilestones = Math.floor(totalAgi / 10);
    const vitMilestones = Math.floor(totalVit / 10);
    const intMilestones = Math.floor(totalInt / 10);
    const lukMilestones = Math.floor(totalLuk / 10);

    // 4. Final Derived Stats
    const bonusAtkPct = strMilestones * 0.05 + (clsMod.atk || 0);
    const bonusDefPct = vitMilestones * 0.05 + (clsMod.def || 0);
    const bonusHpPct = vitMilestones * 0.05 + (clsMod.hp || 0);
    const bonusManaRegen = intMilestones * 2 + (player.playerClass === 'Mage' ? 5 : player.playerClass === 'Archmage' ? 15 : 0);
    const bonusMagicDmgPct = intMilestones * 0.05 + (clsMod.magicAtk || 0);

    const bonusCritChance = agiMilestones * 2 + (clsMod.crit || 0);
    const bonusDodgeChance = agiMilestones * 2 + (clsMod.dodge || 0);
    const bonusCritDmg = 1.5 + (strMilestones * 0.10) + (clsMod.critDmg || 0);

    const skillHaste = Math.min(60, Math.floor(totalAgi / 5) + Math.floor(totalInt / 10) + getMod('skillHaste'));
    
    const setBonusAtkPct = setMods.reduce((acc, m) => acc + (m.atk || 0), 0);
    const setBonusDefPct = setMods.reduce((acc, m) => acc + (m.def || 0), 0);
    const setBonusMagicPct = setMods.reduce((acc, m) => acc + (m.magicAtk || 0), 0);
    const setBonusHpPct = setMods.reduce((acc, m) => acc + (m.hp || 0), 0);
    const setBonusMpPct = setMods.reduce((acc, m) => acc + (m.mp || 0), 0);
    const setReflection = getMod('reflection');

    const setBonusGoldPct = getMod('gold') + (player.rebornUpgrades?.goldBonus || 0) / 100;
    const setBonusExpPct = getMod('exp') + (player.rebornUpgrades?.expBonus || 0) / 100;
    const setBonusDodge = setMods.reduce((acc, m) => acc + (m.dodge || 0), 0);
    const setBonusCrit = setMods.reduce((acc, m) => acc + (m.crit || 0), 0);
    const setBonusLifesteal = getMod('lifesteal');

    const rebornHpBonus = (player.rebornUpgrades?.hpBonus || 0) / 100;
    const rebornAtkBonus = (player.rebornUpgrades?.atkBonus || 0) / 100;

    const maxHp = Math.floor((player.maxHp + (totalVit * 40) + (armorVal * 10)) * (1 + bonusHpPct + setBonusHpPct + rebornHpBonus));
    
    const classBonusMp = (player.playerClass === 'Mage' ? 200 : player.playerClass === 'Archmage' ? 500 : player.playerClass === 'Necromancer' ? 300 : player.playerClass === 'Paladin' ? 150 : 0);
    const maxMp = Math.floor((player.maxMp + (totalInt * 12) + classBonusMp) * (1 + setBonusMpPct));

    const potionExpBonus = player.potions?.filter(p => p.type === 'exp').reduce((acc, p) => acc + p.value, 0) || 0;
    const potionGoldBonus = player.potions?.filter(p => p.type === 'coin').reduce((acc, p) => acc + p.value, 0) || 0;
    const potionLuckBonus = player.potions?.filter(p => p.type === 'luck').reduce((acc, p) => acc + p.value, 0) || 0;

    const totalAttack = Math.floor((player.baseAttack + (totalStr * 2) + weaponVal) * (1 + bonusAtkPct + setBonusAtkPct + rebornAtkBonus));
    const totalDefense = Math.floor((player.baseDefense + (totalVit * 1.2) + armorVal) * (1 + bonusDefPct + setBonusDefPct));
    const totalMagicAttack = Math.floor((totalInt * 3 + weaponVal) * (1 + bonusMagicDmgPct + setBonusMagicPct));
    
    const baseLuck = totalLuk + getEffectTotal(player, 'luck');
    const totalLuck = Math.floor(baseLuck * (1 + potionLuckBonus / 100));
    
    const totalStatusChance = 2 + Math.floor(totalInt / 5) + getEffectTotal(player, 'statusChance');

    let critChance = getEffectTotal(player, 'crit') + bonusCritChance + setBonusCrit;
    let finalCritDmg = bonusCritDmg + getMod('critDmg'); 
    // Duelist set has it in setMods which is handled by getMod('critDmg') now.
    // Wait, the previous logic was + (hasSet('Duelist') ? 0.4 : 0). 
    // My getMod handles it correctly.

    if (critChance > 100) {
        finalCritDmg += (critChance - 100) / 100;
        critChance = 100;
    }
    const dodgeChance = Math.min(75, getEffectTotal(player, 'dodge') + bonusDodgeChance + setBonusDodge);
    const reduction = Math.min(80, getEffectTotal(player, 'reduction'));
    const lifesteal = Math.min(100, getEffectTotal(player, 'lifesteal') + (clsMod.lifesteal || 0) + setBonusLifesteal);
    
    const pointBonusVal = player.rebornUpgrades?.pointBonus || 0;
    const nextRebornPoints = Math.floor((Math.floor(player.level / 10) + player.stage) * (1 + pointBonusVal / 100)) || 0;

    const milestoneBonuses = {
        str: strMilestones > 0 ? `+${strMilestones * 5}% ATK, +${strMilestones * 10}% Crit DMG` : null,
        agi: agiMilestones > 0 ? `+${agiMilestones * 2}% Crit Rate, +${agiMilestones * 2}% Dodge` : null,
        vit: vitMilestones > 0 ? `+${vitMilestones * 5}% HP/DEF` : null,
        int: intMilestones > 0 ? `+${intMilestones * 2} MP Regen, +${intMilestones * 5}% Magic DMG` : null,
        luk: lukMilestones > 0 ? `+${lukMilestones * 1}% Drop Rarity Chance` : null
    };

    return {
        totalStr, totalAgi, totalVit, totalInt, totalLuk,
        strMilestones, agiMilestones, vitMilestones, intMilestones, lukMilestones,
        milestoneBonuses,
        skillHaste,
        maxHp, maxMp, totalAttack, totalDefense, totalMagicAttack, totalLuck, totalStatusChance,
        critChance, finalCritDmg, dodgeChance, lifesteal,
        bonusManaRegen,
        setBonusGoldPct, setBonusExpPct,
        setReflection,
        potionExpBonus, potionGoldBonus, potionLuckBonus,
        nextRebornPoints,
        activeSets,
        hasSet
    };
};

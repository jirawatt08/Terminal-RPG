import { Player, Item, PlayerStats } from '../types';

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
    // 1. Calculate Base + Equipment
    let rawStr = player.stats.str + getEquipmentStatBonus(player, 'str');
    let rawAgi = player.stats.agi + getEquipmentStatBonus(player, 'agi');
    let rawVit = player.stats.vit + getEquipmentStatBonus(player, 'vit');
    let rawInt = player.stats.int + getEquipmentStatBonus(player, 'int');
    let rawLuk = player.stats.luk + getEquipmentStatBonus(player, 'luk');

    // 2. Apply Class Stat Bonuses
    const cls = player.playerClass;
    if (cls === 'Warrior') { rawVit *= 1.2; rawStr *= 1.1; }
    else if (cls === 'Rogue') { rawAgi *= 1.2; rawLuk *= 1.1; }
    else if (cls === 'Mage') { rawInt *= 1.2; rawVit *= 1.1; }
    else if (cls === 'Paladin') { rawVit *= 1.3; rawInt *= 1.2; }
    else if (cls === 'Berserker') { rawStr *= 1.3; rawAgi *= 1.2; }
    else if (cls === 'Assassin') { rawAgi *= 1.3; rawLuk *= 1.2; }
    else if (cls === 'Ranger') { rawAgi *= 1.2; rawStr *= 1.2; }
    else if (cls === 'Archmage') { rawInt *= 1.4; rawVit *= 1.2; }
    else if (cls === 'Necromancer') { rawInt *= 1.3; rawLuk *= 1.3; }

    const totalStr = Math.floor(rawStr);
    const totalAgi = Math.floor(rawAgi);
    const totalVit = Math.floor(rawVit);
    const totalInt = Math.floor(rawInt);
    const totalLuk = Math.floor(rawLuk);

    // Derived milestones
    const strMilestones = Math.floor(totalStr / 10);
    const agiMilestones = Math.floor(totalAgi / 10);
    const vitMilestones = Math.floor(totalVit / 10);
    const intMilestones = Math.floor(totalInt / 10);
    const lukMilestones = Math.floor(totalLuk / 10);

    const bonusAtkPct = strMilestones * 0.05 + (player.playerClass === 'Berserker' ? 0.3 : 0);
    const bonusCritDmg = 1.5 + (strMilestones * 0.10) + (player.playerClass === 'Rogue' ? 0.2 : player.playerClass === 'Assassin' ? 0.4 : 0);

    const bonusCritChance = agiMilestones * 2 + (player.playerClass === 'Rogue' ? 10 : player.playerClass === 'Assassin' ? 20 : player.playerClass === 'Ranger' ? 15 : 0);
    const bonusDodgeChance = agiMilestones * 2 + (player.playerClass === 'Ranger' ? 15 : 0);

    const bonusHpPct = vitMilestones * 0.05 + (player.playerClass === 'Warrior' ? 0.1 : player.playerClass === 'Paladin' ? 0.2 : 0);
    const bonusDefPct = vitMilestones * 0.05 + (player.playerClass === 'Warrior' ? 0.1 : player.playerClass === 'Paladin' ? 0.2 : 0);

    const bonusManaRegen = intMilestones * 2 + (player.playerClass === 'Mage' ? 5 : player.playerClass === 'Archmage' ? 15 : 0);
    const bonusMagicDmgPct = intMilestones * 0.05 + (player.playerClass === 'Mage' ? 0.2 : player.playerClass === 'Archmage' ? 0.4 : player.playerClass === 'Necromancer' ? 0.2 : player.playerClass === 'Paladin' ? 0.1 : 0);

    const skillHaste = Math.min(50, Math.floor(totalAgi / 5) + Math.floor(totalInt / 10));

    const activeSets = getSetBonus(player);
    const hasSet = (name: string) => activeSets.includes(name);

    const setBonusAtkPct = (hasSet('Berserker') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
    const setBonusDefPct = (hasSet('Iron') ? 0.2 : 0) + (hasSet('Guardian') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
    const setBonusMagicPct = (hasSet('Sage') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
    const setBonusHpPct = (hasSet('Guardian') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
    const setBonusMpPct = (hasSet('Sage') ? 0.2 : 0) + (hasSet('Celestial') ? 0.1 : 0);
    const setBonusGoldPct = (hasSet('Merchant') ? 0.5 : 0);
    const setBonusExpPct = (hasSet('Explorer') ? 0.5 : 0);
    const setBonusDodge = (hasSet('Phantom') ? 15 : 0) + (hasSet('Shadow') ? 10 : 0);
    const setBonusCrit = (hasSet('Assassin') ? 15 : 0) + (hasSet('Shadow') ? 10 : 0);
    const setBonusLifesteal = (hasSet('Vampire') ? 15 : 0);

    // Final Derived Stats
    const rebornHpBonus = (player.rebornUpgrades?.hpBonus || 0) / 100;
    const rebornAtkBonus = (player.rebornUpgrades?.atkBonus || 0) / 100;

    const maxHp = Math.floor((player.maxHp + (totalVit * 40) + (getEquipmentValue(player.equipment.armor) * 10)) * (1 + bonusHpPct + setBonusHpPct + rebornHpBonus));
    
    const classBonusMp = (player.playerClass === 'Mage' ? 200 : player.playerClass === 'Archmage' ? 500 : player.playerClass === 'Necromancer' ? 300 : player.playerClass === 'Paladin' ? 150 : 0);
    const maxMp = Math.floor((player.maxMp + (totalInt * 12) + classBonusMp) * (1 + setBonusMpPct));

    const potionExpBonus = player.potions?.filter(p => p.type === 'exp').reduce((acc, p) => acc + p.value, 0) || 0;
    const potionGoldBonus = player.potions?.filter(p => p.type === 'coin').reduce((acc, p) => acc + p.value, 0) || 0;
    const potionLuckBonus = player.potions?.filter(p => p.type === 'luck').reduce((acc, p) => acc + p.value, 0) || 0;

    const totalAttack = Math.floor((player.baseAttack + (totalStr * 2) + getEquipmentValue(player.equipment.weapon)) * (1 + bonusAtkPct + setBonusAtkPct + rebornAtkBonus));
    const totalDefense = Math.floor((player.baseDefense + (totalVit * 1.2) + getEquipmentValue(player.equipment.armor)) * (1 + bonusDefPct + setBonusDefPct));
    const totalMagicAttack = Math.floor((totalInt * 3 + getEquipmentValue(player.equipment.weapon)) * (1 + bonusMagicDmgPct + setBonusMagicPct));
    
    // Potion Luck is now a percentage boost
    const baseLuck = totalLuk + getEffectTotal(player, 'luck');
    const totalLuck = Math.floor(baseLuck * (1 + potionLuckBonus / 100));
    
    const totalStatusChance = 2 + Math.floor(totalInt / 5) + getEffectTotal(player, 'statusChance');

    let critChance = getEffectTotal(player, 'crit') + bonusCritChance + setBonusCrit;
    let finalCritDmg = bonusCritDmg;
    if (critChance > 100) {
        finalCritDmg += (critChance - 100) / 100;
        critChance = 100;
    }
    const dodgeChance = Math.min(75, getEffectTotal(player, 'dodge') + bonusDodgeChance + setBonusDodge);
    const reduction = Math.min(80, getEffectTotal(player, 'reduction'));
    const lifesteal = Math.min(100, getEffectTotal(player, 'lifesteal') + (player.playerClass === 'Berserker' ? 10 : player.playerClass === 'Necromancer' ? 15 : 0) + setBonusLifesteal);
    
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
        potionExpBonus, potionGoldBonus, potionLuckBonus,
        nextRebornPoints,
        activeSets,
        hasSet
    };
};

import React from 'react';
import { Player, Item } from '../types';

interface UseInventoryProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addLog: (msg: string, type?: any) => void;
    stats: any;
}

export function useInventory({ player, setPlayer, addLog, stats }: UseInventoryProps) {
    const equipItem = (item: Item) => {
        setPlayer(prev => {
            const newPlayer = {
                ...prev,
                inventory: [...prev.inventory],
                equipment: { ...prev.equipment }
            };
            const typeKey = item.type.toLowerCase() as keyof typeof newPlayer.equipment;
            const currentEquipped = newPlayer.equipment[typeKey];
            newPlayer.inventory = newPlayer.inventory.filter(i => i.id !== item.id);
            if (currentEquipped) newPlayer.inventory.push(currentEquipped);
            newPlayer.equipment[typeKey] = item;
            addLog(`Equipped ${item.name}.`, 'system');
            return newPlayer;
        });
    };

    const sellItem = (item: Item) => {
        if (item.locked) {
            addLog(`Cannot sell ${item.name}. Item is locked!`, 'warning');
            return;
        }
        setPlayer(prev => {
            const newPlayer = { ...prev, inventory: [...prev.inventory] };
            newPlayer.inventory = newPlayer.inventory.filter(i => i.id !== item.id);
            newPlayer.gold += item.sellPrice;
            addLog(`Sold ${item.name} for ${item.sellPrice} Gold.`, 'sell');
            return newPlayer;
        });
    };

    const toggleItemLock = (item: Item) => {
        setPlayer(prev => {
            const newPlayer = {
                ...prev,
                inventory: [...prev.inventory],
                equipment: { ...prev.equipment }
            };
            const invIdx = newPlayer.inventory.findIndex(i => i.id === item.id);
            if (invIdx !== -1) {
                newPlayer.inventory[invIdx] = { ...newPlayer.inventory[invIdx], locked: !newPlayer.inventory[invIdx].locked };
            } else {
                Object.keys(newPlayer.equipment).forEach(slot => {
                    const eqKey = slot as keyof typeof newPlayer.equipment;
                    const eqItem = newPlayer.equipment[eqKey];
                    if (eqItem?.id === item.id) {
                        newPlayer.equipment[eqKey] = { ...eqItem, locked: !eqItem.locked };
                    }
                });
            }
            return newPlayer;
        });
    };

    const upgradeItem = (item: Item, isEquipped: boolean) => {
        const currentLevel = item.upgradeLevel || 0;
        const cost = Math.floor(item.value * 0.5 * Math.pow(1.5, currentLevel));
        if (player.gold < cost) {
            addLog(`Not enough gold to upgrade ${item.name}. Need ${cost}G.`, 'error');
            return;
        }

        setPlayer(prev => {
            const newPlayer = {
                ...prev,
                inventory: [...prev.inventory],
                equipment: { ...prev.equipment }
            };
            newPlayer.gold -= cost;

            const upgradedItem = { ...item, upgradeLevel: currentLevel + 1 };

            if (isEquipped) {
                newPlayer.equipment[item.type.toLowerCase() as keyof typeof newPlayer.equipment] = upgradedItem;
            } else {
                const idx = newPlayer.inventory.findIndex(i => i.id === item.id);
                if (idx !== -1) newPlayer.inventory[idx] = upgradedItem;
            }
            return newPlayer;
        });
        addLog(`Upgraded ${item.name} to +${currentLevel + 1}!`, 'success');
    };

    const sellAllItems = () => {
        const unlockedItems = player.inventory.filter(i => !i.locked);
        if (unlockedItems.length === 0) {
            addLog('No unlocked items to sell.', 'warning');
            return;
        }

        const totalGold = unlockedItems.reduce((acc, item) => acc + item.sellPrice, 0);
        
        setPlayer(prev => ({
            ...prev,
            inventory: prev.inventory.filter(i => i.locked),
            gold: prev.gold + totalGold
        }));

        addLog(`Mass liquidation complete. Sold ${unlockedItems.length} items for ${totalGold} Gold.`, 'sell');
    };

    return {
        equipItem,
        sellItem,
        toggleItemLock,
        upgradeItem,
        sellAllItems
    };
}

export interface PatchNote {
  version: string;
  date: string;
  changes: string[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: 'v3.0',
    date: '2026-03-13',
    changes: [
      'Architectural Refactor: Migrated "brute-force" logic to data-driven Registry patterns for better maintainability.',
      'Stat System Overhaul: Consolidated class and set multipliers into a unified modifier system in logic/stats.',
      'Terminal Command Registry: Implemented a modular command mapping system, enabling easier addition of new gimmicks.',
      'Combat Logic Optimization: Unified passive ability processing and status effect handling for more consistent results.',
      'Added four new item sets: Reflex, Scholar, Warlord, and Duelist with unique mechanics like damage reflection.',
      'Performance: Reduced redundant calculations in the main combat loop and stat derivation.'
    ]
  },
  {
    version: 'v2.9',
    date: '2026-03-13',
    changes: [
      'Universal Set Synergy: All items from Uncommon to Mythic can now roll with Set Names (Divine remains unique).',
      'Four New Item Sets: Added Reflex (Reflection), Scholar (Skill Haste), Warlord (Stats), and Duelist (Crit Damage) sets.',
      'Rarity Stat Rebalance: Mythic items base stats adjusted (-10%) and Divine items rebalanced (-25%) for healthier late-game progression.',
      'Improved Item Generation: Mythic items now have a 100% chance to roll a Set Name.',
      'Inventory Optimization: Enhanced filtering and sorting responsiveness for large storage units.'
    ]
  },
  {
    version: 'v2.8',
    date: '2026-03-13',
    changes: [
      'Implemented Local Save for Guest Players: Progress is now automatically cached in localStorage every 30 seconds.',
      'Data Backup Suite: Added Export and Import functionality in Settings to manually back up or restore progress via .json files.',
      'Fixed Reborn System (RB Upgrade): Reborn Stat Points from upgrades are now correctly preserved and re-applied after a reset.',
      'Dashboard Enhancements: Added manual refresh button and auto-fetch triggers for the Global Leaderboard.',
      'Performance Optimization: Memoized core panels (Stats, Inventory, Console) and derived stat calculations for smoother high-level gameplay.',
      'Fixed various minor UI bugs and improved terminal input responsiveness.'
    ]
  },
  {
    version: 'v2.7',
    date: '2026-03-11',
    changes: [
      'Added Enemy Tactical HUD: Real-time display of enemy ATK, DEF, and Skill status.',
      'Implemented real-time Skill Cooldown tracking for enemies.',
      'Added passive ability icons and tooltips to the combat console.',
      'Improved combat visibility for complex encounters with multiple enemies.'
    ]
  },
  {
    version: 'v2.6',
    date: '2026-03-11',
    changes: [
      'Implemented non-linear exponential scaling for Bosses and Monsters to match late-game power.',
      'Rebalanced Skill Cooldowns: Powerful skills now have longer, more strategic durations.',
      'Enhanced Skill UI: Added multipliers, scaling stats, and status effect chance to buttons.',
      'Skill Status Effects: Tier 2 skills now have chances to apply Burn, Freeze, or Poison.',
      'Improved Combat HUD: Added a visual "Reload" progress bar to active skill cooldowns.',
      'Buffed Boss HP: High-stage bosses are significantly more resilient to one-shots.'
    ]
  },
  {
    version: 'v2.5',
    date: '2026-03-11',
    changes: [
      'Further rebalanced EXP: Halved base percentage gains for smoother progression.',
      'Detailed Set Bonuses: Stats panel now shows specific active bonus descriptions.',
      'Enhanced Skill UI: Added real-time cooldowns and attribute scaling info.',
      'Introduced Class Stat Multipliers for fixed attribute bonuses.',
      'Added Skill Haste (CDR) based on AGI and INT attributes.',
      'Expanded system documentation with a dedicated Set Item guide.'
    ]
  },
  {
    version: 'v2.4',
    date: '2026-03-11',
    changes: [
      'Rebalanced Quest EXP rewards (5% for monsters, 15% for bosses).',
      'Improved quest scaling logic to prevent excessive leveling.',
      'Added the ./patch command to quickly view update history.',
      'Improved Boss summoning behavior and minion balance.',
      'Enhanced Dashboard visibility for update history.'
    ]
  },
  {
    version: 'v2.3',
    date: '2026-03-11',
    changes: [
      'Implemented Skill Haste (CDR) stat based on AGI and INT.',
      'Added Level 30 Class Skills for all specializations.',
      'Refactored skill damage to scale with primary class attributes (STR/INT).',
      'Improved Mobile UI: Added Auto-Scroll toggle for combat logs.',
      'Fixed Equipment HUD: Equipped items now show full stat breakdowns.',
      'Balanced Mana: INT now provides 12 MP per point (down from 25) for strategic play.',
      'Added Boss Summoning: Advanced bosses can now summon minions.',
      'Dashboard Fix: Global records now correctly sort by highest stage/level.',
      'Item Stat Overhaul: Replaced flat scaling with a dynamic Stat Point Pool system.',
      'Implemented Stage-based caps for item attributes and Luck.',
      'Refactored Potion Logic: Luck potions now provide a percentage boost.'
    ]
  },
  {
    version: 'v2.2',
    date: '2026-03-10',
    changes: [
      'Modularized game logic into specialized hooks.',
      'Introduced GameContext for efficient state management.',
      'Added "Sell All Unlocked" feature to the Village Merchant.',
      'Restored classic "Terminal Green" aesthetic and SYS_STATUS naming.',
      'Fixed barMode behavior to hide UI elements when toggled.',
      'Added Magic ATK to the quick status summary.'
    ]
  },
  {
    version: 'v2.1',
    date: '2026-03-09',
    changes: [
      'Initial release of Terminal RPG v2.',
      'Added Reborn system and permanent upgrades.',
      'Implemented Village infrastructure: Blacksmith, Alchemist, and Quest Board.',
      'Cloud save synchronization with Firebase.'
    ]
  }
];

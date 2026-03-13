import { EnemySkill, EnemyPassive } from '../types';

export interface BossTemplate {
  name: string;
  skill: Omit<EnemySkill, 'currentCooldown'>;
  passive: EnemyPassive;
  hpMult: number;
  atkMult: number;
  defMult: number;
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    name: 'Dragon',
    skill: { name: 'Inferno Breath', type: 'magic', mult: 2.5, cooldown: 4, effect: { type: 'burn', duration: 3, value: 10 } },
    passive: { type: 'reflect', value: 8, description: 'Reflects 8% of damage taken.' },
    hpMult: 15.0, atkMult: 3.5, defMult: 2.5
  },
  {
    name: 'Lich',
    skill: { name: 'Death Coil', type: 'magic', mult: 2.0, cooldown: 3, effect: { type: 'freeze', duration: 2 } },
    passive: { type: 'summoner', value: 10, description: '10% chance to summon a minion each turn.' },
    hpMult: 8.0, atkMult: 2.5, defMult: 1.5
  },
  {
    name: 'Demon Lord',
    skill: { name: 'Abyssal Strike', type: 'magic', mult: 3.0, cooldown: 5, effect: { type: 'poison', duration: 4, value: 15 } },
    passive: { type: 'summoner', value: 15, description: '15% chance to summon a minion each turn.' },
    hpMult: 18.0, atkMult: 4.8, defMult: 3.0
  },
  {
    name: 'Giant Behemoth',
    skill: { name: 'Earthquake', type: 'physical', mult: 2.2, cooldown: 4, effect: { type: 'stun', duration: 2 } },
    passive: { type: 'shield', value: 30, description: 'Reduces incoming damage by 30%.' },
    hpMult: 12.0, atkMult: 2.5, defMult: 3.5
  },
  {
    name: 'Vampire King',
    skill: { name: 'Blood Siphon', type: 'physical', mult: 1.8, cooldown: 3 },
    passive: { type: 'lifesteal', value: 18, description: 'Heals for 18% of damage dealt.' },
    hpMult: 10.5, atkMult: 3.2, defMult: 2.0
  },
  {
    name: 'Fallen Angel',
    skill: { name: 'Divine Retribution', type: 'magic', mult: 2.8, cooldown: 5 },
    passive: { type: 'dodge', value: 15, description: '15% chance to dodge attacks.' },
    hpMult: 12.5, atkMult: 3.5, defMult: 2.2
  },
  {
    name: 'Titan',
    skill: { name: 'Mountain Crush', type: 'physical', mult: 3.5, cooldown: 6 },
    passive: { type: 'thorns', value: 12, description: 'Reflects 12% of damage back.' },
    hpMult: 35.0, atkMult: 1.5, defMult: 5.5
  }
];

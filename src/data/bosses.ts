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
    skill: { name: 'Inferno Breath', mult: 2.5, cooldown: 4, effect: { type: 'burn', duration: 3, value: 10 } },
    passive: { type: 'reflect', value: 15, description: 'Reflects 15% of damage taken.' },
    hpMult: 5.0, atkMult: 2.5, defMult: 1.5
  },
  {
    name: 'Lich',
    skill: { name: 'Death Coil', mult: 2.0, cooldown: 3, effect: { type: 'freeze', duration: 2 } },
    passive: { type: 'regen', value: 8, description: 'Regenerates 8% HP per turn.' },
    hpMult: 4.0, atkMult: 2.2, defMult: 1.2
  },
  {
    name: 'Demon Lord',
    skill: { name: 'Abyssal Strike', mult: 3.0, cooldown: 5, effect: { type: 'poison', duration: 4, value: 15 } },
    passive: { type: 'lifesteal', value: 25, description: 'Heals for 25% of damage dealt.' },
    hpMult: 6.0, atkMult: 3.0, defMult: 1.8
  },
  {
    name: 'Giant Behemoth',
    skill: { name: 'Earthquake', mult: 2.2, cooldown: 4, effect: { type: 'stun', duration: 2 } },
    passive: { type: 'shield', value: 30, description: 'Reduces incoming damage by 30%.' },
    hpMult: 8.0, atkMult: 2.0, defMult: 2.5
  },
  {
    name: 'Vampire King',
    skill: { name: 'Blood Siphon', mult: 1.8, cooldown: 3 },
    passive: { type: 'lifesteal', value: 40, description: 'Heals for 40% of damage dealt.' },
    hpMult: 4.5, atkMult: 2.8, defMult: 1.4
  },
  {
    name: 'Fallen Angel',
    skill: { name: 'Divine Retribution', mult: 2.8, cooldown: 5 },
    passive: { type: 'dodge', value: 25, description: '25% chance to dodge attacks.' },
    hpMult: 5.5, atkMult: 3.2, defMult: 1.6
  },
  {
    name: 'Titan',
    skill: { name: 'Mountain Crush', mult: 3.5, cooldown: 6 },
    passive: { type: 'thorns', value: 20, description: 'Reflects 20% of damage back.' },
    hpMult: 10.0, atkMult: 2.5, defMult: 3.0
  }
];

import { EnemySkill, EnemyPassive } from '../types';

export interface MonsterTemplate {
  name: string;
  skill?: Omit<EnemySkill, 'currentCooldown'>;
  passive?: EnemyPassive;
  hpMult: number;
  atkMult: number;
  defMult: number;
}

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    name: 'Slime',
    passive: { type: 'regen', value: 5, description: 'Regenerates 5% HP per turn.' },
    hpMult: 1.5, atkMult: 1.0, defMult: 0.5
  },
  {
    name: 'Goblin',
    skill: { name: 'Quick Stab', type: 'physical', mult: 1.2, cooldown: 2 },
    passive: { type: 'dodge', value: 10, description: '10% chance to dodge attacks.' },
    hpMult: 0.8, atkMult: 1.1, defMult: 0.7
  },
  {
    name: 'Skeleton',
    skill: { name: 'Bone Toss', type: 'physical', mult: 1.3, cooldown: 3 },
    passive: { type: 'thorns', value: 10, description: 'Reflects 10% of physical damage back.' },
    hpMult: 1.2, atkMult: 1.5, defMult: 1.0
  },
  {
    name: 'Wolf',
    skill: { name: 'Howl', type: 'physical', mult: 1.1, cooldown: 4 },
    passive: { type: 'berserk', value: 20, description: 'Increases attack by 20% when HP is low.' },
    hpMult: 1.0, atkMult: 1.3, defMult: 0.6
  },
  {
    name: 'Spider',
    skill: { name: 'Web Shot', type: 'physical', mult: 1.0, cooldown: 3, effect: { type: 'stun', duration: 1 } },
    hpMult: 0.7, atkMult: 1.0, defMult: 0.5
  },
  {
    name: 'Zombie',
    passive: { type: 'lifesteal', value: 15, description: 'Heals for 15% of damage dealt.' },
    hpMult: 1.5, atkMult: 0.9, defMult: 0.4
  },
  {
    name: 'Orc',
    skill: { name: 'Brutal Smash', type: 'physical', mult: 1.8, cooldown: 4 },
    hpMult: 1.3, atkMult: 1.4, defMult: 0.9
  },
  {
    name: 'Troll',
    passive: { type: 'regen', value: 10, description: 'Regenerates 10% HP per turn.' },
    hpMult: 2.0, atkMult: 1.2, defMult: 0.6
  },
  {
    name: 'Golem',
    passive: { type: 'shield', value: 20, description: 'Reduces incoming damage by 20%.' },
    hpMult: 1.8, atkMult: 1.0, defMult: 2.0
  },
  {
    name: 'Bat',
    passive: { type: 'dodge', value: 20, description: '20% chance to dodge attacks.' },
    hpMult: 0.5, atkMult: 0.8, defMult: 0.3
  }
];

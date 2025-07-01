export interface Character {
  id: string;
  shortId: string; // Short UUID for URL identification
  name: string;
  level: number;
  class: string;
  background: string;
  species: string;
  alignment: string;
  experiencePoints: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armorClass: number;
  initiative: number;
  speed: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  hitDice: string;
  hitDiceTotal: string;
  deathSaves: {
    successes: number;
    failures: number;
  };
  weapons: any[];
  skills: any[];
  proficiencies: {
    armor: string;
    weapons: string;
    tools: string;
    languages: string;
  };
  features: string;
  credits: number;
  forcePoints: number;
  techPoints: number;
  exhaustion: number;
  equipment: string;
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  notes: string;
  createdAt: string;
  lastModified: string;
  initiativeRoll?: {
    total: number;
    roll: number;
    modifier: number;
    timestamp: number;
  };
} 
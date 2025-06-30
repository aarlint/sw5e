import React, { useState, useEffect, useMemo } from 'react';
import './CharacterSheet.css';
import DiceRollPopup from './DiceRollPopup';
import PartyManager from './PartyManager';
import partyService from '../services/partyService';

interface CharacterData {
  id: string;
  name: string;
  level: number;
  class: string;
  background: string;
  species: string;
  alignment: string;
  experiencePoints: number;
  
  // Ability Scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Combat
  armorClass: number;
  initiative: number;
  speed: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  
  // Hit Dice
  hitDice: string;
  hitDiceTotal: string;
  
  // Death Saves
  deathSaves: {
    successes: number;
    failures: number;
  };
  
  // Weapons
  weapons: Weapon[];
  
  // Skills
  skills: Skill[];
  
  // Proficiencies
  proficiencies: {
    armor: string;
    weapons: string;
    tools: string;
    languages: string;
  };
  
  // Features & Traits
  features: string;
  
  // Resources
  credits: number;
  forcePoints: number;
  techPoints: number;
  
  // Exhaustion
  exhaustion: number;
  
  // Equipment
  equipment: string;
  
  // Personality
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  
  // Notes
  notes: string;
  
  // Metadata
  createdAt: string;
  lastModified: string;
  
  // Initiative roll (optional)
  initiativeRoll?: {
    total: number;
    roll: number;
    modifier: number;
    timestamp: number;
  };
}

interface Weapon {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range: string;
  properties: string;
}

interface Skill {
  name: string;
  ability: string;
  proficient: boolean;
  bonus: number;
}

const getHitDiceType = (className: string): string => {
  const classLower = className.toLowerCase();
  // Star Wars 5e hit dice by class
  if (classLower.includes('guardian') || classLower.includes('sentinel') || classLower.includes('consular')) {
    return 'd8'; // Force classes
  } else if (classLower.includes('fighter') || classLower.includes('scout') || classLower.includes('scoundrel')) {
    return 'd10'; // Combat classes
  } else if (classLower.includes('engineer') || classLower.includes('scholar')) {
    return 'd6'; // Support classes
  } else if (classLower.includes('berserker') || classLower.includes('monk')) {
    return 'd12'; // Specialized combat classes
  } else {
    return 'd8'; // Default for unknown classes
  }
};

const calculateHitDice = (level: number, className: string): string => {
  const hitDiceType = getHitDiceType(className);
  return `${level}${hitDiceType}`;
};

const calculateMaxHP = (level: number, className: string, constitution: number): number => {
  const hitDiceType = getHitDiceType(className);
  const conMod = Math.floor((constitution - 10) / 2);
  
  // Star Wars 5e HP calculation
  // Level 1: Maximum of hit die + constitution modifier
  let maxHP = 0;
  if (hitDiceType === 'd6') maxHP = 6;
  else if (hitDiceType === 'd8') maxHP = 8;
  else if (hitDiceType === 'd10') maxHP = 10;
  else if (hitDiceType === 'd12') maxHP = 12;
  
  maxHP += conMod;
  
  // Levels 2+: Roll or take average (we'll use average for consistency)
  for (let i = 2; i <= level; i++) {
    let averageHP = 0;
    if (hitDiceType === 'd6') averageHP = 4; // (1+6)/2 = 3.5, rounded up
    else if (hitDiceType === 'd8') averageHP = 5; // (1+8)/2 = 4.5, rounded up
    else if (hitDiceType === 'd10') averageHP = 6; // (1+10)/2 = 5.5, rounded up
    else if (hitDiceType === 'd12') averageHP = 7; // (1+12)/2 = 6.5, rounded up
    
    maxHP += averageHP + conMod;
  }
  
  return Math.max(1, maxHP); // Minimum 1 HP
};

const CharacterSheet: React.FC = () => {
  const [character, setCharacter] = useState<CharacterData>({
    id: '',
    name: '',
    level: 1,
    class: '',
    background: '',
    species: '',
    alignment: '',
    experiencePoints: 0,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    armorClass: 10,
    initiative: 0,
    speed: 30,
    hitPoints: {
      maximum: calculateMaxHP(1, '', 10),
      current: calculateMaxHP(1, '', 10),
      temporary: 0
    },
    hitDice: calculateHitDice(1, ''),
    hitDiceTotal: calculateHitDice(1, ''),
    deathSaves: {
      successes: 0,
      failures: 0
    },
    weapons: [],
    skills: [
      { name: 'Acrobatics', ability: 'dexterity', proficient: false, bonus: 0 },
      { name: 'Athletics', ability: 'strength', proficient: false, bonus: 0 },
      { name: 'Deception', ability: 'charisma', proficient: false, bonus: 0 },
      { name: 'Insight', ability: 'wisdom', proficient: false, bonus: 0 },
      { name: 'Intimidation', ability: 'charisma', proficient: false, bonus: 0 },
      { name: 'Investigation', ability: 'intelligence', proficient: false, bonus: 0 },
      { name: 'Perception', ability: 'wisdom', proficient: false, bonus: 0 },
      { name: 'Performance', ability: 'charisma', proficient: false, bonus: 0 },
      { name: 'Persuasion', ability: 'charisma', proficient: false, bonus: 0 },
      { name: 'Sleight of Hand', ability: 'dexterity', proficient: false, bonus: 0 },
      { name: 'Stealth', ability: 'dexterity', proficient: false, bonus: 0 },
      { name: 'Survival', ability: 'wisdom', proficient: false, bonus: 0 }
    ],
    proficiencies: {
      armor: '',
      weapons: '',
      tools: '',
      languages: ''
    },
    features: '',
    credits: 0,
    forcePoints: 0,
    techPoints: 0,
    exhaustion: 0,
    equipment: '',
    personality: {
      traits: '',
      ideals: '',
      bonds: '',
      flaws: ''
    },
    notes: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  });

  // Dice roll popup state
  const [dicePopup, setDicePopup] = useState({
    isOpen: false,
    title: '',
    diceNotation: '1d20',
    modifiers: 0,
    onRollComplete: (result: number) => {}
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    isVisible: false,
    text: '',
    x: 0,
    y: 0
  });

  // Hit dice spending interface state
  const [hitDiceSpending, setHitDiceSpending] = useState({
    isOpen: false,
    diceToSpend: 1,
    result: null as number | null
  });

  // Damage popup state
  const [damagePopup, setDamagePopup] = useState({
    isOpen: false,
    damageAmount: 0
  });

  // Quick number selector popup state
  const [numberSelector, setNumberSelector] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    onSelect: (value: number) => {},
    currentValue: 0
  });

  // Die selector popup state
  const [dieSelector, setDieSelector] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    onSelect: (dieType: string) => {},
    currentValue: 'd8'
  });

  // Generate unique ID for character if it doesn't have one
  useEffect(() => {
    if (!character.id) {
      const newId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setCharacter(prev => ({ ...prev, id: newId }));
    }
  }, [character.id]);

  // Load character data from localStorage on component mount
  useEffect(() => {
    const savedCharacter = localStorage.getItem('starWarsCharacter');
    if (savedCharacter) {
      const loadedCharacter = JSON.parse(savedCharacter);
      
      // Ensure all required fields exist with default values for backward compatibility
      const characterWithDefaults = {
        id: loadedCharacter.id || 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: loadedCharacter.name || '',
        level: loadedCharacter.level || 1,
        class: loadedCharacter.class || '',
        background: loadedCharacter.background || '',
        species: loadedCharacter.species || '',
        alignment: loadedCharacter.alignment || '',
        experiencePoints: loadedCharacter.experiencePoints || 0,
        strength: loadedCharacter.strength || 10,
        dexterity: loadedCharacter.dexterity || 10,
        constitution: loadedCharacter.constitution || 10,
        intelligence: loadedCharacter.intelligence || 10,
        wisdom: loadedCharacter.wisdom || 10,
        charisma: loadedCharacter.charisma || 10,
        armorClass: loadedCharacter.armorClass || 10,
        initiative: loadedCharacter.initiative || 0,
        speed: loadedCharacter.speed || 30,
        hitPoints: {
          maximum: loadedCharacter.hitPoints?.maximum || calculateMaxHP(loadedCharacter.level || 1, loadedCharacter.class || '', loadedCharacter.constitution || 10),
          current: loadedCharacter.hitPoints?.current || calculateMaxHP(loadedCharacter.level || 1, loadedCharacter.class || '', loadedCharacter.constitution || 10),
          temporary: loadedCharacter.hitPoints?.temporary || 0
        },
        hitDice: calculateHitDice(loadedCharacter.level || 1, loadedCharacter.class || ''),
        hitDiceTotal: calculateHitDice(loadedCharacter.level || 1, loadedCharacter.class || ''),
        deathSaves: {
          successes: loadedCharacter.deathSaves?.successes || 0,
          failures: loadedCharacter.deathSaves?.failures || 0
        },
        weapons: loadedCharacter.weapons || [],
        skills: loadedCharacter.skills || [
          { name: 'Acrobatics', ability: 'dexterity', proficient: false, bonus: 0 },
          { name: 'Athletics', ability: 'strength', proficient: false, bonus: 0 },
          { name: 'Deception', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Insight', ability: 'wisdom', proficient: false, bonus: 0 },
          { name: 'Intimidation', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Investigation', ability: 'intelligence', proficient: false, bonus: 0 },
          { name: 'Perception', ability: 'wisdom', proficient: false, bonus: 0 },
          { name: 'Performance', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Persuasion', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Sleight of Hand', ability: 'dexterity', proficient: false, bonus: 0 },
          { name: 'Stealth', ability: 'dexterity', proficient: false, bonus: 0 },
          { name: 'Survival', ability: 'wisdom', proficient: false, bonus: 0 }
        ],
        proficiencies: {
          armor: loadedCharacter.proficiencies?.armor || '',
          weapons: loadedCharacter.proficiencies?.weapons || '',
          tools: loadedCharacter.proficiencies?.tools || '',
          languages: loadedCharacter.proficiencies?.languages || ''
        },
        features: loadedCharacter.features || '',
        credits: loadedCharacter.credits || 0,
        forcePoints: loadedCharacter.forcePoints || 0,
        techPoints: loadedCharacter.techPoints || 0,
        exhaustion: loadedCharacter.exhaustion || 0,
        equipment: loadedCharacter.equipment || '',
        personality: {
          traits: loadedCharacter.personality?.traits || '',
          ideals: loadedCharacter.personality?.ideals || '',
          bonds: loadedCharacter.personality?.bonds || '',
          flaws: loadedCharacter.personality?.flaws || ''
        },
        notes: loadedCharacter.notes || '',
        createdAt: loadedCharacter.createdAt || new Date().toISOString(),
        lastModified: loadedCharacter.lastModified || new Date().toISOString()
      };
      
      setCharacter(characterWithDefaults);
    }
  }, []);

  // Save character data to localStorage and update characters list whenever it changes
  useEffect(() => {
    if (character.id) {
      localStorage.setItem('starWarsCharacter', JSON.stringify(character));
      
      // Update the character in the characters list
      const savedCharacters = localStorage.getItem('starWarsCharacters');
      if (savedCharacters) {
        const characters = JSON.parse(savedCharacters);
        const updatedCharacters = characters.map((char: CharacterData) => 
          char.id === character.id ? { ...character, lastModified: new Date().toISOString() } : char
        );
        localStorage.setItem('starWarsCharacters', JSON.stringify(updatedCharacters));
      }
    }
  }, [character]);

  // Debounced party updates to avoid too many rapid messages
  useEffect(() => {
    if (!character.id) return;

    const timeout = setTimeout(() => {
      // Send the complete character data to the party system
      partyService.updateCharacter(character).catch(error => {
        // Silently fail if partyService is not available (e.g., if not in a party)
        console.debug('Party service not available for character update:', error);
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeout);
  }, [character]); // Watch the entire character object for changes

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const rollDice = (diceNotation: string): number => {
    const match = diceNotation.match(/(\d+)d(\d+)/);
    if (!match) return 0;
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    let total = 0;
    
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    
    return total;
  };

  const rollSkillCheck = (skill: Skill) => {
    const abilityScore = character[skill.ability as keyof CharacterData] as number;
    const abilityMod = getAbilityModifier(abilityScore);
    // Star Wars 5e proficiency bonus: 2 at level 1, +1 every 4 levels
    const proficiencyBonus = skill.proficient ? Math.floor((character.level - 1) / 4) + 2 : 0;
    const skillBonus = skill.bonus;
    
    const modifiers = abilityMod + proficiencyBonus + skillBonus;
    
    setDicePopup({
      isOpen: true,
      title: `${skill.name} Check`,
      diceNotation: '1d20',
      modifiers,
      onRollComplete: handleRollComplete
    });
  };

  const rollAttack = (weapon: Weapon) => {
    const modifiers = weapon.attackBonus;
    
    setDicePopup({
      isOpen: true,
      title: `${weapon.name} Attack`,
      diceNotation: '1d20',
      modifiers,
      onRollComplete: handleRollComplete
    });
  };

  const rollDamage = (weapon: Weapon) => {
    setDicePopup({
      isOpen: true,
      title: `${weapon.name} Damage`,
      diceNotation: weapon.damage,
      modifiers: 0,
      onRollComplete: handleRollComplete
    });
  };

  const handleRollComplete = (result: number) => {
    // The popup handles rolling automatically, so we don't need to do anything here
    // The result is already displayed in the popup
  };

  const closeDicePopup = () => {
    setDicePopup(prev => ({ ...prev, isOpen: false }));
  };

  const updateAbilityScore = (ability: keyof CharacterData, value: number) => {
    setCharacter(prev => ({ ...prev, [ability]: value }));
  };

  const updateCharacter = (updates: Partial<CharacterData>) => {
    setCharacter(prev => {
      const updated = { ...prev, ...updates };
      
      // If level or class changed, update hit dice
      if (updates.level !== undefined || updates.class !== undefined) {
        const newHitDice = calculateHitDice(updated.level, updated.class);
        updated.hitDice = newHitDice;
        updated.hitDiceTotal = newHitDice; // Reset to full when level/class changes
      }
      
      // If level, class, or constitution changed, recalculate max HP
      if (updates.level !== undefined || updates.class !== undefined || updates.constitution !== undefined) {
        const newMaxHP = calculateMaxHP(updated.level, updated.class, updated.constitution);
        updated.hitPoints = {
          ...updated.hitPoints,
          maximum: newMaxHP,
          current: Math.min(updated.hitPoints.current, newMaxHP) // Don't let current exceed new max
        };
      }
      
      return updated;
    });
  };

  const addWeapon = () => {
    const newWeapon: Weapon = {
      name: '',
      attackBonus: 0,
      damage: '1d4',
      damageType: 'kinetic',
      range: '5 ft',
      properties: ''
    };
    setCharacter(prev => ({ ...prev, weapons: [...prev.weapons, newWeapon] }));
  };

  const updateWeapon = (index: number, updates: Partial<Weapon>) => {
    setCharacter(prev => ({
      ...prev,
      weapons: prev.weapons.map((weapon, i) => 
        i === index ? { ...weapon, ...updates } : weapon
      )
    }));
  };

  const removeWeapon = (index: number) => {
    setCharacter(prev => ({
      ...prev,
      weapons: prev.weapons.filter((_, i) => i !== index)
    }));
  };

  const updateDeathSave = (type: 'successes' | 'failures', value: number) => {
    setCharacter(prev => ({
      ...prev,
      deathSaves: { ...prev.deathSaves, [type]: Math.max(0, Math.min(3, value)) }
    }));
  };

  const handleDeathSaveRollComplete = (result: number) => {
    let newSuccesses = character.deathSaves.successes;
    let newFailures = character.deathSaves.failures;
    
    if (result >= 10) {
      // Success
      if (result === 20) {
        // Critical success - 2 successes
        newSuccesses = Math.min(3, newSuccesses + 2);
      } else {
        // Normal success
        newSuccesses = Math.min(3, newSuccesses + 1);
      }
    } else {
      // Failure
      if (result === 1) {
        // Critical failure - 2 failures
        newFailures = Math.min(3, newFailures + 2);
      } else {
        // Normal failure
        newFailures = Math.min(3, newFailures + 1);
      }
    }
    
    setCharacter(prev => ({
      ...prev,
      deathSaves: { successes: newSuccesses, failures: newFailures }
    }));
  };

  const handleLongRest = () => {
    if (window.confirm('Take a long rest? This will reset death saves, restore hit points, restore half of used hit dice, reset tech and force points, and reduce exhaustion by 1.')) {
      setCharacter(prev => {
        // Calculate how many hit dice were used (difference between base and current)
        const baseHitDice = prev.hitDice;
        const currentHitDice = prev.hitDiceTotal;
        const baseCount = parseInt(baseHitDice.match(/^\d+/)?.[0] || '1');
        const currentCount = parseInt(currentHitDice.match(/^\d+/)?.[0] || '1');
        const usedDice = baseCount - currentCount;
        
        // Restore half of used hit dice (minimum 0, maximum to base amount)
        const restoredDice = Math.min(baseCount, currentCount + Math.floor(usedDice / 2));
        const newHitDiceTotal = `${restoredDice}${baseHitDice.substring(baseHitDice.indexOf('d'))}`;
        
        return {
          ...prev,
          deathSaves: { successes: 0, failures: 0 },
          hitPoints: { 
            ...prev.hitPoints, 
            current: prev.hitPoints.maximum 
          },
          hitDiceTotal: newHitDiceTotal,
          forcePoints: 0, // Reset force points (Star Wars 5e)
          techPoints: 0,  // Reset tech points (Star Wars 5e)
          exhaustion: Math.max(0, prev.exhaustion - 1) // Reduce exhaustion by 1, minimum 0
        };
      });
    }
  };

  const handleShortRest = () => {
    if (window.confirm('Take a short rest? This will allow you to spend hit dice to recover hit points.')) {
      setHitDiceSpending({
        isOpen: true,
        diceToSpend: 1,
        result: null
      });
    }
  };

  const handleSecondWind = () => {
    if (window.confirm('Use Second Wind? This will heal you for 1d10 + your level.')) {
      const healing = rollDice('1d10') + character.level;
      setCharacter(prev => ({
        ...prev,
        hitPoints: {
          ...prev.hitPoints,
          current: Math.min(prev.hitPoints.maximum, prev.hitPoints.current + healing)
        }
      }));
      alert(`Second Wind healed you for ${healing} hit points!`);
    }
  };

  const handleInitiative = () => {
    const dexMod = getAbilityModifier(character.dexterity);
    setDicePopup({
      isOpen: true,
      title: 'Initiative Roll',
      diceNotation: '1d20',
      modifiers: dexMod,
      onRollComplete: handleRollComplete
    });
  };

  const handleDeathSave = () => {
    setDicePopup({
      isOpen: true,
      title: 'Death Save',
      diceNotation: '1d20',
      modifiers: 0,
      onRollComplete: handleDeathSaveRollComplete
    });
  };

  const showTooltip = (text: string, event: React.MouseEvent) => {
    setTooltip({
      isVisible: true,
      text,
      x: event.clientX,
      y: event.clientY
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, isVisible: false }));
  };

  const rollHitDice = () => {
    const hitDiceNotation = character.hitDiceTotal;
    const healing = rollDice(hitDiceNotation);
    const conMod = getAbilityModifier(character.constitution);
    const totalHealing = healing + conMod;
    
    setHitDiceSpending(prev => ({
      ...prev,
      result: totalHealing
    }));
  };

  const applyHitDiceHealing = () => {
    if (hitDiceSpending.result !== null) {
      setCharacter(prev => ({
        ...prev,
        hitPoints: {
          ...prev.hitPoints,
          current: Math.min(prev.hitPoints.maximum, prev.hitPoints.current + hitDiceSpending.result!)
        },
        hitDiceTotal: prev.hitDiceTotal.replace(/^\d+/, (parseInt(prev.hitDiceTotal.match(/^\d+/)?.[0] || '1') - hitDiceSpending.diceToSpend).toString())
      }));
      
      setHitDiceSpending({
        isOpen: false,
        diceToSpend: 1,
        result: null
      });
    }
  };

  const closeHitDiceSpending = () => {
    setHitDiceSpending({
      isOpen: false,
      diceToSpend: 1,
      result: null
    });
  };

  const isFighterClass = () => {
    // Star Wars 5e classes that might have Second Wind or similar abilities
    const classLower = character.class.toLowerCase();
    return classLower.includes('fighter') || classLower.includes('guardian') || classLower.includes('scout');
  };

  const getHealthPercentage = () => {
    if (character.hitPoints.maximum === 0) return 0;
    return (character.hitPoints.current / character.hitPoints.maximum) * 100;
  };

  const getHealthBarColor = (percentage: number) => {
    if (percentage > 50) return '#4a7c4a'; // Green
    if (percentage > 25) return '#7c7c4a'; // Yellow
    return '#7c4a4a'; // Red
  };

  const handleTakeDamage = () => {
    setDamagePopup({
      isOpen: true,
      damageAmount: 0
    });
  };

  const applyDamage = () => {
    if (damagePopup.damageAmount > 0) {
      setCharacter(prev => ({
        ...prev,
        hitPoints: {
          ...prev.hitPoints,
          current: Math.max(0, prev.hitPoints.current - damagePopup.damageAmount)
        }
      }));
    }
    setDamagePopup({
      isOpen: false,
      damageAmount: 0
    });
  };

  const closeDamagePopup = () => {
    setDamagePopup({
      isOpen: false,
      damageAmount: 0
    });
  };

  const openNumberSelector = (event: React.MouseEvent, currentValue: number, onSelect: (value: number) => void) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setNumberSelector({
      isOpen: true,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      onSelect,
      currentValue
    });
  };

  const closeNumberSelector = () => {
    setNumberSelector(prev => ({ ...prev, isOpen: false }));
  };

  const handleNumberSelect = (value: number) => {
    numberSelector.onSelect(value);
    closeNumberSelector();
  };

  const openDieSelector = (event: React.MouseEvent, currentValue: string, onSelect: (dieType: string) => void) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDieSelector({
      isOpen: true,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      onSelect,
      currentValue
    });
  };

  const closeDieSelector = () => {
    setDieSelector(prev => ({ ...prev, isOpen: false }));
  };

  const handleDieSelect = (dieType: string) => {
    dieSelector.onSelect(dieType);
    closeDieSelector();
  };

  // Convert character to format expected by party service
  const getPartyCharacterData = useMemo(() => ({
    id: character.id,
    name: character.name,
    level: character.level,
    class: character.class,
    background: character.background,
    species: character.species,
    alignment: character.alignment,
    experiencePoints: character.experiencePoints,
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
    armorClass: character.armorClass,
    initiative: character.initiative,
    speed: character.speed,
    hitPoints: character.hitPoints,
    hitDice: character.hitDice,
    hitDiceTotal: character.hitDiceTotal,
    deathSaves: character.deathSaves,
    weapons: character.weapons,
    skills: character.skills,
    proficiencies: character.proficiencies,
    features: character.features,
    credits: character.credits,
    forcePoints: character.forcePoints,
    techPoints: character.techPoints,
    exhaustion: character.exhaustion,
    equipment: character.equipment,
    personality: character.personality,
    notes: character.notes,
    createdAt: character.createdAt,
    lastModified: character.lastModified,
    initiativeRoll: character.initiativeRoll
  }), [
    character.id, character.name, character.level, character.class, character.background,
    character.species, character.alignment, character.experiencePoints, character.strength,
    character.dexterity, character.constitution, character.intelligence, character.wisdom,
    character.charisma, character.armorClass, character.initiative, character.speed,
    character.hitPoints, character.hitDice, character.hitDiceTotal, character.deathSaves,
    character.weapons, character.skills, character.proficiencies, character.features,
    character.credits, character.forcePoints, character.techPoints, character.exhaustion,
    character.equipment, character.personality, character.notes, character.createdAt,
    character.lastModified, character.initiativeRoll
  ]);

  return (
    <div className="character-sheet">
      {/* Party Manager */}
      <PartyManager 
        currentCharacter={getPartyCharacterData}
        onCharacterUpdate={(updatedCharacter) => {
          // This callback can be used if we need to sync changes from party back to character
          // For now, the party system is read-only display of character data
        }}
      />

      <div className="sheet-container">
        {/* Header Section */}
        <section className="header-section">
          <div className="header-grid">
            <div className="header-field">
              <label>Character Name:</label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => updateCharacter({ name: e.target.value })}
                className="name-input"
              />
            </div>
            <div className="header-field">
              <label>Class:</label>
              <input
                type="text"
                value={character.class}
                onChange={(e) => updateCharacter({ class: e.target.value })}
              />
            </div>
            <div className="header-field">
              <label>Level:</label>
              <input
                type="number"
                value={character.level}
                onChange={(e) => updateCharacter({ level: parseInt(e.target.value) || 1 })}
                onClick={(e) => openNumberSelector(e, character.level, (value) => updateCharacter({ level: value }))}
              />
            </div>
            <div className="header-field">
              <label>Background:</label>
              <input
                type="text"
                value={character.background}
                onChange={(e) => updateCharacter({ background: e.target.value })}
              />
            </div>
            <div className="header-field">
              <label>Species:</label>
              <input
                type="text"
                value={character.species}
                onChange={(e) => updateCharacter({ species: e.target.value })}
              />
            </div>
            <div className="header-field">
              <label>Alignment:</label>
              <input
                type="text"
                value={character.alignment}
                onChange={(e) => updateCharacter({ alignment: e.target.value })}
              />
            </div>
            <div className="header-field">
              <label>Experience Points:</label>
              <input
                type="number"
                value={character.experiencePoints}
                onChange={(e) => updateCharacter({ experiencePoints: parseInt(e.target.value) || 0 })}
                onClick={(e) => openNumberSelector(e, character.experiencePoints, (value) => updateCharacter({ experiencePoints: value }))}
              />
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="main-content">
          {/* Ability Scores */}
          <section className="ability-scores">
            <h2>Ability Scores</h2>
            <div className="ability-grid">
              {[
                { name: 'Strength', key: 'strength' },
                { name: 'Dexterity', key: 'dexterity' },
                { name: 'Constitution', key: 'constitution' },
                { name: 'Intelligence', key: 'intelligence' },
                { name: 'Wisdom', key: 'wisdom' },
                { name: 'Charisma', key: 'charisma' }
              ].map(({ name, key }) => (
                <div key={key} className="ability-score">
                  <label>{name}</label>
                  <input
                    type="number"
                    value={character[key as keyof CharacterData] as number}
                    onChange={(e) => updateAbilityScore(key as keyof CharacterData, parseInt(e.target.value) || 10)}
                    onClick={(e) => openNumberSelector(e, character[key as keyof CharacterData] as number, (value) => updateAbilityScore(key as keyof CharacterData, value))}
                    className="ability-input"
                  />
                  <span className="modifier">
                    {getAbilityModifier(character[key as keyof CharacterData] as number) >= 0 ? '+' : ''}
                    {getAbilityModifier(character[key as keyof CharacterData] as number)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section className="skills">
            <h2>Skills</h2>
            <div className="skills-grid">
              {character.skills.map((skill, index) => (
                <div key={skill.name} className="skill-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={skill.proficient}
                      onChange={(e) => {
                        const updatedSkills = [...character.skills];
                        updatedSkills[index].proficient = e.target.checked;
                        updateCharacter({ skills: updatedSkills });
                      }}
                    />
                    {skill.name} ({skill.ability})
                  </label>
                  <input
                    type="number"
                    placeholder="Bonus"
                    value={skill.bonus}
                    onChange={(e) => {
                      const updatedSkills = [...character.skills];
                      updatedSkills[index].bonus = parseInt(e.target.value) || 0;
                      updateCharacter({ skills: updatedSkills });
                    }}
                    onClick={(e) => {
                      const updatedSkills = [...character.skills];
                      openNumberSelector(e, skill.bonus, (value) => {
                        updatedSkills[index].bonus = value;
                        updateCharacter({ skills: updatedSkills });
                      });
                    }}
                  />
                  <button 
                    onClick={() => rollSkillCheck(skill)}
                    className="roll-btn"
                    title={`Roll ${skill.name} check`}
                  >
                    🎲
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Combat */}
          <section className="combat">
            <h2>Combat</h2>
            <div className="combat-grid">
              <div className="combat-field">
                <label>Armor Class:</label>
                <input
                  type="number"
                  value={character.armorClass}
                  onChange={(e) => updateCharacter({ armorClass: parseInt(e.target.value) || 10 })}
                  onClick={(e) => openNumberSelector(e, character.armorClass, (value) => updateCharacter({ armorClass: value }))}
                />
              </div>
              <div className="combat-field">
                <label>Initiative:</label>
                <input
                  type="number"
                  value={character.initiative}
                  onChange={(e) => updateCharacter({ initiative: parseInt(e.target.value) || 0 })}
                  onClick={(e) => openNumberSelector(e, character.initiative, (value) => updateCharacter({ initiative: value }))}
                />
              </div>
              <div className="combat-field">
                <label>Speed:</label>
                <input
                  type="number"
                  value={character.speed}
                  onChange={(e) => updateCharacter({ speed: parseInt(e.target.value) || 30 })}
                  onClick={(e) => openNumberSelector(e, character.speed, (value) => updateCharacter({ speed: value }))}
                />
              </div>
              <div className="combat-field">
                <label>Hit Points:</label>
                <div className="hp-inputs">
                  <div className="hp-input-group">
                    <label>Max</label>
                    <input
                      type="number"
                      value={character.hitPoints.maximum}
                      onChange={(e) => updateCharacter({
                        hitPoints: { ...character.hitPoints, maximum: parseInt(e.target.value) || 0 }
                      })}
                      onClick={(e) => openNumberSelector(e, character.hitPoints.maximum, (value) => updateCharacter({
                        hitPoints: { ...character.hitPoints, maximum: value }
                      }))}
                    />
                  </div>
                  <div className="hp-input-group">
                    <label>Current</label>
                    <input
                      type="number"
                      value={character.hitPoints.current}
                      onChange={(e) => updateCharacter({
                        hitPoints: { ...character.hitPoints, current: parseInt(e.target.value) || 0 }
                      })}
                      onClick={(e) => openNumberSelector(e, character.hitPoints.current, (value) => updateCharacter({
                        hitPoints: { ...character.hitPoints, current: value }
                      }))}
                    />
                  </div>
                  <div className="hp-input-group">
                    <label>Temp</label>
                    <input
                      type="number"
                      value={character.hitPoints.temporary}
                      onChange={(e) => updateCharacter({
                        hitPoints: { ...character.hitPoints, temporary: parseInt(e.target.value) || 0 }
                      })}
                      onClick={(e) => openNumberSelector(e, character.hitPoints.temporary, (value) => updateCharacter({
                        hitPoints: { ...character.hitPoints, temporary: value }
                      }))}
                    />
                  </div>
                </div>
              </div>
              <div className="health-bar-container">
                <div className="health-bar">
                  <div 
                    className="health-bar-fill"
                    style={{
                      width: `${getHealthPercentage()}%`,
                      backgroundColor: getHealthBarColor(getHealthPercentage())
                    }}
                  ></div>
                </div>
                <span className="health-percentage">{Math.round(getHealthPercentage())}%</span>
              </div>
              <div className="combat-field">
                <label>Hit Dice:</label>
                <input
                  type="text"
                  value={character.hitDice}
                  onChange={(e) => updateCharacter({ hitDice: e.target.value })}
                  onClick={(e) => {
                    const currentDieType = character.hitDice.match(/d\d+/)?.[0] || 'd8';
                    openDieSelector(e, currentDieType, (dieType) => {
                      const level = character.hitDice.match(/^\d+/)?.[0] || '1';
                      updateCharacter({ hitDice: `${level}${dieType}` });
                    });
                  }}
                />
              </div>
              <div className="combat-field">
                <label>Hit Dice Total:</label>
                <input
                  type="text"
                  value={character.hitDiceTotal}
                  onChange={(e) => updateCharacter({ hitDiceTotal: e.target.value })}
                  onClick={(e) => {
                    const currentDieType = character.hitDiceTotal.match(/d\d+/)?.[0] || 'd8';
                    openDieSelector(e, currentDieType, (dieType) => {
                      const level = character.hitDiceTotal.match(/^\d+/)?.[0] || '1';
                      updateCharacter({ hitDiceTotal: `${level}${dieType}` });
                    });
                  }}
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="actions">
            <h2>Actions</h2>
            <div className="actions-grid">
              <div className="action-group">
                <h3>Rest</h3>
                <div className="action-buttons">
                  <button 
                    onClick={handleShortRest}
                    className="action-btn short-rest-btn"
                    onMouseEnter={(e) => showTooltip('Take a short rest (1 hour). Spend hit dice to recover hit points.', e)}
                    onMouseLeave={hideTooltip}
                  >
                    Short Rest
                  </button>
                  <button 
                    onClick={handleLongRest}
                    className="action-btn long-rest-btn"
                    onMouseEnter={(e) => showTooltip('Take a long rest (8 hours). Reset death saves, restore all hit points, restore half of used hit dice, reset tech and force points, and reduce exhaustion by 1.', e)}
                    onMouseLeave={hideTooltip}
                  >
                    Long Rest
                  </button>
                </div>
              </div>
              
              <div className="action-group">
                <h3>Combat</h3>
                <div className="action-buttons">
                  <button 
                    onClick={handleInitiative}
                    className="action-btn initiative-btn"
                    onMouseEnter={(e) => showTooltip('Roll initiative (1d20 + Dexterity modifier) to determine combat order.', e)}
                    onMouseLeave={hideTooltip}
                  >
                    Roll Initiative
                  </button>
                  <button 
                    onClick={handleTakeDamage}
                    className="action-btn damage-btn"
                    onMouseEnter={(e) => showTooltip('Take damage and reduce current hit points.', e)}
                    onMouseLeave={hideTooltip}
                  >
                    Take Damage
                  </button>
                  <button 
                    onClick={handleSecondWind}
                    className={`action-btn second-wind-btn ${!isFighterClass() ? 'disabled' : ''}`}
                    disabled={!isFighterClass()}
                    onMouseEnter={(e) => showTooltip(isFighterClass() ? 'Use Second Wind to heal 1d10 + your level hit points. (Combat class feature)' : 'Second Wind is only available to Fighter, Guardian, and Scout class characters.', e)}
                    onMouseLeave={hideTooltip}
                  >
                    Second Wind
                  </button>
                </div>
              </div>
              
              <div className="action-group">
                <h3>Survival</h3>
                <div className="action-buttons">
                  <button 
                    onClick={handleDeathSave}
                    className="action-btn death-save-btn"
                    onMouseEnter={(e) => showTooltip('Roll a death save (1d20). 10+ = success, 9 or lower = failure. Rolling 1 = 2 failures, rolling 20 = 2 successes.', e)}
                    onMouseLeave={hideTooltip}
                  >
                    Death Save
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Death Saves and Resources Combined */}
          <section className="death-resources">
            <div className="death-saves-section">
              <h3>Death Saves</h3>
              <div className="death-saves-grid">
                <div className="death-save-section">
                  <label>Successes:</label>
                  <div className="death-save-buttons">
                    {[1, 2, 3].map(num => (
                      <button
                        key={`success-${num}`}
                        className={`death-save-btn success ${character.deathSaves.successes >= num ? 'active' : ''}`}
                        onClick={() => updateDeathSave('successes', num)}
                      >
                        ✓
                      </button>
                    ))}
                  </div>
                </div>
                <div className="death-save-section">
                  <label>Failures:</label>
                  <div className="death-save-buttons">
                    {[1, 2, 3].map(num => (
                      <button
                        key={`failure-${num}`}
                        className={`death-save-btn failure ${character.deathSaves.failures >= num ? 'active' : ''}`}
                        onClick={() => updateDeathSave('failures', num)}
                      >
                        ✗
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="resources-section">
              <h3>Resources</h3>
              <div className="resources-grid">
                <div className="resource-field">
                  <label>Credits:</label>
                  <input
                    type="number"
                    value={character.credits}
                    onChange={(e) => updateCharacter({ credits: parseInt(e.target.value) || 0 })}
                    onClick={(e) => openNumberSelector(e, character.credits, (value) => updateCharacter({ credits: value }))}
                  />
                </div>
                <div className="resource-field">
                  <label>Force Points:</label>
                  <input
                    type="number"
                    value={character.forcePoints}
                    onChange={(e) => updateCharacter({ forcePoints: parseInt(e.target.value) || 0 })}
                    onClick={(e) => openNumberSelector(e, character.forcePoints, (value) => updateCharacter({ forcePoints: value }))}
                  />
                </div>
                <div className="resource-field">
                  <label>Tech Points:</label>
                  <input
                    type="number"
                    value={character.techPoints}
                    onChange={(e) => updateCharacter({ techPoints: parseInt(e.target.value) || 0 })}
                    onClick={(e) => openNumberSelector(e, character.techPoints, (value) => updateCharacter({ techPoints: value }))}
                  />
                </div>
                <div className="resource-field">
                  <label>Exhaustion:</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={character.exhaustion}
                    onChange={(e) => updateCharacter({ exhaustion: Math.max(0, Math.min(6, parseInt(e.target.value) || 0)) })}
                    onClick={(e) => openNumberSelector(e, character.exhaustion, (value) => updateCharacter({ exhaustion: Math.max(0, Math.min(6, value)) }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Proficiencies */}
          <section className="proficiencies">
            <h2>Proficiencies</h2>
            <div className="proficiency-grid">
              <div className="proficiency-field">
                <label>Armor:</label>
                <textarea
                  value={character.proficiencies.armor}
                  onChange={(e) => updateCharacter({
                    proficiencies: { ...character.proficiencies, armor: e.target.value }
                  })}
                />
              </div>
              <div className="proficiency-field">
                <label>Weapons:</label>
                <textarea
                  value={character.proficiencies.weapons}
                  onChange={(e) => updateCharacter({
                    proficiencies: { ...character.proficiencies, weapons: e.target.value }
                  })}
                />
              </div>
              <div className="proficiency-field">
                <label>Tools:</label>
                <textarea
                  value={character.proficiencies.tools}
                  onChange={(e) => updateCharacter({
                    proficiencies: { ...character.proficiencies, tools: e.target.value }
                  })}
                />
              </div>
              <div className="proficiency-field">
                <label>Languages:</label>
                <textarea
                  value={character.proficiencies.languages}
                  onChange={(e) => updateCharacter({
                    proficiencies: { ...character.proficiencies, languages: e.target.value }
                  })}
                />
              </div>
            </div>
          </section>

          {/* Weapons */}
          <section className="weapons">
            <h2>Weapons</h2>
            <button onClick={addWeapon} className="add-weapon-btn">Add Weapon</button>
            <div className="weapons-list">
              {character.weapons.map((weapon, index) => (
                <div key={index} className="weapon-item">
                  <div className="weapon-header">
                    <input
                      type="text"
                      placeholder="Weapon Name"
                      value={weapon.name}
                      onChange={(e) => updateWeapon(index, { name: e.target.value })}
                    />
                    <button onClick={() => removeWeapon(index)} className="remove-btn">×</button>
                  </div>
                  <div className="weapon-stats">
                    <input
                      type="number"
                      placeholder="Attack Bonus"
                      value={weapon.attackBonus}
                      onChange={(e) => updateWeapon(index, { attackBonus: parseInt(e.target.value) || 0 })}
                      onClick={(e) => openNumberSelector(e, weapon.attackBonus, (value) => updateWeapon(index, { attackBonus: value }))}
                    />
                    <input
                      type="text"
                      placeholder="Damage (e.g., 1d8)"
                      value={weapon.damage}
                      onChange={(e) => updateWeapon(index, { damage: e.target.value })}
                      onClick={(e) => {
                        const currentDieType = weapon.damage.match(/d\d+/)?.[0] || 'd4';
                        openDieSelector(e, currentDieType, (dieType) => {
                          const count = weapon.damage.match(/^\d+/)?.[0] || '1';
                          updateWeapon(index, { damage: `${count}${dieType}` });
                        });
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Damage Type"
                      value={weapon.damageType}
                      onChange={(e) => updateWeapon(index, { damageType: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Range"
                      value={weapon.range}
                      onChange={(e) => updateWeapon(index, { range: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Properties"
                      value={weapon.properties}
                      onChange={(e) => updateWeapon(index, { properties: e.target.value })}
                    />
                  </div>
                  <div className="weapon-actions">
                    <button 
                      onClick={() => rollAttack(weapon)}
                      className="roll-btn"
                      title={`Roll ${weapon.name} attack`}
                    >
                      🎲
                    </button>
                    <button 
                      onClick={() => rollDamage(weapon)}
                      className="roll-btn"
                      title={`Roll ${weapon.name} damage`}
                    >
                      ⚔️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom Sections */}
        <div className="bottom-sections">
          {/* Features & Traits */}
          <section className="features">
            <h2>Features & Traits</h2>
            <textarea
              value={character.features}
              onChange={(e) => updateCharacter({ features: e.target.value })}
              placeholder="Enter your character's features and traits..."
            />
          </section>

          {/* Equipment */}
          <section className="equipment">
            <h2>Equipment</h2>
            <textarea
              value={character.equipment}
              onChange={(e) => updateCharacter({ equipment: e.target.value })}
              placeholder="Enter your character's equipment..."
            />
          </section>

          {/* Personality */}
          <section className="personality">
            <h2>Personality</h2>
            <div className="personality-grid">
              <div className="personality-field">
                <label>Traits:</label>
                <textarea
                  value={character.personality.traits}
                  onChange={(e) => updateCharacter({
                    personality: { ...character.personality, traits: e.target.value }
                  })}
                />
              </div>
              <div className="personality-field">
                <label>Ideals:</label>
                <textarea
                  value={character.personality.ideals}
                  onChange={(e) => updateCharacter({
                    personality: { ...character.personality, ideals: e.target.value }
                  })}
                />
              </div>
              <div className="personality-field">
                <label>Bonds:</label>
                <textarea
                  value={character.personality.bonds}
                  onChange={(e) => updateCharacter({
                    personality: { ...character.personality, bonds: e.target.value }
                  })}
                />
              </div>
              <div className="personality-field">
                <label>Flaws:</label>
                <textarea
                  value={character.personality.flaws}
                  onChange={(e) => updateCharacter({
                    personality: { ...character.personality, flaws: e.target.value }
                  })}
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="notes">
            <h2>Notes</h2>
            <textarea
              value={character.notes}
              onChange={(e) => updateCharacter({ notes: e.target.value })}
              placeholder="Additional notes about your character..."
            />
          </section>
        </div>
      </div>
      
      {/* Dice Roll Popup */}
      <DiceRollPopup
        isOpen={dicePopup.isOpen}
        onClose={closeDicePopup}
        title={dicePopup.title}
        diceNotation={dicePopup.diceNotation}
        modifiers={dicePopup.modifiers}
        onRollComplete={dicePopup.onRollComplete}
      />
      
      {/* Tooltip */}
      {tooltip.isVisible && (
        <div 
          className="tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40
          }}
        >
          {tooltip.text}
        </div>
      )}
      
      {/* Hit Dice Spending Interface */}
      {hitDiceSpending.isOpen && (
        <div className="hit-dice-overlay" onClick={closeHitDiceSpending}>
          <div className="hit-dice-popup" onClick={(e) => e.stopPropagation()}>
            <div className="hit-dice-header">
              <h3>Spend Hit Dice</h3>
              <button className="close-button" onClick={closeHitDiceSpending}>×</button>
            </div>
            
            <div className="hit-dice-content">
              <div className="hit-dice-info">
                <p>Available Hit Dice: <strong>{character.hitDiceTotal}</strong></p>
                <p>Current HP: <strong>{character.hitPoints.current}/{character.hitPoints.maximum}</strong></p>
                <p>Constitution Modifier: <strong>{getAbilityModifier(character.constitution) >= 0 ? '+' : ''}{getAbilityModifier(character.constitution)}</strong></p>
              </div>
              
              <div className="hit-dice-controls">
                <div className="dice-selector">
                  <label>Number of dice to spend:</label>
                  <input
                    type="number"
                    min="1"
                    max={parseInt(character.hitDiceTotal.match(/^\d+/)?.[0] || '1')}
                    value={hitDiceSpending.diceToSpend}
                    onChange={(e) => setHitDiceSpending(prev => ({
                      ...prev,
                      diceToSpend: Math.max(1, Math.min(parseInt(character.hitDiceTotal.match(/^\d+/)?.[0] || '1'), parseInt(e.target.value) || 1))
                    }))}
                  />
                </div>
                
                <div className="hit-dice-actions">
                  {hitDiceSpending.result === null ? (
                    <button 
                      onClick={rollHitDice}
                      className="roll-hit-dice-btn"
                    >
                      Roll Hit Dice
                    </button>
                  ) : (
                    <div className="healing-result">
                      <p>Healing: <strong>{hitDiceSpending.result} HP</strong></p>
                      <button 
                        onClick={applyHitDiceHealing}
                        className="apply-healing-btn"
                      >
                        Apply Healing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Damage Popup */}
      {damagePopup.isOpen && (
        <div className="damage-overlay" onClick={closeDamagePopup}>
          <div className="damage-popup" onClick={(e) => e.stopPropagation()}>
            <div className="damage-header">
              <h3>Take Damage</h3>
              <button className="close-button" onClick={closeDamagePopup}>×</button>
            </div>
            
            <div className="damage-content">
              <div className="damage-info">
                <p>Current HP: <strong>{character.hitPoints.current}/{character.hitPoints.maximum}</strong></p>
                <p>Health: <strong>{Math.round(getHealthPercentage())}%</strong></p>
              </div>
              
              <div className="damage-controls">
                <div className="damage-input">
                  <label>Damage Amount:</label>
                  <input
                    type="number"
                    min="0"
                    value={damagePopup.damageAmount}
                    onChange={(e) => setDamagePopup(prev => ({
                      ...prev,
                      damageAmount: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    placeholder="Enter damage amount"
                  />
                </div>
                
                <div className="damage-preview">
                  {damagePopup.damageAmount > 0 && (
                    <p>New HP after damage: <strong>{Math.max(0, character.hitPoints.current - damagePopup.damageAmount)}</strong></p>
                  )}
                </div>
                
                <div className="damage-actions">
                  <button 
                    onClick={applyDamage}
                    className="apply-damage-btn"
                    disabled={damagePopup.damageAmount <= 0}
                  >
                    Apply Damage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Number Selector Popup */}
      {numberSelector.isOpen && (
        <div className="number-selector-overlay" onClick={closeNumberSelector}>
          <div 
            className="number-selector-popup"
            style={{
              left: numberSelector.x,
              top: numberSelector.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="number-selector-grid">
              {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  className={`number-selector-btn ${num === numberSelector.currentValue ? 'current' : ''}`}
                  onClick={() => handleNumberSelect(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="number-selector-actions">
              <button 
                className="number-selector-clear"
                onClick={() => handleNumberSelect(0)}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Die Selector Popup */}
      {dieSelector.isOpen && (
        <div className="die-selector-overlay" onClick={closeDieSelector}>
          <div 
            className="die-selector-popup"
            style={{
              left: dieSelector.x,
              top: dieSelector.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="die-selector-grid">
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((dieType) => (
                <button
                  key={dieType}
                  className={`die-selector-btn ${dieType === dieSelector.currentValue ? 'current' : ''}`}
                  onClick={() => handleDieSelect(dieType)}
                >
                  {dieType}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSheet; 
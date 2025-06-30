import React, { useState, useEffect } from 'react';
import './CharacterSheet.css';
import DiceRollPopup from './DiceRollPopup';

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
      maximum: 0,
      current: 0,
      temporary: 0
    },
    hitDice: '1d8',
    hitDiceTotal: '1d8',
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
    modifiers: 0
  });

  // Load character data from localStorage on component mount
  useEffect(() => {
    const savedCharacter = localStorage.getItem('starWarsCharacter');
    if (savedCharacter) {
      const loadedCharacter = JSON.parse(savedCharacter);
      
      // Ensure all required fields exist with default values for backward compatibility
      const characterWithDefaults = {
        id: loadedCharacter.id || '',
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
          maximum: loadedCharacter.hitPoints?.maximum || 0,
          current: loadedCharacter.hitPoints?.current || 0,
          temporary: loadedCharacter.hitPoints?.temporary || 0
        },
        hitDice: loadedCharacter.hitDice || '1d8',
        hitDiceTotal: loadedCharacter.hitDiceTotal || '1d8',
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
    const proficiencyBonus = skill.proficient ? Math.floor((character.level - 1) / 4) + 2 : 0;
    const skillBonus = skill.bonus;
    
    const modifiers = abilityMod + proficiencyBonus + skillBonus;
    
    setDicePopup({
      isOpen: true,
      title: `${skill.name} Check`,
      diceNotation: '1d20',
      modifiers
    });
  };

  const rollAttack = (weapon: Weapon) => {
    const modifiers = weapon.attackBonus;
    
    setDicePopup({
      isOpen: true,
      title: `${weapon.name} Attack`,
      diceNotation: '1d20',
      modifiers
    });
  };

  const rollDamage = (weapon: Weapon) => {
    setDicePopup({
      isOpen: true,
      title: `${weapon.name} Damage`,
      diceNotation: weapon.damage,
      modifiers: 0
    });
  };

  const handleRollComplete = (result: number) => {
    // The popup will show the result and stay open for the user to see
    // User can manually close it when they're done
  };

  const closeDicePopup = () => {
    setDicePopup(prev => ({ ...prev, isOpen: false }));
  };

  const updateCharacter = (updates: Partial<CharacterData>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  };

  const updateAbilityScore = (ability: keyof CharacterData, value: number) => {
    setCharacter(prev => ({ ...prev, [ability]: value }));
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

  return (
    <div className="character-sheet">
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
              <label>Class & Level:</label>
              <input
                type="text"
                value={`${character.class} ${character.level}`}
                onChange={(e) => {
                  const parts = e.target.value.split(' ');
                  const level = parseInt(parts[parts.length - 1]) || 1;
                  const className = parts.slice(0, -1).join(' ');
                  updateCharacter({ class: className, level });
                }}
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
                  />
                  <button 
                    onClick={() => rollSkillCheck(skill)}
                    className="roll-btn"
                  >
                    Roll
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
                />
              </div>
              <div className="combat-field">
                <label>Initiative:</label>
                <input
                  type="number"
                  value={character.initiative}
                  onChange={(e) => updateCharacter({ initiative: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="combat-field">
                <label>Speed:</label>
                <input
                  type="number"
                  value={character.speed}
                  onChange={(e) => updateCharacter({ speed: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="combat-field">
                <label>Hit Points:</label>
                <div className="hp-inputs">
                  <input
                    type="number"
                    placeholder="Max"
                    value={character.hitPoints.maximum}
                    onChange={(e) => updateCharacter({
                      hitPoints: { ...character.hitPoints, maximum: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Current"
                    value={character.hitPoints.current}
                    onChange={(e) => updateCharacter({
                      hitPoints: { ...character.hitPoints, current: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Temp"
                    value={character.hitPoints.temporary}
                    onChange={(e) => updateCharacter({
                      hitPoints: { ...character.hitPoints, temporary: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
              <div className="combat-field">
                <label>Hit Dice:</label>
                <input
                  type="text"
                  value={character.hitDice}
                  onChange={(e) => updateCharacter({ hitDice: e.target.value })}
                />
              </div>
              <div className="combat-field">
                <label>Hit Dice Total:</label>
                <input
                  type="text"
                  value={character.hitDiceTotal}
                  onChange={(e) => updateCharacter({ hitDiceTotal: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Death Saves */}
          <section className="death-saves">
            <h2>Death Saves</h2>
            <div className="death-saves-grid">
              <div className="death-save-section">
                <label>Successes:</label>
                <div className="death-save-buttons">
                  {[1, 2, 3].map(num => (
                    <button
                      key={`success-${num}`}
                      className={`death-save-btn ${character.deathSaves.successes >= num ? 'active' : ''}`}
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
                      className={`death-save-btn ${character.deathSaves.failures >= num ? 'active' : ''}`}
                      onClick={() => updateDeathSave('failures', num)}
                    >
                      ✗
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Resources */}
          <section className="resources">
            <h2>Resources</h2>
            <div className="resources-grid">
              <div className="resource-field">
                <label>Credits:</label>
                <input
                  type="number"
                  value={character.credits}
                  onChange={(e) => updateCharacter({ credits: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="resource-field">
                <label>Force Points:</label>
                <input
                  type="number"
                  value={character.forcePoints}
                  onChange={(e) => updateCharacter({ forcePoints: parseInt(e.target.value) || 0 })}
                />
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
                    />
                    <input
                      type="text"
                      placeholder="Damage (e.g., 1d8)"
                      value={weapon.damage}
                      onChange={(e) => updateWeapon(index, { damage: e.target.value })}
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
                    >
                      Roll Attack
                    </button>
                    <button 
                      onClick={() => rollDamage(weapon)}
                      className="roll-btn"
                    >
                      Roll Damage
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
        onRollComplete={handleRollComplete}
      />
    </div>
  );
};

export default CharacterSheet; 
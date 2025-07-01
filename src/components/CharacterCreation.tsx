import React, { useState } from 'react';
import './CharacterCreation.css';

interface CharacterCreationProps {
  onCharacterCreated: (characterData: any) => void;
}

interface AbilityScore {
  name: string;
  value: number;
  rolled: boolean;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onCharacterCreated }) => {
  const [step, setStep] = useState(1);
  const [characterData, setCharacterData] = useState({
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
    techPoints: 0,
    exhaustion: 0,
    equipment: '',
    personality: {
      traits: '',
      ideals: '',
      bonds: '',
      flaws: ''
    },
    notes: ''
  });

  const [abilityScores, setAbilityScores] = useState<AbilityScore[]>([
    { name: 'Strength', value: 10, rolled: false },
    { name: 'Dexterity', value: 10, rolled: false },
    { name: 'Constitution', value: 10, rolled: false },
    { name: 'Intelligence', value: 10, rolled: false },
    { name: 'Wisdom', value: 10, rolled: false },
    { name: 'Charisma', value: 10, rolled: false }
  ]);

  const roll4d6DropLowest = (): number => {
    const rolls = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    rolls.sort((a, b) => b - a); // Sort descending
    return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
  };

  const rollAbilityScore = (index: number) => {
    const newValue = roll4d6DropLowest();
    setAbilityScores(prev => prev.map((score, i) => 
      i === index ? { ...score, value: newValue, rolled: true } : score
    ));
  };

  const rollAllAbilityScores = () => {
    setAbilityScores(prev => prev.map(score => ({
      ...score,
      value: roll4d6DropLowest(),
      rolled: true
    })));
  };

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const updateCharacterData = (updates: any) => {
    setCharacterData(prev => ({ ...prev, ...updates }));
  };

  const assignAbilityScores = () => {
    const rolledScores = abilityScores.filter(score => score.rolled).map(score => score.value);
    if (rolledScores.length !== 6) {
      alert('Please roll all 6 ability scores first!');
      return;
    }

    // Sort scores in descending order for assignment
    rolledScores.sort((a, b) => b - a);

    setCharacterData(prev => ({
      ...prev,
      strength: rolledScores[0] || 10,
      dexterity: rolledScores[1] || 10,
      constitution: rolledScores[2] || 10,
      intelligence: rolledScores[3] || 10,
      wisdom: rolledScores[4] || 10,
      charisma: rolledScores[5] || 10
    }));

    setStep(3);
  };

  const finishCharacterCreation = () => {
    // Calculate initial HP based on class and constitution
    const conMod = getAbilityModifier(characterData.constitution);
    const baseHP = 8 + conMod; // Assuming starting with 1d8 hit die
    
    const finalCharacterData = {
      ...characterData,
      hitPoints: {
        maximum: baseHP,
        current: baseHP,
        temporary: 0
      }
    };

    console.log('CharacterCreation: Sending character data:', finalCharacterData);
    onCharacterCreated(finalCharacterData);
  };

  const renderStep1 = () => (
    <div className="creation-step">
      <h2>Step 1: Basic Information</h2>
      <p className="step-description">
        Begin by providing the fundamental details about your character. This information will shape your character's identity and background.
      </p>
      <div className="basic-info-form">
        <div className="form-group">
          <label>Character Name:</label>
          <input
            type="text"
            value={characterData.name}
            onChange={(e) => updateCharacterData({ name: e.target.value })}
            placeholder="Enter your character's name"
          />
        </div>
        <div className="form-group">
          <label>Class:</label>
          <select
            value={characterData.class}
            onChange={(e) => updateCharacterData({ class: e.target.value })}
          >
            <option value="">Select a class</option>
            <option value="Beserker">Beserker</option>
            <option value="Consular">Consular</option>
            <option value="Engineer">Engineer</option>
            <option value="Fighter">Fighter</option>
            <option value="Gaurdian">Gaurdian</option>
            <option value="Monk">Monk</option>
            <option value="Operative">Operative</option>
            <option value="Sentinel">Sentinel</option>
            <option value="Scout">Scout</option>
          </select>
        </div>
        <div className="form-group">
          <label>Species:</label>
          <select
            value={characterData.species}
            onChange={(e) => updateCharacterData({ species: e.target.value })}
          >
            <option value="">Select a species</option>
            <option value="Human">Human</option>
            <option value="Wookiee">Wookiee</option>
            <option value="Twi'lek">Twi'lek</option>
            <option value="Togruta">Togruta</option>
            <option value="Zabrak">Zabrak</option>
            <option value="Mirialan">Mirialan</option>
            <option value="Kel Dor">Kel Dor</option>
            <option value="Droid">Droid</option>
            <option value="Gungan">Gungan</option>
            <option value="Jawa">Jawa</option>
            <option value="Mon Calamari">Mon Calamari</option>
            <option value="Rodian">Rodian</option>
            <option value="Sullustan">Sullustan</option>
            <option value="Togruta">Togruta</option>
            <option value="Zabrak">Zabrak</option>
            <option value="Zeb">Zeb</option>
          </select>
        </div>
        <div className="form-group">
          <label>Background:</label>
          <select
            value={characterData.background}
            onChange={(e) => updateCharacterData({ background: e.target.value })}
          >
            <option value="">Select a background</option>
            <option value="Dathomir Witch">Dathomir Witch</option>
            <option value="Outlaw">Outlaw</option>
            <option value="Gladiator">Gladiator</option>
            <option value="Companion">Companion</option>
            <option value="Entertainer">Entertainer</option>
            <option value="Nomad">Nomad</option>
            <option value="Folk Hero">Folk Hero</option>
            <option value="Barbarian">Barbarian</option>
            <option value="Laborer">Laborer</option>
            <option value="Hermit">Hermit</option>
            <option value="Farmer">Farmer</option>
            <option value="Racer">Racer</option>
            <option value="Pirate">Pirate</option>
            <option value="Bodyguard">Bodyguard</option>
            <option value="City Watch">City Watch</option>
            <option value="(Un)Retired Adventurer">(Un)Retired Adventurer</option>
            <option value="Faction Artisan">Faction Artisan</option>
            <option value="Imperial Knight">Imperial Knight</option>
            <option value="Soldier">Soldier</option>
            <option value="Mandalorian">Mandalorian</option>
            <option value="Faction Adventurer">Faction Adventurer</option>
            <option value="Mercenary">Mercenary</option>
            <option value="Clone">Clone</option>
            <option value="Clone Trooper">Clone Trooper</option>
            <option value="Independent Droid">Independent Droid</option>
            <option value="Sith">Sith</option>
            <option value="Crime Lord">Crime Lord</option>
            <option value="Gambler">Gambler</option>
            <option value="Amnesiac">Amnesiac</option>
            <option value="Noble">Noble</option>
            <option value="Force Adept">Force Adept</option>
            <option value="Faction Merchant">Faction Merchant</option>
            <option value="Scoundrel">Scoundrel</option>
            <option value="Courtier">Courtier</option>
            <option value="Bounty Hunter">Bounty Hunter</option>
            <option value="Urchin">Urchin</option>
            <option value="Ex-Cultist">Ex-Cultist</option>
            <option value="Politician">Politician</option>
            <option value="Criminal">Criminal</option>
            <option value="Agent">Agent</option>
            <option value="Addict">Addict</option>
            <option value="Smuggler">Smuggler</option>
            <option value="Jensaarai">Jensaarai</option>
            <option value="Bartender">Bartender</option>
            <option value="Office Worker">Office Worker</option>
            <option value="Jedi">Jedi</option>
            <option value="Blackguard">Blackguard</option>
            <option value="Far Traveler">Far Traveler</option>
            <option value="Investigator">Investigator</option>
            <option value="Lawyer">Lawyer</option>
            <option value="Spacer">Spacer</option>
            <option value="Holonet Technician">Holonet Technician</option>
            <option value="Student">Student</option>
            <option value="Servant">Servant</option>
            <option value="Jizz Wailer">Jizz Wailer</option>
            <option value="Insurgent">Insurgent</option>
            <option value="Archaeologist">Archaeologist</option>
            <option value="Survivor">Survivor</option>
            <option value="Scientist">Scientist</option>
            <option value="Teacher">Teacher</option>
            <option value="Scavenger">Scavenger</option>
          </select>
        </div>
        <div className="form-group">
          <label>Alignment:</label>
          <select
            value={characterData.alignment}
            onChange={(e) => updateCharacterData({ alignment: e.target.value })}
          >
            <option value="">Select alignment</option>
            <option value="Lawful Good">Lawful Good</option>
            <option value="Neutral Good">Neutral Good</option>
            <option value="Chaotic Good">Chaotic Good</option>
            <option value="Lawful Neutral">Lawful Neutral</option>
            <option value="True Neutral">True Neutral</option>
            <option value="Chaotic Neutral">Chaotic Neutral</option>
            <option value="Lawful Evil">Lawful Evil</option>
            <option value="Neutral Evil">Neutral Evil</option>
            <option value="Chaotic Evil">Chaotic Evil</option>
          </select>
        </div>
      </div>
      <div className="step-actions">
        <button 
          onClick={() => setStep(2)}
          disabled={!characterData.name || !characterData.class || !characterData.species || !characterData.background || !characterData.alignment}
          className="next-btn"
        >
          Next: Roll Ability Scores
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="creation-step">
      <h2>Step 2: Roll Ability Scores</h2>
      <p className="step-description">
        Roll 4d6, drop the lowest die, and sum the remaining three dice for each ability score. You can roll individual scores or use the "Roll All" button to generate all scores at once.
      </p>
      
      <div className="roll-all-section">
        <button onClick={rollAllAbilityScores} className="roll-all-btn">
          Roll All Ability Scores
        </button>
      </div>

      <div className="ability-scores-grid">
        {abilityScores.map((score, index) => (
          <div key={score.name} className="ability-score-card">
            <h3>{score.name}</h3>
            <div className="score-display">
              <span className="score-value">{score.value}</span>
              <span className="score-modifier">
                {getAbilityModifier(score.value) >= 0 ? '+' : ''}{getAbilityModifier(score.value)}
              </span>
            </div>
            <button 
              onClick={() => rollAbilityScore(index)}
              className={`roll-btn ${score.rolled ? 'rolled' : ''}`}
            >
              {score.rolled ? 'Re-roll' : 'Roll 4d6'}
            </button>
          </div>
        ))}
      </div>

      <div className="rolled-scores">
        <h3>Rolled Scores (Sorted High to Low):</h3>
        <div className="scores-list">
          {abilityScores
            .filter(score => score.rolled)
            .map(score => score.value)
            .sort((a, b) => b - a)
            .map((score, index) => (
              <span key={index} className="rolled-score">{score}</span>
            ))}
        </div>
      </div>

      <div className="step-actions">
        <button onClick={() => setStep(1)} className="back-btn">
          Back to Basic Info
        </button>
        <button 
          onClick={assignAbilityScores}
          disabled={abilityScores.filter(score => score.rolled).length !== 6}
          className="next-btn"
        >
          Next: Review Character
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="creation-step">
      <h2>Step 3: Review Your Character</h2>
      <p className="step-description">
        Review all the information for your character. Make sure everything looks correct before finalizing your character creation.
      </p>
      
      <div className="character-summary">
        <div className="summary-section">
          <h3>Basic Information</h3>
          <p><strong>Name:</strong> {characterData.name}</p>
          <p><strong>Class:</strong> {characterData.class}</p>
          <p><strong>Species:</strong> {characterData.species}</p>
          <p><strong>Background:</strong> {characterData.background}</p>
          <p><strong>Alignment:</strong> {characterData.alignment}</p>
        </div>

        <div className="summary-section">
          <h3>Ability Scores</h3>
          <div className="ability-summary">
            <div className="ability-item">
              <span>Strength:</span>
              <span>{characterData.strength} ({getAbilityModifier(characterData.strength) >= 0 ? '+' : ''}{getAbilityModifier(characterData.strength)})</span>
            </div>
            <div className="ability-item">
              <span>Dexterity:</span>
              <span>{characterData.dexterity} ({getAbilityModifier(characterData.dexterity) >= 0 ? '+' : ''}{getAbilityModifier(characterData.dexterity)})</span>
            </div>
            <div className="ability-item">
              <span>Constitution:</span>
              <span>{characterData.constitution} ({getAbilityModifier(characterData.constitution) >= 0 ? '+' : ''}{getAbilityModifier(characterData.constitution)})</span>
            </div>
            <div className="ability-item">
              <span>Intelligence:</span>
              <span>{characterData.intelligence} ({getAbilityModifier(characterData.intelligence) >= 0 ? '+' : ''}{getAbilityModifier(characterData.intelligence)})</span>
            </div>
            <div className="ability-item">
              <span>Wisdom:</span>
              <span>{characterData.wisdom} ({getAbilityModifier(characterData.wisdom) >= 0 ? '+' : ''}{getAbilityModifier(characterData.wisdom)})</span>
            </div>
            <div className="ability-item">
              <span>Charisma:</span>
              <span>{characterData.charisma} ({getAbilityModifier(characterData.charisma) >= 0 ? '+' : ''}{getAbilityModifier(characterData.charisma)})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button onClick={() => setStep(2)} className="back-btn">
          Back to Ability Scores
        </button>
        <button onClick={finishCharacterCreation} className="create-btn">
          Create Character
        </button>
      </div>
    </div>
  );

  return (
    <div className="character-creation">
      <div className="creation-container">
        <div className="creation-header">
          <h1>Create Your Star Wars Character</h1>
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default CharacterCreation; 
import React, { useState } from 'react';
import './DiceRoller.css';

interface DiceRollerProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Die {
  id: string;
  sides: number;
  count: number;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ isOpen, onToggle }) => {
  const [dice, setDice] = useState<Die[]>([]);
  const [rollHistory, setRollHistory] = useState<string[]>([]);

  const addDie = (sides: number) => {
    const newDie: Die = {
      id: Date.now().toString(),
      sides,
      count: 1
    };
    setDice(prev => [...prev, newDie]);
  };

  const removeDie = (id: string) => {
    setDice(prev => prev.filter(die => die.id !== id));
  };

  const updateDieCount = (id: string, count: number) => {
    setDice(prev => prev.map(die => 
      die.id === id ? { ...die, count: Math.max(1, count) } : die
    ));
  };

  const rollDice = () => {
    if (dice.length === 0) return;

    const results: { die: Die; rolls: number[]; total: number }[] = [];
    let grandTotal = 0;

    dice.forEach(die => {
      const rolls: number[] = [];
      let dieTotal = 0;
      
      for (let i = 0; i < die.count; i++) {
        const roll = Math.floor(Math.random() * die.sides) + 1;
        rolls.push(roll);
        dieTotal += roll;
      }
      
      results.push({ die, rolls, total: dieTotal });
      grandTotal += dieTotal;
    });

    // Create roll history entry
    const rollDescription = results.map(result => 
      `${result.die.count}d${result.die.sides}: [${result.rolls.join(', ')}] = ${result.total}`
    ).join(' + ');
    
    const historyEntry = `${rollDescription} = ${grandTotal}`;
    setRollHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 rolls
  };

  const clearDice = () => {
    setDice([]);
  };

  const clearHistory = () => {
    setRollHistory([]);
  };

  return (
    <>
      {/* Floating Dice Button */}
      <button 
        className={`dice-button ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        title="Dice Roller"
      >
        🎲
      </button>

      {/* Dice Roller Panel */}
      <div className={`dice-roller ${isOpen ? 'open' : ''}`}>
        <div className="dice-header">
          <h3>Dice Roller</h3>
          <button onClick={onToggle} className="close-btn">×</button>
        </div>

        <div className="dice-content">
          {/* Add Dice Section */}
          <div className="add-dice-section">
            <h4>Add Dice</h4>
            <div className="dice-buttons">
              <button onClick={() => addDie(4)}>d4</button>
              <button onClick={() => addDie(6)}>d6</button>
              <button onClick={() => addDie(8)}>d8</button>
              <button onClick={() => addDie(10)}>d10</button>
              <button onClick={() => addDie(12)}>d12</button>
              <button onClick={() => addDie(20)}>d20</button>
              <button onClick={() => addDie(100)}>d100</button>
            </div>
          </div>

          {/* Selected Dice */}
          <div className="selected-dice">
            <div className="dice-header-row">
              <h4>Selected Dice</h4>
              <button onClick={clearDice} className="clear-btn">Clear All</button>
            </div>
            {dice.length === 0 ? (
              <p className="no-dice">No dice selected. Click above to add dice.</p>
            ) : (
              <div className="dice-list">
                {dice.map(die => (
                  <div key={die.id} className="die-item">
                    <span className="die-label">{die.count}d{die.sides}</span>
                    <div className="die-controls">
                      <button 
                        onClick={() => updateDieCount(die.id, die.count - 1)}
                        disabled={die.count <= 1}
                        className="count-btn"
                      >
                        -
                      </button>
                      <span className="count">{die.count}</span>
                      <button 
                        onClick={() => updateDieCount(die.id, die.count + 1)}
                        className="count-btn"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeDie(die.id)}
                        className="remove-die-btn"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Roll Button */}
          <div className="roll-section">
            <button 
              onClick={rollDice}
              disabled={dice.length === 0}
              className="roll-all-btn"
            >
              Roll All Dice
            </button>
          </div>

          {/* Roll History */}
          <div className="roll-history">
            <div className="history-header">
              <h4>Roll History</h4>
              <button onClick={clearHistory} className="clear-btn">Clear</button>
            </div>
            {rollHistory.length === 0 ? (
              <p className="no-history">No rolls yet.</p>
            ) : (
              <div className="history-list">
                {rollHistory.map((roll, index) => (
                  <div key={index} className="history-item">
                    {roll}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DiceRoller; 
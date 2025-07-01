import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DiceRollPopup.css';

interface DiceRollPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  diceNotation: string;
  modifiers: number;
  onRollComplete: (result: number) => void;
}

interface Die {
  id: string;
  sides: number;
  value: number;
  isRolling: boolean;
}

const DiceRollPopup: React.FC<DiceRollPopupProps> = ({
  isOpen,
  onClose,
  title,
  diceNotation,
  modifiers,
  onRollComplete
}) => {
  const [dice, setDice] = useState<Die[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [rollHistory, setRollHistory] = useState<string[]>([]);
  
  // Use refs to access current values without causing re-renders
  const diceRef = useRef<Die[]>([]);
  const isRollingRef = useRef(false);
  
  // Update refs when state changes
  useEffect(() => {
    diceRef.current = dice;
  }, [dice]);
  
  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  // Parse dice notation (e.g., "1d20" -> 1 die with 20 sides, "2d20kh1" -> 2 dice with 20 sides, keep highest 1)
  const parseDiceNotation = (notation: string): { count: number; sides: number; keepHighest?: number } => {
    // Check for "keep highest" notation (e.g., "2d20kh1")
    const khMatch = notation.match(/(\d+)d(\d+)kh(\d+)/);
    if (khMatch) {
      return { 
        count: parseInt(khMatch[1]), 
        sides: parseInt(khMatch[2]), 
        keepHighest: parseInt(khMatch[3]) 
      };
    }
    
    // Regular dice notation
    const match = notation.match(/(\d+)d(\d+)/);
    if (!match) return { count: 1, sides: 20 };
    return { count: parseInt(match[1]), sides: parseInt(match[2]) };
  };

  // Roll animation for a single die
  const rollDie = useCallback((die: Die): Promise<number> => {
    return new Promise((resolve) => {
      const finalValue = Math.floor(Math.random() * die.sides) + 1;
      const rollDuration = 1000 + Math.random() * 500; // 1-1.5 seconds
      const updateInterval = 50; // Update every 50ms
      let elapsed = 0;

      const interval = setInterval(() => {
        elapsed += updateInterval;
        const progress = elapsed / rollDuration;
        
        if (progress >= 1) {
          clearInterval(interval);
          resolve(finalValue);
        } else {
          // Show random values during animation
          const randomValue = Math.floor(Math.random() * die.sides) + 1;
          setDice(prev => prev.map(d => 
            d.id === die.id ? { ...d, value: randomValue } : d
          ));
        }
      }, updateInterval);
    });
  }, []);

  // Roll all dice with staggered animation
  const rollAllDice = useCallback(async () => {
    if (isRollingRef.current) return;
    
    setIsRolling(true);
    setFinalResult(null);
    
    // Start rolling animation for all dice
    setDice(prev => prev.map(die => ({ ...die, isRolling: true })));
    
    // Roll dice with staggered timing
    const results = await Promise.all(
      diceRef.current.map((die, index) => 
        new Promise<number>(async (resolve) => {
          // Stagger the start of each die roll
          setTimeout(async () => {
            const result = await rollDie(die);
            resolve(result);
          }, index * 200); // 200ms delay between each die
        })
      )
    );
    
    // Set final values
    setDice(prev => prev.map((die, index) => ({
      ...die,
      value: results[index],
      isRolling: false
    })));
    
    // Calculate final result with keep highest logic
    const { keepHighest } = parseDiceNotation(diceNotation);
    let diceTotal: number;
    
    if (keepHighest && keepHighest < results.length) {
      // Sort results in descending order and keep the highest ones
      const sortedResults = [...results].sort((a, b) => b - a);
      diceTotal = sortedResults.slice(0, keepHighest).reduce((sum, value) => sum + value, 0);
    } else {
      // Use all results
      diceTotal = results.reduce((sum, value) => sum + value, 0);
    }
    
    const total = diceTotal + modifiers;
    setFinalResult(total);
    
    // Add to roll history with keep highest info if applicable
    let historyEntry = `${title}: ${diceTotal}${modifiers !== 0 ? ` + ${modifiers}` : ''} = ${total}`;
    if (keepHighest && keepHighest < results.length) {
      historyEntry = `${title}: [${results.join(', ')}] → ${diceTotal}${modifiers !== 0 ? ` + ${modifiers}` : ''} = ${total} (kept highest ${keepHighest})`;
    }
    setRollHistory(prev => [historyEntry, ...prev.slice(0, 4)]); // Keep last 5 rolls
    
    setIsRolling(false);
    onRollComplete(total);
  }, [modifiers, title, onRollComplete, rollDie, diceNotation]);

  // Initialize dice when popup opens
  useEffect(() => {
    if (isOpen) {
      const { count, sides } = parseDiceNotation(diceNotation);
      const newDice: Die[] = Array.from({ length: count }, (_, i) => ({
        id: `die-${i}`,
        sides,
        value: 1,
        isRolling: false
      }));
      setDice(newDice);
      setFinalResult(null);
      setRollHistory([]);
      
      // Automatically start rolling after a short delay
      setTimeout(() => {
        rollAllDice();
      }, 300);
    }
  }, [isOpen, diceNotation, rollAllDice]);

  // Close popup with escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dice-popup-overlay" onClick={onClose}>
      <div className="dice-popup" onClick={(e) => e.stopPropagation()}>
        <div className="dice-popup-header">
          <h3>{title}</h3>
          <button className="close-popup-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="dice-info">
          <p><strong>Dice:</strong> {diceNotation}</p>
          {modifiers !== 0 && (
            <p><strong>Modifiers:</strong> {modifiers > 0 ? '+' : ''}{modifiers}</p>
          )}
          {parseDiceNotation(diceNotation).keepHighest && (
            <p><strong>Advantage:</strong> Rolling {parseDiceNotation(diceNotation).count}d{parseDiceNotation(diceNotation).sides}, keeping highest {parseDiceNotation(diceNotation).keepHighest}</p>
          )}
        </div>
        
        {isRolling && (
          <div className="rolling-section">
            <div className="dice-container">
              {dice.map((die) => (
                <div key={die.id} className="rolling-die">
                  <div className="die-face die-front">{die.value}</div>
                  <div className="die-face die-back">{die.value}</div>
                  <div className="die-face die-right">{die.value}</div>
                  <div className="die-face die-left">{die.value}</div>
                  <div className="die-face die-top">{die.value}</div>
                  <div className="die-face die-bottom">{die.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {finalResult !== null && (
          <div className="result-section">
            <h4>Result</h4>
            <div className={`roll-result ${dice.length === 1 && dice[0].sides === 20 && dice[0].value === 20 ? 'natural-twenty' : ''} ${dice.length === 1 && dice[0].sides === 20 && dice[0].value === 1 ? 'natural-one' : ''}`}>
              {finalResult}
              {dice.length === 1 && dice[0].sides === 20 && dice[0].value === 20 && (
                <div className="natural-twenty-text">Natural 20!</div>
              )}
              {dice.length === 1 && dice[0].sides === 20 && dice[0].value === 1 && (
                <div className="natural-one-text">Epic Fail!</div>
              )}
            </div>
            <div className="roll-breakdown">
              Dice: {dice.map(d => d.value).join(' + ')} = {dice.reduce((sum, d) => sum + d.value, 0)}
              {modifiers !== 0 && ` + ${modifiers} = ${finalResult}`}
            </div>
          </div>
        )}
        
        {rollHistory.length > 0 && (
          <div className="roll-history">
            <h4>Recent Rolls</h4>
            <div className="history-list">
              {rollHistory.map((roll, index) => (
                <div key={index} className="history-item">
                  {roll}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRollPopup; 
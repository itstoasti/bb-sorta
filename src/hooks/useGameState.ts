import { useState, useCallback, useEffect } from 'react';
import { FLAVORS, THEME } from '../utils/theme';
import { audioController } from '../utils/audio';

export interface BobaLayer {
  id: string;
  color: string;
  flavor: string;
  type: 'fluid' | 'pearl';
}

export interface Cup {
  id: string;
  maxCapacity: number;
  layers: BobaLayer[];
}

export interface StrawState {
  currentLayers: BobaLayer[];
  maxCapacity: number;
}

export interface GameHistoryEntry {
  cups: Cup[];
  straw: StrawState;
  score: number;
  moves: number;
  comboCount: number;
  lastPouredColor: string | null;
}

export interface ActiveAction {
  type: 'suck' | 'dispense';
  cupId: string;
  targetLayers: BobaLayer[];
}

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

const getTargetMoves = (levelNum: number) => {
  if (levelNum === 1) return 8;
  if (levelNum === 2) return 10;
  if (levelNum <= 5) return 14;
  if (levelNum <= 10) return 20;
  return 28 + Math.floor((levelNum - 11) / 5) * 2;
};

export const useGameState = (
  initialLevel: number = 1,
  onAwardCoins?: (amount: number) => void,
  coins: number = 0
) => {
  const [level, setLevel] = useState<number>(initialLevel);
  const [cups, setCups] = useState<Cup[]>([]);
  const [straw, setStraw] = useState<StrawState>({ currentLayers: [], maxCapacity: THEME.dimensions.maxStrawCapacity });
  const [score, setScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [comboCount, setComboCount] = useState<number>(0);
  const [lastPouredColor, setLastPouredColor] = useState<string | null>(null);
  const [undoCharges, setUndoCharges] = useState<number>(5);
  
  // Timer & failure states for Timed Race levels
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);

  const isTimedRace = level % 10 === 0;
  const targetMoves = getTargetMoves(level);

  // Controls animation state: locks inputs and coordinates straw movement
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);

  /**
   * Procedural Level Generation
   * Starts from a solved state and scrambles backwards to guarantee solvability.
   */
  const generateLevel = useCallback((levelNum: number) => {
    // Determine configuration based on level difficulty
    let numColors = 3;
    let numEmptyCups = 2;
    let strawCapacity = THEME.dimensions.maxStrawCapacity; // default 2

    if (levelNum === 1) {
      numColors = 2; // Very easy: 2 sorted cups, 1 empty cup
      numEmptyCups = 1;
    } else if (levelNum === 2) {
      numColors = 3; // 3 sorted cups, 1 empty cup
      numEmptyCups = 1;
    } else if (levelNum <= 5) {
      numColors = 3; // 3 sorted cups, 2 empty cups
      numEmptyCups = 2;
    } else if (levelNum <= 10) {
      numColors = 4; // 4 sorted cups, 2 empty cups
      numEmptyCups = 2;
    } else {
      numColors = Math.min(5, 3 + Math.floor(levelNum / 5)); // Max 5 colors
      
      // Tight Spaces: Level 41+ even levels have 1 empty cup (except multiples of 10, which are timed races)
      if (levelNum >= 41 && levelNum % 2 === 0 && levelNum % 10 !== 0) {
        numEmptyCups = 1;
      } else {
        numEmptyCups = 2;
      }

      // Narrow Straw: Level 61+ odd levels have straw capacity of 1
      if (levelNum >= 61 && levelNum % 2 !== 0) {
        strawCapacity = 1;
      }
    }

    const flavorKeys = Object.keys(FLAVORS);
    const selectedFlavors = flavorKeys.slice(0, numColors);

    // 1. Create solved cups
    const solvedCups: Cup[] = selectedFlavors.map((flavorKey, index) => {
      const flavor = FLAVORS[flavorKey];
      // Alternate between fluid and pearl for different colors to add visual variety
      const layerType = index % 2 === 0 ? 'fluid' : 'pearl';
      
      const layers: BobaLayer[] = Array.from({ length: THEME.dimensions.maxCupCapacity }, () => ({
        id: generateId(),
        color: flavor.color,
        flavor: flavor.name,
        type: layerType,
      }));

      return {
        id: `cup_${index}`,
        maxCapacity: THEME.dimensions.maxCupCapacity,
        layers,
      };
    });

    // 2. Add empty cups
    const emptyCups: Cup[] = Array.from({ length: numEmptyCups }, (_, index) => ({
      id: `cup_empty_${index}`,
      maxCapacity: THEME.dimensions.maxCupCapacity,
      layers: [],
    }));

    const allCups = [...solvedCups, ...emptyCups];

    // 3. Scramble backward
    // Run multiple random valid transfers to mix layers
    const scrambleSteps = 15 + levelNum * 5;
    let prevSrc: string | null = null;
    let prevDest: string | null = null;

    for (let step = 0; step < scrambleSteps; step++) {
      // Find all valid transfers
      const validMoves: { srcIdx: number; destIdx: number }[] = [];

      for (let i = 0; i < allCups.length; i++) {
        for (let j = 0; j < allCups.length; j++) {
          if (i === j) continue;
          const srcCup = allCups[i];
          const destCup = allCups[j];

          // Can only move if source has layers and destination has space
          if (srcCup.layers.length > 0 && destCup.layers.length < destCup.maxCapacity) {
            // Avoid immediate undo loop to make it scramble better
            if (srcCup.id === prevDest && destCup.id === prevSrc) continue;
            validMoves.push({ srcIdx: i, destIdx: j });
          }
        }
      }

      if (validMoves.length === 0) break;

      // Select a random valid move and apply it
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      const srcCup = allCups[randomMove.srcIdx];
      const destCup = allCups[randomMove.destIdx];
      
      const poppedLayer = srcCup.layers.pop();
      if (poppedLayer) {
        destCup.layers.push(poppedLayer);
        prevSrc = srcCup.id;
        prevDest = destCup.id;
      }
    }

    setCups(allCups);
    setStraw({ currentLayers: [], maxCapacity: strawCapacity });
    setHistory([]);
    setScore(0);
    setMoves(0);
    setIsWon(false);
    setActiveAction(null);
    setComboCount(0);
    setLastPouredColor(null);
    setUndoCharges(5);

    // Reset timer on level start
    if (levelNum % 10 === 0) {
      setTimeLeft(90 + Math.floor(levelNum / 10) * 10);
      setIsFailed(false);
    } else {
      setTimeLeft(0);
      setIsFailed(false);
    }
  }, []);

  // Tick timer down on timed race levels
  useEffect(() => {
    if (!isTimedRace || isWon || isFailed || activeAction) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFailed(true);
          audioController.play('click'); // buzzer warning
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimedRace, isWon, isFailed, activeAction]);

  // Initialize level
  useEffect(() => {
    generateLevel(level);
  }, [level, generateLevel]);

  /**
   * Save current state to history before making a move.
   */
  const saveToHistory = useCallback(() => {
    const historyEntry: GameHistoryEntry = {
      cups: cups.map(c => ({ ...c, layers: [...c.layers] })),
      straw: { ...straw, currentLayers: [...straw.currentLayers] },
      score,
      moves,
      comboCount,
      lastPouredColor,
    };
    setHistory(prev => [...prev, historyEntry]);
  }, [cups, straw, score, moves, comboCount, lastPouredColor]);

  /**
   * Reverts to the previous state.
   */
  const undo = useCallback(() => {
    if (history.length === 0 || activeAction || undoCharges <= 0) return;

    audioController.play('click');
    const prevEntry = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCups(prevEntry.cups);
    setStraw(prevEntry.straw);
    setScore(prevEntry.score);
    setMoves(prevEntry.moves);
    setComboCount(prevEntry.comboCount);
    setLastPouredColor(prevEntry.lastPouredColor);
    setIsWon(false);
    setUndoCharges(prev => Math.max(0, prev - 1));
  }, [history, activeAction, undoCharges]);

  const addUndoCharges = useCallback((amount: number) => {
    setUndoCharges(prev => prev + amount);
  }, []);

  /**
   * Resets the current level.
   */
  const restart = useCallback(() => {
    if (activeAction) return;
    audioController.play('click');
    generateLevel(level);
  }, [level, generateLevel, activeAction]);

  /**
   * Advances to next level.
   */
  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
  }, []);

  /**
   * Determines if a cup is fully sorted.
   */
  const isCupSorted = (cup: Cup): boolean => {
    if (cup.layers.length === 0) return true;
    if (cup.layers.length !== cup.maxCapacity) return false;
    const firstLayer = cup.layers[0];
    return cup.layers.every(
      layer =>
        layer.flavor === firstLayer.flavor &&
        layer.color === firstLayer.color &&
        layer.type === firstLayer.type
    );
  };

  /**
   * Checks if the entire board is solved.
   */
  const checkWin = useCallback((currentCups: Cup[], currentStraw: StrawState) => {
    if (currentStraw.currentLayers.length > 0) return false;
    return currentCups.every(cup => isCupSorted(cup));
  }, []);

  /**
   * Initiates either a SUCK or DISPENSE action depending on straw state.
   */
  const handleCupTap = useCallback((cupId: string) => {
    if (activeAction || isWon || isFailed) return;

    const cup = cups.find(c => c.id === cupId);
    if (!cup) return;

    // SCENARIO 1: Straw is empty -> SUCK layers from cup
    if (straw.currentLayers.length === 0) {
      if (cup.layers.length === 0) return; // Cannot suck from empty cup

      saveToHistory();

      // Find how many matching consecutive layers we can suck from the top of the cup
      const topLayer = cup.layers[cup.layers.length - 1];
      const targetLayers: BobaLayer[] = [topLayer];

      // Check second layer from top
      if (straw.maxCapacity > 1 && cup.layers.length > 1) {
        const secondLayer = cup.layers[cup.layers.length - 2];
        if (secondLayer.flavor === topLayer.flavor && secondLayer.type === topLayer.type) {
          targetLayers.push(secondLayer);
        }
      }

      // Play slurp sound
      audioController.play('slurp');

      // Set active action to trigger animations
      setActiveAction({
        type: 'suck',
        cupId,
        targetLayers,
      });

    // SCENARIO 2: Straw has layers -> DISPENSE layers to cup
    } else {
      const tipLayer = straw.currentLayers[straw.currentLayers.length - 1]; // LIFO

      // Check if target cup can receive the tip layer
      const isCupEmpty = cup.layers.length === 0;
      const topCupLayer = cup.layers[cup.layers.length - 1];
      const isMatchingLayer = !isCupEmpty && topCupLayer.flavor === tipLayer.flavor && topCupLayer.type === tipLayer.type;
      const hasSpace = cup.layers.length < cup.maxCapacity;

      if (!hasSpace || (!isCupEmpty && !isMatchingLayer)) {
        // Play error/invalid action click
        audioController.play('click');
        return;
      }

      saveToHistory();

      // Determine how many layers we can dispense
      const targetLayers: BobaLayer[] = [];
      const newCupLayers = [...cup.layers];
      const newStrawLayers = [...straw.currentLayers];

      while (newStrawLayers.length > 0 && newCupLayers.length < cup.maxCapacity) {
        const nextStrawLayer = newStrawLayers[newStrawLayers.length - 1];
        if (newCupLayers.length === 0 || 
            (newCupLayers[newCupLayers.length - 1].flavor === nextStrawLayer.flavor && 
             newCupLayers[newCupLayers.length - 1].type === nextStrawLayer.type)) {
          
          targetLayers.push(nextStrawLayer);
          newStrawLayers.pop();
          newCupLayers.push(nextStrawLayer);
        } else {
          break;
        }
      }
      // Play pitch-ascending pour sound
      const pouredColor = targetLayers[0]?.color;
      let soundRate = 1.0;
      if (pouredColor && lastPouredColor === pouredColor) {
        soundRate = 1.0 + comboCount * 0.15;
      }
      audioController.playWithPitch('pour', soundRate);

      setActiveAction({
        type: 'dispense',
        cupId,
        targetLayers,
      });
    }
  }, [cups, straw, activeAction, isWon, saveToHistory, lastPouredColor, comboCount]);

  /**
   * Commits the animation state change to the actual React state.
   * Called by the component once the Reanimated transition is completed.
   */
  const commitAction = useCallback(() => {
    if (!activeAction) return;

    const { type, cupId, targetLayers } = activeAction;
    
    // 1. Calculate updated cups state
    const updatedCups = cups.map(cup => {
      if (cup.id === cupId) {
        if (type === 'suck') {
          // Remove targetLayers from cup
          return {
            ...cup,
            layers: cup.layers.slice(0, -targetLayers.length),
          };
        } else {
          // Add targetLayers to cup
          return {
            ...cup,
            layers: [...cup.layers, ...targetLayers],
          };
        }
      }
      return cup;
    });

    // 2. Calculate updated straw state
    const updatedStrawLayers = type === 'suck' 
      ? [...straw.currentLayers, ...targetLayers] 
      : straw.currentLayers.slice(0, -targetLayers.length);
    
    const updatedStraw = {
      ...straw,
      currentLayers: updatedStrawLayers,
    };

    // 3. Batch state updates
    setCups(updatedCups);
    setStraw(updatedStraw);

    // 4. Check win condition and award coins / score
    const won = checkWin(updatedCups, updatedStraw);
    if (won) {
      setIsWon(true);
      audioController.play('win');
      
      // Calculate stars based on moves goal
      const finalMoves = moves + 1;
      let stars = 1;
      if (finalMoves <= targetMoves) {
        stars = 3;
      } else if (finalMoves <= Math.floor(targetMoves * 1.5)) {
        stars = 2;
      }
      setEarnedStars(stars);

      // Determine coin reward based on stars
      let reward = 20;
      if (stars === 3) reward = 50;
      else if (stars === 2) reward = 35;
      setCoinsEarned(reward);

      setScore(prev => prev + 100 + Math.max(0, 50 - moves));
      if (onAwardCoins) {
        onAwardCoins(reward);
      }
    }

    // 5. Update combo state
    if (type === 'dispense') {
      const pouredColor = targetLayers[0]?.color;
      if (pouredColor) {
        if (lastPouredColor === pouredColor) {
          const nextCombo = comboCount + 1;
          setComboCount(nextCombo);
          setScore(s => s + nextCombo * 10);
        } else {
          setComboCount(1);
          setLastPouredColor(pouredColor);
          setScore(s => s + 10);
        }
      }
    }

    setMoves(prev => prev + 1);
    setActiveAction(null);
  }, [
    activeAction,
    cups,
    straw,
    checkWin,
    moves,
    lastPouredColor,
    comboCount,
    onAwardCoins,
    targetMoves,
  ]);

  const buyExtraTime = useCallback(() => {
    if (coins < 50) return false;
    if (onAwardCoins) {
      onAwardCoins(-50);
    }
    setTimeLeft(30);
    setIsFailed(false);
    return true;
  }, [coins, onAwardCoins]);

  return {
    level,
    cups,
    straw,
    score,
    moves,
    isWon,
    historyLength: history.length,
    activeAction,
    handleCupTap,
    commitAction,
    undo,
    restart,
    nextLevel,
    comboCount,
    lastPouredColor,
    isTimedRace,
    timeLeft,
    isFailed,
    buyExtraTime,
    earnedStars,
    coinsEarned,
    targetMoves,
    undoCharges,
    addUndoCharges,
  };
};


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GameStats, Target, TargetType, AICoachMessage } from './types';
import { getCoachFeedback } from './services/geminiService';
import { audioService } from './services/audioService';
import MainMenu from './components/MainMenu';
import GameView from './components/GameView';
import ResultScreen from './components/ResultScreen';
import HUD from './components/HUD';
import AICoachOverlay from './components/AICoachOverlay';

const MAX_BOMB_HITS = 5;
const MAX_TOTAL_MISSES = 10;
const HIGH_SCORE_KEY = 'neon_aim_strikers_high_score';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [highScore, setHighScore] = useState<number>(0);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    hits: 0,
    misses: 0,
    accuracy: 100,
    maxCombo: 0,
    currentCombo: 0,
    timeRemaining: 0,
    bombHits: 0,
  });
  const [targets, setTargets] = useState<Target[]>([]);
  const [coachMessage, setCoachMessage] = useState<AICoachMessage | null>(null);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movementLoopRef = useRef<number | null>(null);

  const currentDifficulty = Math.floor(stats.score / 100) + 1;

  useEffect(() => {
    const savedScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedScore) setHighScore(parseInt(savedScore, 10));
  }, []);

  const endGame = useCallback(async (reason?: string) => {
    setStatus(GameStatus.ENDED);
    audioService.stopMusic();
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (movementLoopRef.current) cancelAnimationFrame(movementLoopRef.current);
    
    setStats(currentStats => {
      if (currentStats.score > highScore) {
        setHighScore(currentStats.score);
        localStorage.setItem(HIGH_SCORE_KEY, currentStats.score.toString());
      }
      return currentStats;
    });

    const finalFeedback = await getCoachFeedback(stats, totalAttempted);
    if (reason) finalFeedback.text = `${reason} ${finalFeedback.text}`;
    setCoachMessage(finalFeedback);
  }, [stats, totalAttempted, highScore]);

  const startGame = () => {
    audioService.playClick('menu');
    setStats({
      score: 0,
      hits: 0,
      misses: 0,
      accuracy: 100,
      maxCombo: 0,
      currentCombo: 0,
      timeRemaining: 0,
      bombHits: 0,
    });
    setTargets([]);
    setTotalAttempted(0);
    setStatus(GameStatus.PLAYING);
    audioService.startMusic();
    setCoachMessage({ 
      text: "INICIANDO SOBREVIVÊNCIA: Procure pelos corações verdes para limpar seus erros!", 
      sentiment: "neutral" 
    });
  };

  const backToMenu = () => {
    audioService.playClick('menu');
    setStatus(GameStatus.IDLE);
    setCoachMessage(null);
  };

  const updateMovement = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    setTargets(prev => prev.map(t => {
      let newX = t.x + t.vx;
      let newY = t.y + t.vy;
      let newVx = t.vx;
      let newVy = t.vy;

      if (newX < 50 || newX > window.innerWidth - 50) newVx = -t.vx;
      if (newY < 140 || newY > window.innerHeight - 100) newVy = -t.vy;

      return { ...t, x: newX, y: newY, vx: newVx, vy: newVy };
    }));

    movementLoopRef.current = requestAnimationFrame(updateMovement);
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      movementLoopRef.current = requestAnimationFrame(updateMovement);
    }
    return () => {
      if (movementLoopRef.current) cancelAnimationFrame(movementLoopRef.current);
    };
  }, [status, updateMovement]);

  const spawnTarget = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    const difficultyStage = Math.floor(stats.score / 100);
    const id = Math.random().toString(36).substr(2, 9);
    const padding = 60;
    const x = padding + Math.random() * (window.innerWidth - padding * 2);
    const y = 140 + Math.random() * (window.innerHeight - padding * 2 - 100);
    
    const bombChance = Math.min(0.4, 0.1 + (difficultyStage * 0.05));
    const goldenChance = 0.05;
    const lifeChance = 0.04; // 4% de chance de vida
    const rand = Math.random();
    
    let type: TargetType = 'standard';
    let size = Math.max(18, 55 - (difficultyStage * 4)); 
    let lifeSpan = Math.max(400, 1800 - (difficultyStage * 150)); 
    let speedMult = 1.0 + (difficultyStage * 0.6); 

    if (rand < goldenChance) {
      type = 'golden';
      size *= 0.6;
      lifeSpan *= 0.7;
      speedMult *= 1.5;
    } else if (rand < (goldenChance + lifeChance)) {
      type = 'life';
      size = 45;
      lifeSpan = 1500;
      speedMult *= 1.2;
    } else if (rand < (goldenChance + lifeChance + bombChance)) {
      type = 'bomb';
      size = 50;
      lifeSpan = 2500;
      speedMult *= 0.5;
    }

    const vx = (Math.random() - 0.5) * speedMult * 3;
    const vy = (Math.random() - 0.5) * speedMult * 3;

    const newTarget: Target = {
      id, x, y, vx, vy, size, type,
      createdAt: Date.now(),
      expiresAt: Date.now() + lifeSpan,
    };

    setTargets(prev => [...prev, newTarget]);
    setTotalAttempted(prev => prev + 1);

    const spawnInterval = Math.max(150, 1100 - (difficultyStage * 100));
    spawnTimerRef.current = setTimeout(spawnTarget, spawnInterval);
  }, [status, stats.score]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      spawnTarget();
    }
    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, [status, spawnTarget]);

  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => {
        const expired = prev.filter(t => t.expiresAt <= now);
        if (expired.length > 0) {
          const realTargetMissed = expired.some(t => t.type !== 'bomb' && t.type !== 'life');
          if (realTargetMissed) {
            setStats(s => ({ ...s, currentCombo: 0 }));
          }
        }
        return prev.filter(t => t.expiresAt > now);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [status]);

  const handleTargetClick = (target: Target) => {
    setTargets(prev => prev.filter(t => t.id !== target.id));
    
    if (target.type === 'bomb') {
      audioService.playClick('miss');
      setStats(prev => {
        const newBombHits = prev.bombHits + 1;
        if (newBombHits >= MAX_BOMB_HITS) endGame("Integridade do sistema comprometida por explosivos!");
        return {
          ...prev,
          score: Math.max(0, prev.score - 50),
          currentCombo: 0,
          bombHits: newBombHits,
          accuracy: (prev.hits / (prev.hits + prev.misses + 1)) * 100,
        };
      });
      return;
    }

    if (target.type === 'life') {
      audioService.playClick('hit');
      setStats(prev => ({
        ...prev,
        misses: Math.max(0, prev.misses - 1),
        score: prev.score + 25,
        currentCombo: prev.currentCombo + 1,
      }));
      return;
    }

    audioService.playClick('hit');
    let points = 10;
    if (target.type === 'golden') points = 50;

    setStats(prev => {
      const newCombo = prev.currentCombo + 1;
      const comboBonus = Math.floor(newCombo / 5) * 5;
      const totalPoints = points + comboBonus;
      const newHits = prev.hits + 1;
      const totalShots = newHits + prev.misses;

      return {
        ...prev,
        score: prev.score + totalPoints,
        hits: newHits,
        currentCombo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        accuracy: (newHits / totalShots) * 100,
      };
    });
  };

  const handleMiss = () => {
    if (status !== GameStatus.PLAYING) return;
    audioService.playClick('miss');
    setStats(prev => {
      const newMisses = prev.misses + 1;
      if (newMisses >= MAX_TOTAL_MISSES) endGame("Recalibração necessária: Muitos disparos falhos.");
      const totalShots = prev.hits + newMisses;
      return {
        ...prev,
        misses: newMisses,
        currentCombo: 0,
        accuracy: (prev.hits / totalShots) * 100,
      };
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col">
      <HUD stats={stats} difficulty={currentDifficulty} />
      
      {status === GameStatus.IDLE && (
        <MainMenu onStart={startGame} highScore={highScore} />
      )}

      {status === GameStatus.PLAYING && (
        <GameView 
          targets={targets} 
          onTargetClick={handleTargetClick} 
          onMiss={handleMiss} 
        />
      )}

      {status === GameStatus.ENDED && (
        <ResultScreen stats={stats} onRestart={startGame} onGoToMenu={backToMenu} />
      )}

      <AICoachOverlay message={coachMessage} />
      
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,#111_0%,#000_100%)] z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#22d3ee]"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-magenta-500 shadow-[0_0_15px_#e879f9]"></div>
    </div>
  );
};

export default App;

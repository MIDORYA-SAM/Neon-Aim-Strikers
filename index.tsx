
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED'
}

type TargetType = 'standard' | 'golden' | 'bomb' | 'life';

interface Target {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: TargetType;
  createdAt: number;
  expiresAt: number;
}

interface GameStats {
  score: number;
  hits: number;
  misses: number;
  accuracy: number;
  maxCombo: number;
  currentCombo: number;
  bombHits: number;
}

interface AICoachMessage {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'sarcastic';
}

// --- CONSTANTS ---
const MAX_BOMB_HITS = 5;
const MAX_TOTAL_MISSES = 10;
const HIGH_SCORE_KEY = 'neon_aim_strikers_high_score';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AUDIO SERVICE ---
class AudioService {
  private ctx: AudioContext | null = null;
  private isMusicPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playClick(type: 'hit' | 'miss' | 'menu' = 'hit') {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;

    if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'miss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  public stopMusic() {
    this.activeOscillators.forEach(osc => { try { osc.stop(); } catch(e) {} });
    this.activeOscillators = [];
    this.isMusicPlaying = false;
  }

  public async startMusic() {
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    const notes = [261.63, 329.63, 392.00, 523.25];
    let currentNote = 0;
    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(notes[currentNote % notes.length], this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
      this.activeOscillators.push(osc);
      currentNote++;
      setTimeout(playStep, 150);
    };
    playStep();
  }
}
const audioService = new AudioService();

// --- GEMINI SERVICE ---
const getCoachFeedback = async (stats: GameStats) => {
  try {
    const prompt = `Treinador Cyberpunk. Status: Pontos ${stats.score}, Precisão ${stats.accuracy.toFixed(1)}%, Combo ${stats.maxCombo}. 1 frase sarcástica/curta em PT-BR.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative', 'sarcastic'] }
          },
          required: ["text", "sentiment"]
        }
      }
    });
    return JSON.parse(response.text || '{"text": "Continue atirando.", "sentiment": "neutral"}');
  } catch (e) {
    return { text: "Uplink instável. Foco no alvo.", sentiment: "neutral" };
  }
};

// --- COMPONENTS ---
const HUD: React.FC<{ stats: GameStats; difficulty: number }> = ({ stats, difficulty }) => (
  <div className="relative z-20 flex flex-wrap items-center justify-between px-8 py-4 bg-black/80 border-b border-gray-800 backdrop-blur-md">
    <div className="flex gap-8 items-center">
      <div className="flex flex-col border-r border-gray-700 pr-6">
        <span className="text-xs text-yellow-500 uppercase tracking-widest font-bold">Ameaça</span>
        <span className="text-3xl font-orbitron font-bold text-white glow-yellow">v{difficulty}.0</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Pontos</span>
        <span className="text-3xl font-orbitron font-bold text-white glow-cyan">{stats.score}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs text-magenta-400 uppercase tracking-widest font-bold">Precisão</span>
        <span className="text-xl font-orbitron font-bold text-white">{Math.round(stats.accuracy)}%</span>
      </div>
    </div>
    <div className="flex gap-6 items-center">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-red-500 uppercase font-bold">Danos</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${i < stats.bombHits ? 'bg-red-600 shadow-[0_0_5px_red]' : 'bg-gray-800'}`}></div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-orange-400 uppercase font-bold">Falhas</span>
        <span className={`text-xl font-orbitron font-bold ${stats.misses > 7 ? 'text-red-500' : 'text-orange-400'}`}>
          {stats.misses}/10
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs text-green-400 uppercase tracking-widest font-bold">Combo</span>
        <span className="text-3xl font-orbitron font-bold text-green-400 glow-cyan">x{stats.currentCombo}</span>
      </div>
    </div>
  </div>
);

const GameView: React.FC<{ targets: Target[]; onTargetClick: (t: Target) => void; onMiss: () => void }> = ({ targets, onTargetClick, onMiss }) => {
  const createShotEffect = (x: number, y: number, hit: boolean) => {
    const effect = document.createElement('div');
    effect.className = `absolute pointer-events-none rounded-full border-2 ${hit ? 'border-cyan-400' : 'border-red-500'} animate-ping`;
    effect.style.left = `${x - 20}px`;
    effect.style.top = `${y - 20}px`;
    effect.style.width = '40px';
    effect.style.height = '40px';
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
  };

  return (
    <div className="relative flex-1 cursor-crosshair overflow-hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) { onMiss(); createShotEffect(e.clientX, e.clientY, false); } }}>
      {targets.map(t => (
        <div key={t.id} className={`absolute rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10 ${
          t.type === 'golden' ? 'bg-yellow-400 shadow-[0_0_20px_#facc15] border-2 border-white animate-pulse-slow' :
          t.type === 'bomb' ? 'bg-red-600 shadow-[0_0_20px_#dc2626] border-2 border-black' :
          t.type === 'life' ? 'bg-green-500 shadow-[0_0_20px_#22c55e] border-2 border-white animate-pulse-slow' :
          'bg-cyan-500 shadow-[0_0_15px_#06b6d4] border-2 border-white'
        }`}
        style={{ left: t.x, top: t.y, width: t.size, height: t.size, transform: 'translate(-50%, -50%)' }}
        onMouseDown={(e) => { e.stopPropagation(); onTargetClick(t); createShotEffect(e.clientX, e.clientY, t.type !== 'bomb'); }}>
          {t.type === 'bomb' && <i className="fa-solid fa-radiation text-black text-xl"></i>}
          {t.type === 'golden' && <i className="fa-solid fa-star text-white text-xs animate-spin"></i>}
          {t.type === 'life' && <i className="fa-solid fa-heart text-white text-lg animate-pulse"></i>}
        </div>
      ))}
    </div>
  );
};

const MainMenu: React.FC<{ onStart: () => void; highScore: number }> = ({ onStart, highScore }) => (
  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl p-4 text-center">
    <h1 className="text-6xl font-orbitron font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-magenta-400 drop-shadow-[0_5px_15px_rgba(34,211,238,0.5)] mb-4">
      NEON AIM STRIKERS
    </h1>
    <div className="px-6 py-2 border border-yellow-500/50 bg-yellow-500/5 rounded-full mb-8">
      <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest mr-2">Recorde:</span>
      <span className="text-2xl font-orbitron font-bold text-white">{highScore}</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white/5 p-4 border border-cyan-500/30 rounded-lg"><i className="fa-solid fa-bullseye text-cyan-400 mb-2 block"></i><span className="text-xs text-gray-400">Padrão</span></div>
      <div className="bg-white/5 p-4 border border-yellow-500/30 rounded-lg"><i className="fa-solid fa-star text-yellow-400 mb-2 block"></i><span className="text-xs text-gray-400">Dourado</span></div>
      <div className="bg-white/5 p-4 border border-green-500/30 rounded-lg"><i className="fa-solid fa-heart text-green-400 mb-2 block"></i><span className="text-xs text-gray-400">Vida</span></div>
      <div className="bg-white/5 p-4 border border-red-500/30 rounded-lg"><i className="fa-solid fa-skull text-red-500 mb-2 block"></i><span className="text-xs text-gray-400">Bomba</span></div>
    </div>
    <button onClick={onStart} className="px-12 py-4 border-2 border-cyan-400 font-orbitron font-bold text-white hover:bg-cyan-400 hover:text-black transition-all">INICIAR COMBATE</button>
  </div>
);

const ResultScreen: React.FC<{ stats: GameStats; onRestart: () => void; onGoToMenu: () => void }> = ({ stats, onRestart, onGoToMenu }) => (
  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl p-8 text-center">
    <h2 className="text-5xl font-orbitron font-bold text-magenta-500 mb-8 uppercase italic">Fim de Sessão</h2>
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-white/5 p-6 border border-white/10"><span className="text-[10px] text-gray-500 block uppercase">Pontos</span><span className="text-3xl font-bold text-cyan-400">{stats.score}</span></div>
      <div className="bg-white/5 p-6 border border-white/10"><span className="text-[10px] text-gray-500 block uppercase">Precisão</span><span className="text-3xl font-bold text-yellow-400">{Math.round(stats.accuracy)}%</span></div>
    </div>
    <button onClick={onRestart} className="px-12 py-4 bg-magenta-600 text-white font-orbitron font-bold mb-4 hover:bg-magenta-500">REINICIAR</button>
    <button onClick={onGoToMenu} className="text-gray-500 text-xs hover:text-white underline">MENU PRINCIPAL</button>
  </div>
);

// --- MAIN APP ---
const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [highScore, setHighScore] = useState(0);
  const [stats, setStats] = useState<GameStats>({ score: 0, hits: 0, misses: 0, accuracy: 100, maxCombo: 0, currentCombo: 0, bombHits: 0 });
  const [targets, setTargets] = useState<Target[]>([]);
  const [coachMessage, setCoachMessage] = useState<AICoachMessage | null>(null);

  const spawnTimerRef = useRef<any>(null);
  const movementLoopRef = useRef<number | null>(null);
  const currentDifficulty = Math.floor(stats.score / 100) + 1;

  useEffect(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const endGame = useCallback(async (reason: string) => {
    setStatus(GameStatus.ENDED);
    audioService.stopMusic();
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (movementLoopRef.current) cancelAnimationFrame(movementLoopRef.current);
    
    if (stats.score > highScore) {
      setHighScore(stats.score);
      localStorage.setItem(HIGH_SCORE_KEY, stats.score.toString());
    }
    const feedback = await getCoachFeedback(stats);
    setCoachMessage({ ...feedback, text: `${reason} ${feedback.text}` });
  }, [stats, highScore]);

  const startGame = () => {
    audioService.playClick('menu');
    setStats({ score: 0, hits: 0, misses: 0, accuracy: 100, maxCombo: 0, currentCombo: 0, bombHits: 0 });
    setTargets([]);
    setStatus(GameStatus.PLAYING);
    audioService.startMusic();
    setCoachMessage({ text: "SISTEMA ONLINE. Alvos verdes recuperam falhas.", sentiment: "neutral" });
  };

  const updateMovement = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    setTargets(prev => prev.map(t => {
      let nx = t.x + t.vx; let ny = t.y + t.vy;
      let nvx = t.vx; let nvy = t.vy;
      if (nx < 50 || nx > window.innerWidth - 50) nvx = -t.vx;
      if (ny < 140 || ny > window.innerHeight - 100) nvy = -t.vy;
      return { ...t, x: nx, y: ny, vx: nvx, vy: nvy };
    }));
    movementLoopRef.current = requestAnimationFrame(updateMovement);
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) movementLoopRef.current = requestAnimationFrame(updateMovement);
    return () => { if (movementLoopRef.current) cancelAnimationFrame(movementLoopRef.current); };
  }, [status, updateMovement]);

  const spawnTarget = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    const difficultyStage = Math.floor(stats.score / 100);
    const id = Math.random().toString(36).substr(2, 9);
    const x = 60 + Math.random() * (window.innerWidth - 120);
    const y = 140 + Math.random() * (window.innerHeight - 240);
    
    const rand = Math.random();
    let type: TargetType = 'standard';
    let size = Math.max(20, 55 - (difficultyStage * 4));
    let lifeSpan = Math.max(500, 1800 - (difficultyStage * 120));
    let speed = 1.0 + (difficultyStage * 0.5);

    if (rand < 0.05) { type = 'golden'; size *= 0.6; lifeSpan *= 0.7; speed *= 1.5; }
    else if (rand < 0.09) { type = 'life'; size = 45; lifeSpan = 1500; speed *= 1.2; }
    else if (rand < 0.2 + (difficultyStage * 0.03)) { type = 'bomb'; size = 50; lifeSpan = 2500; speed *= 0.5; }

    setTargets(prev => [...prev, { id, x, y, vx: (Math.random()-0.5)*speed*3, vy: (Math.random()-0.5)*speed*3, size, type, createdAt: Date.now(), expiresAt: Date.now() + lifeSpan }]);
    spawnTimerRef.current = setTimeout(spawnTarget, Math.max(200, 1000 - (difficultyStage * 80)));
  }, [status, stats.score]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) spawnTarget();
    return () => clearTimeout(spawnTimerRef.current);
  }, [status, spawnTarget]);

  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => {
        const expired = prev.filter(t => t.expiresAt <= now);
        if (expired.some(t => t.type === 'standard' || t.type === 'golden')) {
           setStats(s => ({ ...s, currentCombo: 0 }));
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
        const nb = prev.bombHits + 1;
        if (nb >= MAX_BOMB_HITS) endGame("FALHA CRÍTICA POR EXPLOSIVOS.");
        return { ...prev, score: Math.max(0, prev.score - 50), currentCombo: 0, bombHits: nb };
      });
      return;
    }
    if (target.type === 'life') {
      audioService.playClick('hit');
      setStats(prev => ({ ...prev, misses: Math.max(0, prev.misses - 1), score: prev.score + 25 }));
      return;
    }
    audioService.playClick('hit');
    const points = target.type === 'golden' ? 50 : 10;
    setStats(prev => {
      const nc = prev.currentCombo + 1;
      const nh = prev.hits + 1;
      return { ...prev, score: prev.score + points + (Math.floor(nc/5)*5), hits: nh, currentCombo: nc, maxCombo: Math.max(prev.maxCombo, nc), accuracy: (nh / (nh + prev.misses)) * 100 };
    });
  };

  const handleMiss = () => {
    if (status !== GameStatus.PLAYING) return;
    audioService.playClick('miss');
    setStats(prev => {
      const nm = prev.misses + 1;
      if (nm >= MAX_TOTAL_MISSES) endGame("LIMITE DE FALHAS ATINGIDO.");
      return { ...prev, misses: nm, currentCombo: 0, accuracy: (prev.hits / (prev.hits + nm)) * 100 };
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col text-white font-rajdhani">
      <HUD stats={stats} difficulty={currentDifficulty} />
      {status === GameStatus.IDLE && <MainMenu onStart={startGame} highScore={highScore} />}
      {status === GameStatus.PLAYING && <GameView targets={targets} onTargetClick={handleTargetClick} onMiss={handleMiss} />}
      {status === GameStatus.ENDED && <ResultScreen stats={stats} onRestart={startGame} onGoToMenu={() => setStatus(GameStatus.IDLE)} />}
      
      {coachMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-cyan-500/50 p-4 min-w-[320px] backdrop-blur-md flex items-center gap-4 animate-bounce-short">
          <i className="fa-solid fa-robot text-cyan-400 text-2xl"></i>
          <div>
            <span className="text-[10px] text-cyan-500 font-bold uppercase block">CONSELHEIRO TÁTICO</span>
            <p className="text-sm italic">"{coachMessage.text}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

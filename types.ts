
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED',
  PAUSED = 'PAUSED'
}

export type TargetType = 'standard' | 'golden' | 'phantom' | 'bomb';

export interface Target {
  id: string;
  x: number;
  y: number;
  vx: number; // Velocidade X
  vy: number; // Velocidade Y
  size: number;
  type: TargetType;
  createdAt: number;
  expiresAt: number;
}

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  accuracy: number;
  maxCombo: number;
  currentCombo: number;
  timeRemaining: number;
  bombHits: number;
}

export interface AICoachMessage {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'sarcastic';
}

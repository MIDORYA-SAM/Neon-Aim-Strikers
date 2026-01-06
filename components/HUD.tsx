
import React from 'react';
import { GameStats } from '../types';

interface HUDProps {
  stats: GameStats;
}

const HUD: React.FC<HUDProps> = ({ stats }) => {
  return (
    <div className="relative z-20 flex flex-wrap items-center justify-between px-8 py-4 bg-black/80 border-b border-gray-800 backdrop-blur-md">
      <div className="flex gap-8 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Pontos</span>
          <span className="text-3xl font-orbitron font-bold text-white glow-cyan">{stats.score.toLocaleString()}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-magenta-400 uppercase tracking-widest font-bold">Precisão</span>
          <div className="flex items-center gap-2">
             <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-magenta-500 transition-all duration-300"
                  style={{ width: `${stats.accuracy}%` }}
                />
             </div>
             <span className="text-lg font-orbitron font-bold text-white">{Math.round(stats.accuracy)}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-yellow-400 uppercase tracking-widest font-bold">Cronômetro</span>
        <span className={`text-4xl font-orbitron font-bold ${stats.timeRemaining < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {stats.timeRemaining}s
        </span>
      </div>

      <div className="flex gap-8 items-center">
        {/* Novos Indicadores de Vidas/Erros */}
        <div className="flex flex-col items-center px-4 border-l border-r border-gray-700">
           <span className="text-[10px] text-red-500 uppercase font-bold">Danos (Max 5)</span>
           <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${i < stats.bombHits ? 'bg-red-600 shadow-[0_0_5px_red]' : 'bg-gray-800'}`}></div>
              ))}
           </div>
        </div>

        <div className="flex flex-col items-center">
           <span className="text-[10px] text-orange-400 uppercase font-bold">Falhas (Max 10)</span>
           <span className={`text-xl font-orbitron font-bold ${stats.misses > 7 ? 'text-red-500' : 'text-orange-400'}`}>
              {stats.misses}/10
           </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-green-400 uppercase tracking-widest font-bold">Combo</span>
          <span className="text-3xl font-orbitron font-bold text-green-400 glow-cyan">
            x{stats.currentCombo}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HUD;

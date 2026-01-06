
import React from 'react';
import { GameStats } from '../types';

interface ResultScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onGoToMenu: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ stats, onRestart, onGoToMenu }) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <h2 className="text-5xl font-orbitron font-bold text-magenta-500 glow-magenta uppercase italic tracking-tighter">
          Simulação Concluída
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 min-w-[300px] md:min-w-[600px]">
          <StatBox label="Pontuação Final" value={stats.score.toLocaleString()} color="text-cyan-400" />
          <StatBox label="Precisão" value={`${Math.round(stats.accuracy)}%`} color="text-yellow-400" />
          <StatBox label="Combo Máximo" value={stats.maxCombo.toString()} color="text-green-400" />
          <StatBox label="Total de Acertos" value={stats.hits.toString()} color="text-white" />
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
           <button 
            onClick={onRestart}
            className="px-16 py-4 bg-magenta-600 text-white font-orbitron font-bold text-xl rounded-none border-b-4 border-magenta-900 transition-all hover:bg-magenta-500 hover:-translate-y-1 active:translate-y-0"
          >
            REINICIAR INTERFACE NEURAL
          </button>
          
          <button 
            onClick={onGoToMenu}
            className="text-gray-500 uppercase tracking-widest text-xs hover:text-white transition-colors border border-transparent hover:border-gray-800 px-4 py-2 rounded"
          >
            Voltar ao Menu Inicial
          </button>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-none flex flex-col items-center justify-center">
    <span className="text-[10px] text-gray-500 uppercase tracking-tighter mb-1">{label}</span>
    <span className={`text-3xl font-orbitron font-bold ${color}`}>{value}</span>
  </div>
);

export default ResultScreen;

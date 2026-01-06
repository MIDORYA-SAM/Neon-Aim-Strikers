
import React from 'react';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl">
      <div className="text-center space-y-6 max-w-3xl px-4">
        <h1 className="text-7xl font-orbitron font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-magenta-400 drop-shadow-[0_5px_15px_rgba(34,211,238,0.5)]">
          NEON AIM STRIKERS
        </h1>
        <p className="text-xl text-gray-400 font-light tracking-widest uppercase">
          Neural Uplink Estabelecido // Treinador de Mira v3.1
        </p>

        <div className="inline-block px-6 py-2 border border-yellow-500/50 bg-yellow-500/5 rounded-full">
           <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest mr-2">Recorde Global:</span>
           <span className="text-2xl font-orbitron font-bold text-white glow-yellow">
             {highScore.toLocaleString()}
           </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="bg-white/5 p-4 border border-cyan-500/30 rounded-lg">
            <i className="fa-solid fa-bullseye text-cyan-400 text-2xl mb-2"></i>
            <h3 className="text-xs font-bold text-gray-300 uppercase mb-1">Padrão</h3>
            <p className="text-[10px] text-gray-500">Alvos básicos para ritmo.</p>
          </div>
          <div className="bg-white/5 p-4 border border-yellow-500/30 rounded-lg">
            <i className="fa-solid fa-star text-yellow-400 text-2xl mb-2"></i>
            <h3 className="text-xs font-bold text-gray-300 uppercase mb-1">Dourado</h3>
            <p className="text-[10px] text-gray-500">Alta pontuação e combo.</p>
          </div>
          <div className="bg-white/5 p-4 border border-green-500/30 rounded-lg">
            <i className="fa-solid fa-heart text-green-400 text-2xl mb-2"></i>
            <h3 className="text-xs font-bold text-gray-300 uppercase mb-1">Vida</h3>
            <p className="text-[10px] text-gray-500">Remove 1 falha de mira.</p>
          </div>
          <div className="bg-white/5 p-4 border border-red-500/30 rounded-lg">
            <i className="fa-solid fa-skull text-red-500 text-2xl mb-2"></i>
            <h3 className="text-xs font-bold text-gray-300 uppercase mb-1">Perigo</h3>
            <p className="text-[10px] text-gray-500">Causa dano ao sistema.</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="group relative px-12 py-4 bg-transparent font-orbitron font-bold text-2xl text-white border-2 border-cyan-400 overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-cyan-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
          <span className="relative z-10 group-hover:text-black uppercase">Iniciar Combate</span>
        </button>
      </div>
    </div>
  );
};

export default MainMenu;

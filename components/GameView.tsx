
import React from 'react';
import { Target } from '../types';

interface GameViewProps {
  targets: Target[];
  onTargetClick: (target: Target) => void;
  onMiss: () => void;
}

const GameView: React.FC<GameViewProps> = ({ targets, onTargetClick, onMiss }) => {
  const handleContainerClick = (e: React.MouseEvent) => {
    // If we clicked the container and not a target
    if (e.target === e.currentTarget) {
      onMiss();
      createShotEffect(e.clientX, e.clientY, false);
    }
  };

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
    <div 
      className="relative flex-1 cursor-crosshair overflow-hidden"
      onMouseDown={handleContainerClick}
    >
      {targets.map(target => (
        <div
          key={target.id}
          className={`absolute rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10 ${getTargetStyle(target.type)}`}
          style={{
            left: target.x,
            top: target.y,
            width: target.size,
            height: target.size,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onTargetClick(target);
            createShotEffect(e.clientX, e.clientY, target.type !== 'bomb');
          }}
        >
          {target.type === 'bomb' && <i className="fa-solid fa-radiation text-black text-xl"></i>}
          {target.type === 'golden' && <i className="fa-solid fa-star text-white text-xs animate-spin"></i>}
          
          {/* Target Life Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="transparent"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="100 100"
              className="opacity-30"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

const getTargetStyle = (type: string) => {
  switch (type) {
    case 'golden':
      return 'bg-yellow-400 shadow-[0_0_20px_#facc15] border-2 border-white animate-pulse-slow';
    case 'bomb':
      return 'bg-red-600 shadow-[0_0_20px_#dc2626] border-2 border-black';
    case 'phantom':
      return 'bg-purple-500 opacity-50 shadow-[0_0_15px_#a855f7]';
    default:
      return 'bg-cyan-500 shadow-[0_0_15px_#06b6d4] border-2 border-white';
  }
};

export default GameView;

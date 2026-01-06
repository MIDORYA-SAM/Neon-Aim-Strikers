
import React, { useState, useEffect } from 'react';
import { AICoachMessage } from '../types';

interface AICoachOverlayProps {
  message: AICoachMessage | null;
}

const AICoachOverlay: React.FC<AICoachOverlayProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="flex items-center gap-4 bg-black/80 border border-cyan-500/50 p-4 min-w-[320px] backdrop-blur-md">
        <div className="w-10 h-10 rounded-full border border-cyan-500 flex items-center justify-center bg-cyan-900/30 overflow-hidden relative">
           <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>
           <i className="fa-solid fa-robot text-cyan-400 relative z-10"></i>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            Conselheiro Tático IA
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
          </span>
          <p className="text-white text-sm font-medium italic">"{message.text}"</p>
        </div>
      </div>
    </div>
  );
};

export default AICoachOverlay;

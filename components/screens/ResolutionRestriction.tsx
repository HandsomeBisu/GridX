import React from 'react';
import { Maximize, Monitor, MoveDiagonal } from 'lucide-react';

export const ResolutionRestriction: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans z-[9999]">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gold-900/5 animate-pulse-slow pointer-events-none" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #000 100%)' }}/>
      
      <div className="z-10 bg-luxury-panel border border-gold-600/30 p-10 rounded-lg max-w-lg w-full shadow-[0_0_60px_rgba(245,132,26,0.1)] animate-fade-in-up">
        
        <div className="flex justify-center items-center gap-6 mb-8 relative">
            <div className="relative">
                <div className="absolute inset-0 bg-gold-500/20 blur-xl rounded-full animate-pulse" />
                <Monitor size={64} className="text-gray-400 relative z-10" />
                <div className="absolute -top-3 -right-3 bg-gold-500 text-black rounded-full p-1.5 shadow-lg border border-black animate-bounce">
                    <Maximize size={20} />
                </div>
            </div>
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-white mb-3 tracking-wide">
            화면 크기 조정 필요
        </h1>
        <p className="text-gold-600 text-[10px] font-mono font-bold tracking-[0.2em] uppercase mb-8 border-b border-gold-900/50 pb-4 mx-8">
            Please Maximize Your Window
        </p>
        
        <div className="space-y-4 text-gray-400 text-sm leading-relaxed mb-8">
            <p>
                원활한 게임 플레이를 위해<br/>
                브라우저 창을 <span className="text-gold-400 font-bold">최대화</span>하거나 해상도를 높여주세요.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs py-3 bg-black/40 rounded border border-white/5">
                <MoveDiagonal size={14} className="text-gray-500"/>
                <span>최소 권장 해상도: <strong>1200 x 720</strong> 이상</span>
            </div>
            <p className="text-xs text-gray-500">
                창 크기가 조정되면 자동으로 게임 화면으로 전환됩니다.
            </p>
        </div>

        <div className="text-[10px] text-red-900/50 font-mono">
           ERROR: VIEWPORT_TOO_SMALL
        </div>
      </div>
    </div>
  );
};
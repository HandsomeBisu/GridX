import React from 'react';
import { Smartphone, Monitor, AlertTriangle } from 'lucide-react';

export const MobileRestriction: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gold-900/10 animate-pulse-slow pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
      
      <div className="z-10 bg-luxury-panel border border-gold-600/30 p-8 rounded-lg max-w-md w-full shadow-[0_0_50px_rgba(245,132,26,0.15)] animate-fade-in-up">
        
        <div className="flex justify-center items-center gap-6 mb-8 relative">
            <div className="relative opacity-50 grayscale">
                <Smartphone size={48} className="text-gray-500" />
                <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg border border-black">
                    <AlertTriangle size={12} />
                </div>
            </div>
            <div className="w-8 h-px bg-gold-800/50" />
            <div className="relative text-gold-500 animate-pulse">
                <Monitor size={56} />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gold-500 blur-sm" />
            </div>
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-white mb-3 tracking-wide">
            PC 접속 권장
        </h1>
        <p className="text-gold-600 text-[10px] font-mono font-bold tracking-[0.2em] uppercase mb-8 border-b border-gold-900/50 pb-4 mx-8">
            Mobile Not Supported Yet
        </p>
        
        <div className="space-y-4 text-gray-400 text-sm leading-relaxed mb-8">
            <p>
                죄송합니다. 현재 <span className="text-red-400 font-bold">모바일 버전</span>은 지원하지 않습니다.
            </p>
            <p>
                본 게임은 넓은 화면과 정밀한 조작이 필요한<br/>전략 보드게임입니다.
            </p>
            <p className="p-3 bg-gold-900/10 border border-gold-500/20 rounded text-gold-300 text-xs">
                원활한 플레이를 위해<br/>
                <strong>PC (Chrome/Edge)</strong> 환경에서 접속해주세요.
            </p>
        </div>

        <div className="text-[10px] text-gray-700 font-mono">
           SYSTEM: ACCESS_DENIED_MOBILE_DETECTED
        </div>
      </div>
    </div>
  );
};
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-luxury-black text-gray-200 overflow-hidden relative selection:bg-gold-500 selection:text-black font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gold-800/20 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 mix-blend-screen" />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(#D4A52C 1px, transparent 1px), linear-gradient(90deg, #D4A52C 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
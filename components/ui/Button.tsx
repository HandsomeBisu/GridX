import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  icon,
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-serif font-bold tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-b from-gold-300 via-gold-500 to-gold-700 text-black border border-gold-400 shadow-[0_0_15px_rgba(212,165,44,0.3)] hover:shadow-[0_0_25px_rgba(212,165,44,0.6)] hover:brightness-110 active:scale-95",
    secondary: "bg-luxury-panel border border-gold-600 text-gold-400 hover:bg-gold-900/30 hover:text-gold-200 hover:border-gold-300 active:scale-95",
    outline: "bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black active:scale-95",
    ghost: "bg-transparent text-gold-600 hover:text-gold-300 hover:bg-gold-900/20"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs rounded-sm",
    md: "px-8 py-3 text-sm rounded-sm",
    lg: "px-10 py-4 text-base rounded-md",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {/* Shine effect for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
      )}
      
      <span className="relative z-20 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {children}
      </span>
    </button>
  );
};
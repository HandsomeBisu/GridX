import React from 'react';

export const APP_TITLE = "GRIDX";
export const APP_VERSION = "0.1.0 Alpha";

// Reusable SVG Gradients or Patterns can go here
export const GoldGradientText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
  <span className={`bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 via-gold-500 to-red-600 ${className}`}>
    {text}
  </span>
);
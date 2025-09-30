
import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#0D1B2A] flex items-center justify-center z-[100] animate-splash-parent-exit">
      <div className="flex flex-col items-center gap-4 animate-logo-enter">
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Outer rings using theme colors */}
            <div className="absolute inset-0 rounded-full border-2 border-[--color-primary-base]/50 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full border-2 border-[--color-secondary-base]/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            
            {/* New JP Logo */}
            <div className="text-6xl font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-[--color-primary-fg]" style={{ filter: 'drop-shadow(0 0 5px var(--color-primary-glow))' }}>J</span>
                <span className="text-[--color-secondary-fg] relative -left-4" style={{ filter: 'drop-shadow(0 0 5px var(--color-secondary-glow))' }}>P</span>
            </div>
        </div>
        <h1 className="text-3xl font-bold tracking-widest text-gray-200">
          JHOL PIXEL <span className="text-[--color-primary-fg]">1.0</span>
        </h1>
      </div>
    </div>
  );
};
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = true, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={className || (showLabel 
        ? "inline-flex items-center gap-2 px-2.5 h-8 border border-white/15 bg-black hover:border-[#00FF4F] transition-all cursor-pointer font-mono text-[11px] uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F]"
        : "inline-flex items-center justify-center w-8 h-8 border border-white/15 bg-black hover:border-[#00FF4F] transition-all cursor-pointer text-zinc-300 hover:text-[#00FF4F]"
      )}
      title={`Switch to ${isDark ? 'Day' : 'Dark'} mode`}
      aria-label={`Switch to ${isDark ? 'Day' : 'Dark'} mode`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow shrink-0" />
          {showLabel && <span>DAY</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          {showLabel && <span>DARK</span>}
        </>
      )}
    </button>
  );
};

import React, { useState, useEffect } from 'react';
import { Cpu, ArrowUpRight, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-black/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/50' 
        : 'bg-black/60 backdrop-blur-sm border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-18 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <a href="#top" className="flex items-center gap-3 group">
          <div className="w-8 h-8 md:w-9 md:h-9 border border-[#00FF4F]/50 bg-[#00FF4F]/10 flex items-center justify-center transition-all group-hover:border-[#00FF4F] group-hover:bg-[#00FF4F]/20 group-hover:shadow-[0_0_12px_rgba(0,255,79,0.3)]">
            <Cpu className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#00FF4F]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono text-sm md:text-base tracking-wider uppercase text-white font-bold">
                KeplerX
              </span>
              <span className="font-mono text-[10px] md:text-xs px-1.5 py-0.5 bg-[#00FF4F]/15 text-[#00FF4F] border border-[#00FF4F]/40 font-bold">
                x402
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
              Autonomous Execution Gateway
            </span>
          </div>
        </a>

        {/* Clean Professional Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-8" aria-label="Primary Navigation">
          <a href="#about" className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F] transition-colors py-1">
            About
          </a>
          <a href="#protocol" className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F] transition-colors py-1">
            Protocol
          </a>
          <a href="#pipeline" className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F] transition-colors py-1">
            Pipeline
          </a>
          <a href="#telemetry" className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F] transition-colors py-1">
            Verified Runs
          </a>
          <a href="#specs" className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F] transition-colors py-1">
            Specifications
          </a>
          <a href="/docs" className="font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-[#00FF4F] transition-colors py-1">
            Docs
          </a>
        </nav>

        {/* Right Status & Direct Action Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle showLabel={false} />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-zinc-950 font-mono text-[0.68rem] tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#00FF4F] animate-pulse"></span>
            <span className="text-zinc-400">BASE RPC:</span>
            <span className="text-[#00FF4F] font-semibold">ONLINE</span>
          </div>

          {/* Primary Action Button to Launch Console */}
          <a 
            href="/app" 
            className="btn-primary btn-sm flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider"
            title="Launch Autonomous Dispatcher Studio"
          >
            <span>Launch Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile menu toggle */}
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-9 w-9 place-items-center border border-white/20 hover:border-[#00FF4F] lg:hidden transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/15 bg-black/95 px-6 py-6 font-mono text-sm uppercase tracking-wider space-y-3">
          <a 
            href="#about" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-[#00FF4F] border-b border-white/5"
          >
            About
          </a>
          <a 
            href="#protocol" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-[#00FF4F] border-b border-white/5"
          >
            Protocol
          </a>
          <a 
            href="#pipeline" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-[#00FF4F] border-b border-white/5"
          >
            Pipeline
          </a>
          <a 
            href="#telemetry" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-[#00FF4F] border-b border-white/5"
          >
            Verified Runs
          </a>
          <a 
            href="#specs" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-[#00FF4F] border-b border-white/5"
          >
            Specifications
          </a>
          <a 
            href="/docs" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-[#00FF4F] border-b border-white/5"
          >
            Docs
          </a>
          <div className="pt-2">
            <a 
              href="/app" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-1.5"
            >
              <span>Launch Console</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

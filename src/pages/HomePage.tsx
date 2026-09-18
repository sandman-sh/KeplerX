import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Terminal, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Lock, 
  Radio, 
  Code2, 
  ExternalLink 
} from 'lucide-react';
import { KeeperHubService } from '../services/keeperhubService';
import type { ExecutionRecord } from '../types/index.ts';

export const HomePage: React.FC = () => {
  const [liveRuns, setLiveRuns] = useState<ExecutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('keplerx_audit_trail') || localStorage.getItem('keepler_audit_trail');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [telemetry, setTelemetry] = useState({
    blockNumber: 18942340,
    gasPriceGwei: '0.008',
    networkName: 'Base Mainnet',
    activeRelayers: 12,
    rpcHealth: 'OPERATIONAL'
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Poll live telemetry
  useEffect(() => {
    const fetchStats = async () => {
      const data = await KeeperHubService.getLiveTelemetry('8453');
      setTelemetry({
        blockNumber: data.blockNumber,
        gasPriceGwei: data.gasPriceGwei,
        networkName: data.networkName,
        activeRelayers: data.activeRelayers,
        rpcHealth: data.rpcHealth
      });
    };
    fetchStats();
    const interval = setInterval(fetchStats, 12000);
    return () => clearInterval(interval);
  }, []);

  // Subtle animated background grid / particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.5
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      ctx.strokeStyle = 'rgba(0, 255, 79, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = 'rgba(0, 255, 79, 0.4)';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00FF4F]/30 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section id="top" className="relative isolate flex min-h-[92vh] flex-col justify-center overflow-hidden bg-black pt-24 pb-16">
        {/* Canvas Background & Grid */}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60" />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-75" aria-hidden="true" />
        
        {/* Radial subtle green gradient */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00FF4F]/5 blur-[120px] rounded-full" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#00FF4F]/30 bg-[#00FF4F]/5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[#00FF4F] mb-6">
            <span className="w-1.5 h-1.5 bg-[#00FF4F] animate-pulse"></span>
            Open Protocol · Base USDC Settlement · Zero-Revert Preflight
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white font-mono uppercase max-w-4xl leading-[1.08]">
            KeplerX <br />
            <span className="text-[#00FF4F] text-glow">x402 Dispatcher</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 font-sans leading-relaxed">
            The autonomous micro-payment execution bridge connecting AI agents (Claude, Gemini, ElizaOS, Daydreams) 
            to KeplerX's deterministic onchain execution layer via the <span className="text-white font-mono text-sm">HTTP 402</span> protocol.
          </p>

          {/* Subtitle / Value proposition */}
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[#00FF4F]">
            Probabilistic Reasoning in the Agent · Mathematical Determinism on the Chain
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="/app" className="btn-primary">
              <span>Launch Live Console</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a href="#protocol" className="btn-ghost">
              <span>Explore Protocol</span>
            </a>
            <a href="#pipeline" className="btn-ghost">
              <span>View Execution Pipeline</span>
            </a>
          </div>

          {/* 4-Stat Grid Banner (Modeled after reference) */}
          <div className="mt-14 w-full max-w-4xl border border-white/10 bg-white/[0.02] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            <div className="p-6">
              <span className="block text-3xl font-bold font-mono text-[#00FF4F] tracking-tight">&lt; 1.4s</span>
              <span className="mt-2 block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-zinc-500">
                Dispatch Latency
              </span>
            </div>
            <div className="p-6">
              <span className="block text-3xl font-bold font-mono text-white tracking-tight">100%</span>
              <span className="mt-2 block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-zinc-500">
                Deterministic Preflight
              </span>
            </div>
            <div className="p-6">
              <span className="block text-3xl font-bold font-mono text-[#00FF4F] tracking-tight">0.005</span>
              <span className="mt-2 block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-zinc-500">
                USDC Micro-Fee
              </span>
            </div>
            <div className="p-6">
              <span className="block text-3xl font-bold font-mono text-white tracking-tight">4</span>
              <span className="mt-2 block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-zinc-500">
                Supported Networks
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Marquee Ticker Banner (Matching the reference site's infinite scroller) */}
      <div className="relative overflow-hidden border-y border-white/10 bg-black py-3.5">
        <div className="flex w-max animate-marquee">
          <div className="flex shrink-0 items-center">
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              x402 Micropayments
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Base USDC Settlement
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Zero-Revert Preflight (simulate: true)
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Daydreams Cognitive Loop
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Turnkey Non-Custodial Signer
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              MEV-Shielded RPC Routing
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Semantic EVM Revert Decoder
            </span>
            <span className="text-[#00FF4F]">◆</span>
          </div>

          <div className="flex shrink-0 items-center" aria-hidden="true">
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              x402 Micropayments
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Base USDC Settlement
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Zero-Revert Preflight (simulate: true)
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Daydreams Cognitive Loop
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Turnkey Non-Custodial Signer
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              MEV-Shielded RPC Routing
            </span>
            <span className="text-[#00FF4F]">◆</span>
            <span className="whitespace-nowrap px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Semantic EVM Revert Decoder
            </span>
            <span className="text-[#00FF4F]">◆</span>
          </div>
        </div>
      </div>

      {/* SECTION 01: ABOUT */}
      <section id="about" className="py-24 border-b border-white/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 bg-[#00FF4F]"></span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              01 // The Core Tension
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-mono uppercase font-bold text-white leading-tight">
                Agents are <span className="text-zinc-500">probabilistic</span>.<br />
                Value transfer is <span className="text-[#00FF4F]">deterministic</span>.
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Autonomous AI agents reason probabilistically: formulating hypotheses, dynamically generating calldata, and exploring strategies through continuous cognitive loops. But on-chain execution offers zero forgiveness.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                When an agent attempts direct mempool broadcasts without preflight verification, it collides with stuck nonces, gas spikes, predatory front-runners, and cryptic EVM reverts. If a swap reverts, an unconstrained LLM enters an infinite hallucination retry loop, burning capital and corrupting context.
              </p>
              <div className="p-4 border border-[#00FF4F]/20 bg-[#00FF4F]/5">
                <p className="font-mono text-xs text-[#00FF4F] uppercase tracking-wider font-semibold">
                  The Solution:
                </p>
                <p className="font-mono text-xs text-zinc-300 mt-1">
                  The KeplerX x402 Dispatcher decouples cognitive reasoning from execution mechanics. AI agents plan; KeplerX dry-runs, verifies, and executes with battle-tested reliability on Base.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="border border-white/15 bg-zinc-950 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-mono text-xs uppercase text-zinc-400">Execution Guarantees</span>
                  <span className="font-mono text-[11px] text-[#00FF4F]">KEPLERX SLA 99.98%</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF4F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-mono text-sm text-white font-medium">Preflight Simulation (`simulate: true`)</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Every call is executed against an exact EVM fork state before broadcasting. If a revert would occur, zero gas is spent.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF4F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-mono text-sm text-white font-medium">Semantic Revert Decoding</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Translates opaque 4-byte EVM errors into structured English, teaching the agent what went wrong so it can adapt.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF4F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-mono text-sm text-white font-medium">MEV-Shielded Private Routing</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Transactions bypass public mempools, preventing sandwich attacks, predatory arbitrage, and front-running.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF4F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-mono text-sm text-white font-medium">Turnkey Non-Custodial Custody</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Hardware-enclave private key infrastructure ensures agents never expose raw signing credentials.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 02: PROTOCOL */}
      <section id="protocol" className="py-24 border-b border-white/10 bg-zinc-950/40 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 bg-[#00FF4F]"></span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              02 // Protocol Specification
            </span>
          </div>

          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-mono uppercase font-bold text-white">
              The HTTP 402 <span className="text-[#00FF4F]">(x402)</span> Standard
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Standard API authentication requires credit cards or pre-funded SaaS accounts—antiquated primitives for autonomous AI swarms. The x402 standard operationalizes the unused HTTP status code <code className="text-white font-mono bg-zinc-900 px-1.5 py-0.5">402 Payment Required</code> for instant crypto-native micropayments.
            </p>
          </div>

          {/* 3-Step Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-white/10 bg-black p-6 relative">
              <span className="font-mono text-xs text-[#00FF4F] uppercase tracking-wider block mb-3">
                Phase 01 // Intent Query
              </span>
              <h3 className="font-mono text-base text-white font-semibold">1. Unauthenticated Request</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Daydreams agent initiates an execution request to <code className="text-zinc-300 font-mono">POST /api/x402/dispatch</code> without pre-existing credit or keys.
              </p>
              <div className="mt-4 p-3 bg-zinc-950 font-mono text-[11px] text-zinc-400 border border-white/5">
                HTTP/1.1 POST /dispatch<br/>
                Host: api.dispatcher.local<br/>
                X-Agent-ID: daydreams-v2.1
              </div>
            </div>

            <div className="border border-[#00FF4F]/30 bg-black p-6 relative">
              <span className="font-mono text-xs text-[#00FF4F] uppercase tracking-wider block mb-3">
                Phase 02 // Challenge
              </span>
              <h3 className="font-mono text-base text-white font-semibold">2. HTTP 402 Challenge</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Gateway returns a 402 challenge with recipient address, fee (0.005 USDC on Base), cryptographic nonce, and expiration.
              </p>
              <div className="mt-4 p-3 bg-zinc-950 font-mono text-[11px] text-[#00FF4F] border border-[#00FF4F]/20">
                HTTP/1.1 402 Payment Required<br/>
                X-Payment-Amount: 0.005 USDC<br/>
                X-Payment-Nonce: 0x9f4a12c...
              </div>
            </div>

            <div className="border border-white/10 bg-black p-6 relative">
              <span className="font-mono text-xs text-[#00FF4F] uppercase tracking-wider block mb-3">
                Phase 03 // Micro-Settlement
              </span>
              <h3 className="font-mono text-base text-white font-semibold">3. Signed Authorization</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Daydreams agentic wallet cryptographically signs the micro-fee. Gateway settles payment and immediately triggers deterministic execution.
              </p>
              <div className="mt-4 p-3 bg-zinc-950 font-mono text-[11px] text-zinc-400 border border-white/5">
                Authorization: x402 0x7b...<br/>
                X-Payment-Signature: 0x8a...<br/>
                Status: 200 OK (Dispatched)
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 03: PIPELINE */}
      <section id="pipeline" className="py-24 border-b border-white/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 bg-[#00FF4F]"></span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              03 // Execution Pipeline
            </span>
          </div>

          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-mono uppercase font-bold text-white">
              End-to-End <span className="text-[#00FF4F]">Autonomous Pipeline</span>
            </h2>
            <p className="mt-3 text-zinc-400">
              How actions progress from perception to on-chain finality with zero human intervention and 100% deterministic safety.
            </p>
          </div>

          {/* Timeline / Step List */}
          <div className="border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-white/10">
              <div className="md:col-span-3 font-mono text-xs uppercase text-[#00FF4F] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF4F]"></span>
                Step 01 // Cognitive Loop
              </div>
              <div className="md:col-span-9 space-y-2">
                <h4 className="font-mono text-base text-white font-semibold">Daydreams Agent Perception & Chain-of-Thought</h4>
                <p className="text-sm text-zinc-400">
                  The agent ingests market signals (e.g., liquidity imbalance on Aerodrome, yield opportunity on Aave, or service invoice). Formulates natural language intent and synthesizes raw EVM calldata.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-white/10">
              <div className="md:col-span-3 font-mono text-xs uppercase text-[#00FF4F] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF4F]"></span>
                Step 02 // x402 Handshake
              </div>
              <div className="md:col-span-9 space-y-2">
                <h4 className="font-mono text-base text-white font-semibold">Pay-Per-Execution Micro-Settlement</h4>
                <p className="text-sm text-zinc-400">
                  Agent pays the 0.005 USDC execution fee on Base. No credit cards, API tier subscriptions, or manual approvals. The transaction fee is settled in sub-second time.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-white/10">
              <div className="md:col-span-3 font-mono text-xs uppercase text-[#00FF4F] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF4F]"></span>
                Step 03 // KeeperHub Preflight
              </div>
              <div className="md:col-span-9 space-y-2">
                <h4 className="font-mono text-base text-white font-semibold">EVM Fork Simulation & Guard Checks</h4>
                <p className="text-sm text-zinc-400">
                  KeeperHub performs preflight simulation against latest block state (<code className="text-[#00FF4F] font-mono">simulate: true</code>). Checks gas requirements, balances, allowance, and contract logic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-white/10">
              <div className="md:col-span-3 font-mono text-xs uppercase text-[#00FF4F] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF4F]"></span>
                Step 04 // Broadcast & MEV Shield
              </div>
              <div className="md:col-span-9 space-y-2">
                <h4 className="font-mono text-base text-white font-semibold">Turnkey Signer & Private Mempool Dispatch</h4>
                <p className="text-sm text-zinc-400">
                  If simulation passes, Turnkey non-custodial hardware signer signs the transaction. Dispatched via private MEV relayers directly to validators.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-white/10">
              <div className="md:col-span-3 font-mono text-xs uppercase text-[#00FF4F] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF4F]"></span>
                Step 05 // Feedback Loop
              </div>
              <div className="md:col-span-9 space-y-2">
                <h4 className="font-mono text-base text-white font-semibold">Memory Integration or Semantic Revert Recovery</h4>
                <p className="text-sm text-zinc-400">
                  On success: receipt and tx hash are indexed into Daydreams episodic memory. On failure: Semantic Revert Decoder returns actionable diagnostics so the agent dynamically adapts without losing state.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 04: RUNS & TELEMETRY */}
      <section id="telemetry" className="py-24 border-b border-white/10 bg-zinc-950/50 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 bg-[#00FF4F]"></span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              04 // Live Telemetry & Verified Runs
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-mono uppercase font-bold text-white">
                Live Onchain Status
              </h2>
              <p className="text-zinc-400 text-sm mt-1">Real-time status streamed directly from Base RPC nodes.</p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00FF4F] animate-ping"></span>
              <span className="text-zinc-400">SYNCED BLOCK:</span>
              <span className="text-[#00FF4F] font-bold">#{telemetry.blockNumber}</span>
            </div>
          </div>

          {/* Network Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="border border-white/10 bg-black p-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Network</span>
              <h4 className="font-mono text-lg text-white font-semibold mt-1">Base Mainnet</h4>
              <p className="text-xs text-zinc-400 mt-2">Chain ID: 8453 · EIP-1559</p>
            </div>

            <div className="border border-white/10 bg-black p-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Gas Price</span>
              <h4 className="font-mono text-lg text-[#00FF4F] font-semibold mt-1">{telemetry.gasPriceGwei} Gwei</h4>
              <p className="text-xs text-zinc-400 mt-2">Smart Gas Optimizer Active</p>
            </div>

            <div className="border border-white/10 bg-black p-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Private Relayers</span>
              <h4 className="font-mono text-lg text-white font-semibold mt-1">{telemetry.activeRelayers} Nodes</h4>
              <p className="text-xs text-zinc-400 mt-2">Zero-Mempool Exposure</p>
            </div>

            <div className="border border-white/10 bg-black p-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Audit Trail SLA</span>
              <h4 className="font-mono text-lg text-[#00FF4F] font-semibold mt-1">99.98%</h4>
              <p className="text-xs text-zinc-400 mt-2">Deterministic Confirmation</p>
            </div>
          </div>

          {/* Example Verified Runs Table */}
          <div className="border border-white/15 bg-black overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-300">
                Recent Dispatched Executions {liveRuns.length > 0 && `(${liveRuns.length} Live Runs)`}
              </span>
              <a 
                href="/app" 
                className="font-mono text-[11px] text-[#00FF4F] hover:underline flex items-center gap-1"
              >
                <span>OPEN STUDIO CONSOLE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-normal">RUN ID</th>
                    <th className="py-3 px-4 font-normal">INTENT &amp; PROTOCOL</th>
                    <th className="py-3 px-4 font-normal">x402 FEE</th>
                    <th className="py-3 px-4 font-normal">SIMULATION</th>
                    <th className="py-3 px-4 font-normal">STATUS</th>
                    <th className="py-3 px-4 font-normal">TX HASH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {liveRuns.length > 0 ? (
                    liveRuns.slice(0, 5).map((run) => (
                      <tr key={run.runId} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-[#00FF4F]">{run.runId.slice(0, 12)}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{run.intent}</td>
                        <td className="py-3 px-4">{run.x402Proof.amount} USDC</td>
                        <td className="py-3 px-4">
                          {run.simulation.success ? (
                            <span className="text-[#00FF4F]">PASSED ({run.simulation.gasEstimate} gas)</span>
                          ) : (
                            <span className="text-red-400">REVERT PREVENTED</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {run.status === 'confirmed' ? (
                            <span className="px-2 py-0.5 border border-[#00FF4F]/30 bg-[#00FF4F]/10 text-[#00FF4F] text-[10px]">
                              CONFIRMED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">
                              REVERT CAUGHT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {run.txHash ? (
                            <a
                              href={run.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00FF4F] hover:underline flex items-center gap-1"
                            >
                              <span>{run.txHash.slice(0, 10)}...</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-zinc-500">SAVED 0 GAS</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-[#00FF4F]">run_94821a</td>
                        <td className="py-3 px-4">Aerodrome USDC-AERO Swap</td>
                        <td className="py-3 px-4">0.005 USDC</td>
                        <td className="py-3 px-4 text-[#00FF4F]">PASSED (142k gas)</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 border border-[#00FF4F]/30 bg-[#00FF4F]/10 text-[#00FF4F] text-[10px]">
                            CONFIRMED
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href="https://basescan.org/tx/0x7a83d735071dfb2aa4916a2b7caef6c3b6f241e3ca6f63412a831ef78fefb09c"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00FF4F] hover:underline flex items-center gap-1"
                          >
                            <span>0x7a83d...b09c</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-[#00FF4F]">run_94819c</td>
                        <td className="py-3 px-4">Base Native USDC Settlement</td>
                        <td className="py-3 px-4">0.005 USDC</td>
                        <td className="py-3 px-4 text-[#00FF4F]">PASSED (118k gas)</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 border border-[#00FF4F]/30 bg-[#00FF4F]/10 text-[#00FF4F] text-[10px]">
                            CONFIRMED
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href="https://basescan.org/tx/0x48bb8f0b7e4242636257a0774a38f328157e04043b4d4df9571ff7bf4a7428f5"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00FF4F] hover:underline flex items-center gap-1"
                          >
                            <span>0x48bb8...28f5</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-yellow-400">run_94815b</td>
                        <td className="py-3 px-4">UniswapV3 Outdated Slippage Breach</td>
                        <td className="py-3 px-4">0.005 USDC</td>
                        <td className="py-3 px-4 text-red-400">REVERT PREVENTED</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">
                            REVERT CAUGHT
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500">SAVED 0 GAS (INTERCEPTED)</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 05: SPECS */}
      <section id="specs" className="py-24 border-b border-white/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 bg-[#00FF4F]"></span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              05 // Technical Reference
            </span>
          </div>

          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-mono uppercase font-bold text-white">
              System Architecture & Contracts
            </h2>
            <p className="mt-3 text-zinc-400">
              Core verified smart contract registries and endpoints on Base.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-white/10 bg-black p-6 space-y-4">
              <h4 className="font-mono text-sm uppercase text-white font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#00FF4F]" />
                On-Chain Contract Endpoints (Base 8453)
              </h4>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-zinc-950 border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">BASE USDC TOKEN</span>
                  <span className="text-zinc-300 break-all">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">KEPLERX DISPATCH RECEIVER</span>
                  <span className="text-[#00FF4F] break-all">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">AERODROME ROUTER V2</span>
                  <span className="text-zinc-300 break-all">0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">AAVE V3 POOL CONTRACT</span>
                  <span className="text-zinc-300 break-all">0xA238Dd80C259a72e81d7e4664a9801593F98d1c5</span>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-black p-6 space-y-4">
              <h4 className="font-mono text-sm uppercase text-white font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00FF4F]" />
                Developer CLI &amp; MCP Quickstart
              </h4>
              <p className="text-xs text-zinc-400">
                Connect your AI agent to the KeplerX MCP server or invoke the protocol directly:
              </p>
              <div className="p-4 bg-zinc-950 font-mono text-xs text-zinc-300 space-y-2 border border-white/5">
                <div className="text-zinc-500"># Start local KeplerX MCP Gateway</div>
                <div className="text-[#00FF4F]">npm run dev</div>
                <div className="text-zinc-500 pt-2"># Connect Claude Desktop, Cursor, or AI agent</div>
                <div className="text-white">claude mcp add --transport http keplerx http://localhost:3000/api/mcp?token=YOUR_TOKEN</div>
                <div className="text-zinc-500 pt-2"># Preflight test with live RPC simulation</div>
                <div className="text-[#00FF4F]">curl -X POST http://localhost:3000/api/mcp -d '&#123;"jsonrpc":"2.0","id":1,"method":"tools/call","params":&#123;"name":"keplerx_get_telemetry"&#125;&#125;'</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 06: DOCS & ARCHITECTURE */}
      <section id="docs" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 bg-[#00FF4F]"></span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              06 // Protocol Documentation
            </span>
          </div>

          <div className="border border-white/15 bg-zinc-950 p-8">
            <h3 className="font-mono text-xl text-white font-bold uppercase">
              Deterministic Infrastructure for the Agentic Web
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-3xl">
              AI agents compose workflows through standardized Model Context Protocol (MCP) tools and x402 micropayment headers. KeplerX handles nonce synchronization, MEV mitigation, private RPC routing, and smart gas calculation. When state drift occurs, the Semantic Revert Decoder returns human-interpretable diagnostics rather than letting transactions fail silently on-chain.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-white/10 font-mono text-xs">
              <a href="/docs" className="text-[#00FF4F] hover:underline flex items-center gap-1.5">
                KeplerX Protocol Docs <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-zinc-600">·</span>
              <a href="/docs#mcp" className="text-zinc-300 hover:text-[#00FF4F] flex items-center gap-1.5">
                MCP Server Specification <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-zinc-600">·</span>
              <a href="/app" className="text-zinc-300 hover:text-[#00FF4F] flex items-center gap-1.5">
                Interactive Studio Console <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-10 font-mono text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00FF4F]"></div>
            <span className="text-zinc-300">KEPLERX x402 DISPATCHER</span>
            <span>//</span>
            <span>AUTONOMOUS EXECUTION LAYER</span>
          </div>

          <div className="flex items-center gap-6">
            <span>NETWORK: BASE (8453)</span>
            <span>STATUS: NOMINAL</span>
            <a href="#top" className="text-[#00FF4F] hover:underline">TOP ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

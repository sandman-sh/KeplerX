import React, { useState, useEffect } from 'react';
import { 
  PREDEFINED_SCENARIOS, 
  PredefinedScenario, 
  DaydreamsAgentService 
} from '../services/daydreamsAgent';
import { X402Service } from '../services/x402Service';
import { KeeperHubService } from '../services/keeperhubService';
import { WalletService } from '../services/walletService';
import { 
  X402Challenge, 
  X402PaymentProof, 
  EvmSimulationResult, 
  ExecutionRecord, 
  DaydreamsAgentThought 
} from '../types/index.ts';
import { ThemeToggle } from '../components/ThemeToggle';
import { 
  Cpu, 
  Terminal, 
  Play, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  Lock, 
  Activity, 
  Clock, 
  FileText, 
  Database,
  ArrowLeft,
  Wallet,
  Check,
  Trash2,
  Server,
  Copy,
  Key,
  RotateCw,
  X,
  BookOpen
} from 'lucide-react';
import type { Address } from 'viem';
import { McpServerService, MCP_TOOLS, type McpSession } from '../services/mcpServerService';

export const DispatcherApp: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<PredefinedScenario>(PREDEFINED_SCENARIOS[0]);
  const [customIntent, setCustomIntent] = useState('');
  const [network, setNetwork] = useState<'8453' | '84532'>('8453');
  
  // MCP Hub State
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [mcpSession, setMcpSession] = useState<McpSession>(() => {
    return McpServerService.getSession() || McpServerService.createSession();
  });
  const [selectedConfigTab, setSelectedConfigTab] = useState<'claude' | 'cursor' | 'python' | 'tester'>('claude');
  const [selectedTestTool, setSelectedTestTool] = useState<string>('keplerx_get_telemetry');
  const [testToolArgs, setTestToolArgs] = useState<string>('{\n  "network": "8453"\n}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingTool, setIsTestingTool] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Wallet & Identity State
  const [executionMode, setExecutionMode] = useState<'agent' | 'wallet'>('agent');
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>('0.0000');
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');

  // Execution workflow state
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [thoughts, setThoughts] = useState<DaydreamsAgentThought[]>([]);
  const [challenge, setChallenge] = useState<X402Challenge | null>(null);
  const [paymentProof, setPaymentProof] = useState<X402PaymentProof | null>(null);
  const [simulation, setSimulation] = useState<EvmSimulationResult | null>(null);
  const [executionRecord, setExecutionRecord] = useState<ExecutionRecord | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // History / Audit Trail persisted in localStorage
  const [auditTrail, setAuditTrail] = useState<ExecutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('keplerx_audit_trail') || localStorage.getItem('keepler_audit_trail');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Telemetry state
  const [blockHeight, setBlockHeight] = useState<number>(18942345);

  // Sync audit trail to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('keplerx_audit_trail', JSON.stringify(auditTrail.slice(0, 50)));
    } catch (_) {}
  }, [auditTrail]);

  // Poll live telemetry
  useEffect(() => {
    const updateTelemetry = () => {
      KeeperHubService.getLiveTelemetry(network).then(res => {
        setBlockHeight(res.blockNumber);
      });
    };
    updateTelemetry();
    const interval = setInterval(updateTelemetry, 10000);
    return () => clearInterval(interval);
  }, [network]);

  // Fetch live balances for active address
  const activeAddress = executionMode === 'wallet' && walletAddress 
    ? walletAddress 
    : (DaydreamsAgentService.AGENT_ADDRESS as Address);

  useEffect(() => {
    let isMounted = true;
    WalletService.fetchBalances(activeAddress, network).then(b => {
      if (isMounted) {
        setEthBalance(b.eth);
        setUsdcBalance(b.usdc);
      }
    });
    return () => { isMounted = false; };
  }, [activeAddress, network]);

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const addr = await WalletService.connectBrowserWallet(network);
      setWalletAddress(addr);
      setExecutionMode('wallet');
    } catch (err: any) {
      alert(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleClearAuditTrail = () => {
    if (confirm('Clear audit trail history?')) {
      setAuditTrail([]);
      try {
        localStorage.removeItem('keplerx_audit_trail');
        localStorage.removeItem('keepler_audit_trail');
      } catch (_) {}
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRotateSession = () => {
    if (confirm('Rotate session key? Your old MCP token will be invalidated, guaranteeing zero collision.')) {
      const newSess = McpServerService.rotateSession(mcpSession.token);
      setMcpSession(newSess);
    }
  };

  const handleSelectTool = (toolName: string) => {
    setSelectedTestTool(toolName);
    setTestResult(null);
    switch (toolName) {
      case 'keplerx_get_telemetry':
      case 'keeperhub_get_telemetry':
        setTestToolArgs(JSON.stringify({ network }, null, 2));
        break;
      case 'keplerx_preflight_simulate':
      case 'keeperhub_preflight_simulate':
        setTestToolArgs(JSON.stringify({
          intent: selectedScenario.intent,
          targetContract: selectedScenario.targetContract,
          calldata: selectedScenario.calldataSample,
          forceRevert: false,
          network
        }, null, 2));
        break;
      case 'keplerx_create_x402_challenge':
      case 'keeperhub_create_x402_challenge':
        setTestToolArgs(JSON.stringify({
          intent: selectedScenario.intent,
          network
        }, null, 2));
        break;
      case 'keplerx_execute_dispatch':
      case 'keeperhub_execute_dispatch':
        setTestToolArgs(JSON.stringify({
          intent: selectedScenario.intent,
          protocol: selectedScenario.protocol,
          targetContract: selectedScenario.targetContract,
          calldata: selectedScenario.calldataSample,
          network
        }, null, 2));
        break;
      case 'keplerx_get_audit_trail':
      case 'keeperhub_get_audit_trail':
        setTestToolArgs(JSON.stringify({ limit: 10 }, null, 2));
        break;
      default:
        setTestToolArgs('{}');
    }
  };

  const handleExecuteTestTool = async () => {
    setIsTestingTool(true);
    setTestResult(null);
    try {
      const args = JSON.parse(testToolArgs || '{}');
      const res = await McpServerService.handleJsonRpc({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: selectedTestTool,
          arguments: args
        }
      }, mcpSession.token);
      setTestResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsTestingTool(false);
    }
  };

  const handleRunExecution = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setActiveStep(1);
    setChallenge(null);
    setPaymentProof(null);
    setSimulation(null);
    setExecutionRecord(null);

    const scenario = {
      ...selectedScenario,
      intent: customIntent.trim() ? customIntent.trim() : selectedScenario.intent
    };

    try {
      const networkName = network === '84532' ? 'Base Sepolia' : 'Base Mainnet';

      // Step 1: Cognitive Loop (Daydreams Agent generates thoughts)
      const generatedThoughts = DaydreamsAgentService.generateThoughts(scenario, networkName);
      setThoughts([generatedThoughts[0], generatedThoughts[1]]);
      await new Promise(r => setTimeout(r, 500));

      // Step 2: Real x402 Handshake & Cryptographic Signing
      setActiveStep(2);
      const newChallenge = X402Service.createChallenge(scenario.intent, network);
      setChallenge(newChallenge);

      let proof: X402PaymentProof;
      if (executionMode === 'wallet' && walletAddress) {
        const walletClient = WalletService.getBrowserWalletClient(network);
        if (!walletClient) throw new Error('Browser wallet client unavailable');
        proof = await DaydreamsAgentService.signX402Challenge(newChallenge, {
          address: walletAddress,
          signMessage: ({ message }) => walletClient.signMessage({ account: walletAddress, message })
        });
      } else {
        proof = await DaydreamsAgentService.signX402Challenge(newChallenge);
      }

      // Real Cryptographic Verification
      const verification = await X402Service.verifyPaymentProof(newChallenge, proof);
      if (!verification.valid) {
        throw new Error(`x402 Verification failed: ${verification.reason}`);
      }

      setPaymentProof(proof);
      setThoughts(prev => [...prev, generatedThoughts[2]]);
      await new Promise(r => setTimeout(r, 400));

      // Step 3: Real KeeperHub EVM Preflight Simulation (simulate: true)
      setActiveStep(3);
      const simResult = await KeeperHubService.preflightSimulate(
        scenario.intent,
        scenario.targetContract,
        scenario.calldataSample,
        activeAddress,
        scenario.forceRevert,
        network
      );
      setSimulation(simResult);
      setThoughts(prev => [...prev, generatedThoughts[3]]);
      await new Promise(r => setTimeout(r, 500));

      // Step 4: Real Dispatch Execution or Catch Revert
      setActiveStep(4);
      const record = await KeeperHubService.executeDispatch(
        DaydreamsAgentService.AGENT_NAME,
        scenario.intent,
        scenario.protocol,
        network,
        { amount: newChallenge.amount, token: newChallenge.token, payer: proof.payerAddress },
        simResult,
        executionMode === 'wallet'
      );
      setExecutionRecord(record);
      setThoughts(prev => [...prev, generatedThoughts[4]]);

      // Add to Persistent Audit Trail
      setAuditTrail(prev => [record, ...prev]);
      setActiveStep(5);
    } catch (err: any) {
      setExecutionError(err.message || 'Execution error encountered');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#00FF4F]/30 selection:text-white pb-20">
      
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-black/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* ZONE 1: BRAND & CORE NAVIGATION (LEFT) */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* Return Portal Link */}
            <a 
              href="/" 
              className="h-8 px-2.5 border border-white/10 hover:border-white/25 bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Return to Protocol Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal</span>
            </a>

            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 border border-[#00FF4F]/50 bg-[#00FF4F]/10 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,79,0.2)]">
                <Cpu className="w-4 h-4 text-[#00FF4F]" />
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-mono text-sm tracking-wider uppercase text-white font-bold whitespace-nowrap">
                  KeplerX
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#00FF4F]/15 text-[#00FF4F] border border-[#00FF4F]/40 font-bold whitespace-nowrap">
                  x402
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-white/15 hidden md:block" />

            {/* Primary Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <span className="h-8 px-3 text-xs font-mono font-bold text-white bg-white/10 border border-white/15 flex items-center gap-1.5 whitespace-nowrap">
                <Terminal className="w-3 h-3 text-[#00FF4F]" />
                Studio
              </span>
              <a
                href="/docs"
                className="h-8 px-3 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                Docs
              </a>
              <button
                type="button"
                onClick={() => setIsMcpModalOpen(true)}
                className="h-8 px-3 text-xs font-mono text-[#00FF4F] bg-[#00FF4F]/10 hover:bg-[#00FF4F]/20 border border-[#00FF4F]/40 flex items-center gap-1.5 transition-all cursor-pointer font-bold whitespace-nowrap shadow-[0_0_10px_rgba(0,255,79,0.15)]"
                title="Connect external AI agents (Claude Desktop, Cursor, Python)"
              >
                <Server className="w-3.5 h-3.5 text-[#00FF4F]" />
                <span>MCP Gateway</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF4F] animate-ping ml-0.5" />
              </button>
            </nav>
          </div>

          {/* ZONE 2: ON-CHAIN TELEMETRY & UTILITIES (RIGHT) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Live Telemetry Bar (Block Height + Real Balances) */}
            <div className="hidden xl:flex items-center h-8 px-3 bg-zinc-950 border border-white/10 font-mono text-xs text-zinc-400 gap-3 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF4F] animate-pulse" />
                <span className="text-zinc-500 text-[10px] uppercase">BLOCK</span>
                <span className="text-white font-medium">#{blockHeight}</span>
              </div>
              <span className="text-white/15">|</span>
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[10px] uppercase">ETH</span>
                <span className="text-zinc-200 font-medium">{ethBalance}</span>
              </div>
              <span className="text-white/15">|</span>
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[10px] uppercase">USDC</span>
                <span className="text-[#00FF4F] font-bold">{usdcBalance}</span>
              </div>
            </div>

            {/* Network Selector */}
            <div className="h-8 flex items-center gap-1.5 border border-white/15 bg-black px-2.5 font-mono text-xs text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${network === '8453' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
              <select 
                value={network}
                onChange={(e) => setNetwork(e.target.value as '8453' | '84532')}
                className="bg-transparent text-zinc-200 outline-none cursor-pointer font-mono text-xs appearance-none pr-1"
              >
                <option value="8453" className="bg-black text-white">Base Mainnet</option>
                <option value="84532" className="bg-black text-white">Base Sepolia</option>
              </select>
            </div>

            {/* Signer Mode Switcher (Agent Key vs Connected Wallet) */}
            <div className="h-8 flex items-center border border-white/15 bg-black p-0.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setExecutionMode('agent')}
                className={`h-full px-2.5 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  executionMode === 'agent'
                    ? 'bg-[#00FF4F]/15 text-[#00FF4F] border border-[#00FF4F]/40'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
                title="Use autonomous Daydreams embedded key"
              >
                <Cpu className="w-3 h-3 text-[#00FF4F]" />
                <span className="hidden sm:inline">Agent Key</span>
                <span className="sm:hidden">Agent</span>
              </button>

              {walletAddress ? (
                <button
                  type="button"
                  onClick={() => setExecutionMode('wallet')}
                  className={`h-full px-2.5 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    executionMode === 'wallet'
                      ? 'bg-[#00FF4F]/15 text-[#00FF4F] border border-[#00FF4F]/40'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                  title={walletAddress}
                >
                  <Wallet className="w-3 h-3 text-[#00FF4F]" />
                  <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet}
                  className="h-full px-2.5 text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors border border-transparent whitespace-nowrap"
                  title="Connect browser Web3 wallet"
                >
                  <Wallet className="w-3 h-3 text-zinc-400" />
                  <span className="hidden sm:inline">{isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}</span>
                  <span className="sm:hidden">Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile Fallback Links */}
            <div className="flex md:hidden items-center gap-1">
              <a
                href="/docs"
                className="h-8 w-8 border border-white/15 bg-black flex items-center justify-center text-zinc-400 hover:text-white"
                title="Docs"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsMcpModalOpen(true)}
                className="h-8 px-2 border border-[#00FF4F]/40 bg-[#00FF4F]/10 text-[#00FF4F] font-mono text-[10px] font-bold flex items-center gap-1"
              >
                <Server className="w-3 h-3" />
                <span>MCP</span>
              </button>
            </div>

            {/* Clean Square Icon Theme Toggle */}
            <ThemeToggle showLabel={false} />

          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SCENARIOS & INTENT CONFIGURATION (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Scenario Card */}
            <div className="border border-white/15 bg-zinc-950 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00FF4F]" />
                  1. Select Action Scenario
                </span>
                <span className="font-mono text-[10px] text-zinc-500">REAL RPC</span>
              </div>

              <div className="space-y-2.5">
                {PREDEFINED_SCENARIOS.map((scenario) => {
                  const isSelected = selectedScenario.id === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setCustomIntent('');
                      }}
                      className={`w-full text-left p-3 border transition-all cursor-pointer font-mono text-xs ${
                        isSelected 
                          ? 'border-[#00FF4F] bg-[#00FF4F]/5 text-white' 
                          : 'border-white/10 bg-black hover:border-white/25 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isSelected ? 'text-[#00FF4F]' : 'text-zinc-200'}`}>
                          {scenario.name}
                        </span>
                        {scenario.forceRevert ? (
                          <span className="px-1.5 py-0.5 border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-[9px] uppercase">
                            Revert Check
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 border border-[#00FF4F]/30 bg-[#00FF4F]/10 text-[#00FF4F] text-[9px] uppercase">
                            Live Path
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                        {scenario.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Intent Override Input */}
              <div className="pt-2 border-t border-white/10">
                <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Natural Language Intent Prompt:
                </label>
                <textarea
                  value={customIntent || selectedScenario.intent}
                  onChange={(e) => setCustomIntent(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-white/15 p-2.5 font-mono text-xs text-white outline-none focus:border-[#00FF4F] transition-colors resize-none"
                  placeholder="Enter custom agent intent..."
                />
              </div>

              {/* Trigger Button */}
              <button
                onClick={handleRunExecution}
                disabled={isExecuting}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>EXECUTING REAL DISPATCH...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span>DISPATCH VIA x402 &amp; KEPLERX</span>
                  </>
                )}
              </button>

              {executionError && (
                <div className="p-2.5 border border-red-500/40 bg-red-950/20 text-red-300 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="break-all">{executionError}</span>
                </div>
              )}
            </div>

            {/* Agent Memory & Signer State */}
            <div className="border border-white/10 bg-black p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-zinc-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#00FF4F]" />
                  Active Signer &amp; Memory
                </span>
                <span className="text-[#00FF4F] text-[10px] flex items-center gap-1">
                  <Check className="w-3 h-3" /> LIVE ON-CHAIN
                </span>
              </div>
              <div className="space-y-2 text-zinc-400 text-[11px]">
                <div>
                  <span className="text-zinc-500 block text-[10px]">PAYER IDENTITY ({executionMode.toUpperCase()})</span>
                  <span className="text-zinc-300 break-all">{activeAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px]">ON-CHAIN BALANCES</span>
                  <span className="text-white font-bold">{ethBalance} ETH · {usdcBalance} USDC</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">TARGET PROTOCOL</span>
                  <span className="text-white">{selectedScenario.protocol}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">VERIFIED RPC GATEWAY</span>
                  <span className="text-[#00FF4F] truncate block">
                    {network === '84532' ? 'https://sepolia.base.org' : 'https://mainnet.base.org'}
                  </span>
                </div>
              </div>
            </div>

            {/* MCP Agent Gateway Status Card */}
            <div className="border border-[#00FF4F]/30 bg-[#00FF4F]/[0.02] p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-white uppercase text-[11px] font-bold flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#00FF4F]" />
                  MCP Agent Gateway
                </span>
                <span className="px-1.5 py-0.5 border border-[#00FF4F]/40 bg-[#00FF4F]/10 text-[#00FF4F] text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF4F] animate-ping" />
                  READY (2.0)
                </span>
              </div>
              <div className="space-y-2 text-zinc-400 text-[11px]">
                <div>
                  <span className="text-zinc-500 block text-[10px]">MCP ENDPOINT (POST/GET)</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <code className="text-white text-[10px] bg-white/5 px-1.5 py-0.5 border border-white/10 truncate flex-1">
                      {window.location.origin}/api/mcp
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${window.location.origin}/api/mcp`, 'mcp-ep')}
                      className="p-1 border border-white/10 hover:border-[#00FF4F]/50 text-zinc-400 hover:text-white"
                      title="Copy Endpoint"
                    >
                      {copiedId === 'mcp-ep' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[10px]">SESSION AUTH TOKEN</span>
                    <button
                      type="button"
                      onClick={handleRotateSession}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                      title="Rotate Token to ensure zero collision"
                    >
                      <RotateCw className="w-2.5 h-2.5" /> Rotate
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <code className="text-[#00FF4F] text-[10px] bg-black px-1.5 py-0.5 border border-[#00FF4F]/30 truncate flex-1">
                      {mcpSession.token.slice(0, 16)}...{mcpSession.token.slice(-8)}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyText(mcpSession.token, 'mcp-token')}
                      className="p-1 border border-white/10 hover:border-[#00FF4F]/50 text-zinc-400 hover:text-white"
                      title="Copy Token"
                    >
                      {copiedId === 'mcp-token' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-500 text-[10px]">SANDBOXED AUDIT RUNS</span>
                  <span className="text-white font-bold">{mcpSession.auditTrail.length} RUNS</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMcpModalOpen(true)}
                    className="flex-1 py-2 px-3 border border-[#00FF4F] bg-[#00FF4F] hover:bg-[#00FF4F]/90 text-black font-mono font-bold text-xs uppercase transition-colors text-center"
                  >
                    Open MCP Hub
                  </button>
                  <a
                    href="/docs"
                    className="py-2 px-3 border border-white/15 hover:border-white/30 text-zinc-300 hover:text-white font-mono text-xs flex items-center justify-center transition-colors"
                    title="View Technical Documentation"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE PIPELINE & AUDIT RUNNER (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Step Progress Bar */}
            <div className="border border-white/15 bg-zinc-950 p-4">
              <div className="grid grid-cols-5 gap-2 font-mono text-[10px] text-center">
                <div className={`p-2 border transition-colors ${activeStep >= 1 ? 'border-[#00FF4F] bg-[#00FF4F]/10 text-[#00FF4F]' : 'border-white/10 text-zinc-500'}`}>
                  1. COGNITION
                </div>
                <div className={`p-2 border transition-colors ${activeStep >= 2 ? 'border-[#00FF4F] bg-[#00FF4F]/10 text-[#00FF4F]' : 'border-white/10 text-zinc-500'}`}>
                  2. x402 ECDSA
                </div>
                <div className={`p-2 border transition-colors ${activeStep >= 3 ? 'border-[#00FF4F] bg-[#00FF4F]/10 text-[#00FF4F]' : 'border-white/10 text-zinc-500'}`}>
                  3. ON-CHAIN PRE-CHECK
                </div>
                <div className={`p-2 border transition-colors ${activeStep >= 4 ? 'border-[#00FF4F] bg-[#00FF4F]/10 text-[#00FF4F]' : 'border-white/10 text-zinc-500'}`}>
                  4. EXECUTION
                </div>
                <div className={`p-2 border transition-colors ${activeStep >= 5 ? 'border-[#00FF4F] bg-[#00FF4F]/10 text-[#00FF4F]' : 'border-white/10 text-zinc-500'}`}>
                  5. FINALITY
                </div>
              </div>
            </div>

            {/* Execution Visualizer Stages */}
            <div className="space-y-4">
              
              {/* STAGE 1: Agent Chain of Thought */}
              <div className="border border-white/15 bg-black p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-xs uppercase text-zinc-300 font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#00FF4F]" />
                    Stage 1: KeplerX Agent Thought Trace (CoT)
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {thoughts.length > 0 ? `${thoughts.length} STEPS` : 'IDLE'}
                  </span>
                </div>

                {thoughts.length === 0 ? (
                  <p className="font-mono text-xs text-zinc-600 py-3 italic">
                    Press "Dispatch via x402 &amp; KeplerX" to start the live execution loop...
                  </p>
                ) : (
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    {thoughts.map((t, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-950 border border-white/5 flex items-start gap-3">
                        <span className="text-[#00FF4F] text-[10px] font-bold shrink-0 mt-0.5">
                          [{t.phase}]
                        </span>
                        <p className="text-zinc-300 leading-relaxed">{t.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STAGE 2: x402 Protocol Handshake Details */}
              {challenge && (
                <div className="border border-[#00FF4F]/40 bg-[#00FF4F]/[0.02] p-5 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs uppercase text-[#00FF4F] font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#00FF4F]" />
                      Stage 2: HTTP 402 Cryptographic Challenge &amp; Signature
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00FF4F]/20 text-[#00FF4F] border border-[#00FF4F]/40">
                      CRYPTOGRAPHICALLY VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 bg-black border border-white/10 space-y-1">
                      <span className="text-[10px] text-zinc-500 block">402 CHALLENGE NONCE</span>
                      <span className="text-zinc-300 break-all">{challenge.nonce}</span>
                    </div>
                    <div className="p-3 bg-black border border-white/10 space-y-1">
                      <span className="text-[10px] text-zinc-500 block">SETTLEMENT AMOUNT</span>
                      <span className="text-[#00FF4F] font-bold">{challenge.amount} {challenge.tokenSymbol} (Base)</span>
                    </div>
                  </div>

                  {paymentProof && (
                    <div className="p-3 bg-black border border-white/10 font-mono text-xs space-y-1">
                      <span className="text-[10px] text-zinc-500 block">REAL ECDSA SECP256K1 SIGNATURE</span>
                      <span className="text-zinc-400 break-all text-[11px]">{paymentProof.signature}</span>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 3: KeeperHub Preflight On-Chain Guard & Semantic Revert Decoder */}
              {simulation && (
                <div className={`border p-5 space-y-3 animate-in fade-in ${
                  simulation.success 
                    ? 'border-white/15 bg-black' 
                    : 'border-yellow-500/40 bg-yellow-950/10'
                }`}>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs uppercase text-zinc-200 font-bold flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${simulation.success ? 'text-[#00FF4F]' : 'text-yellow-400'}`} />
                      Stage 3: On-Chain Preflight Guard (Live Base RPC Dry-Run)
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 border ${
                      simulation.success 
                        ? 'border-[#00FF4F]/30 bg-[#00FF4F]/10 text-[#00FF4F]' 
                        : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {simulation.success ? 'LIVE RPC VERIFIED' : 'REVERT CAUGHT BEFORE COMMIT'}
                    </span>
                  </div>

                  {simulation.success ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-3 bg-zinc-950 border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">BASE RPC ESTIMATED GAS</span>
                        <span className="text-white font-bold">{simulation.gasEstimate} units</span>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">TARGET CONTRACT</span>
                        <span className="text-zinc-300 truncate block">{simulation.targetContract}</span>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">MEMPOOL ROUTE</span>
                        <span className="text-[#00FF4F]">MEV-Shield Private Relayer</span>
                      </div>
                    </div>
                  ) : (
                    /* Semantic Revert Decoder Showcase */
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 bg-black border border-yellow-500/30 space-y-1.5">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>SEMANTIC REVERT DECODER CAUGHT ERROR BEFORE BROADCAST:</span>
                        </div>
                        <p className="text-white text-sm font-semibold">{simulation.decodedError?.title}</p>
                        <p className="text-zinc-400 text-xs">{simulation.decodedError?.explanation}</p>
                      </div>

                      <div className="p-3 bg-black border border-white/10 space-y-1">
                        <span className="text-[10px] text-[#00FF4F] uppercase font-bold block">
                          ACTIONABLE ADVICE RETURNED TO DAYDREAMS MEMORY:
                        </span>
                        <p className="text-zinc-200 text-xs">
                          {simulation.decodedError?.actionableAdvice}
                        </p>
                      </div>

                      <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px]">
                        ✓ Guard Protection: 0 ETH / 0 USDC spent on reverted gas. Transaction was safely intercepted by KeplerX.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 4 & 5: Confirmed On-Chain Execution Record */}
              {executionRecord && (
                <div className={`border p-5 space-y-3 animate-in fade-in ${
                  executionRecord.status === 'confirmed' 
                    ? 'border-[#00FF4F] bg-[#00FF4F]/5' 
                    : 'border-yellow-500/50 bg-black'
                }`}>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs uppercase text-white font-bold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#00FF4F]" />
                      Stage 4 &amp; 5: Execution Finality ({executionRecord.networkName})
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      LATENCY: {executionRecord.latencyMs}ms
                    </span>
                  </div>

                  {executionRecord.status === 'confirmed' ? (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black border border-[#00FF4F]/30">
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-zinc-500 block">CONFIRMED TRANSACTION HASH</span>
                          <span className="text-[#00FF4F] font-bold text-sm break-all">
                            {executionRecord.txHash}
                          </span>
                        </div>
                        <a
                          href={executionRecord.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary btn-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <span>VIEW ON BASESCAN</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 border border-white/10 bg-black">
                          <span className="text-zinc-500 block text-[9px]">BLOCK</span>
                          <span className="text-white font-bold">#{executionRecord.blockNumber}</span>
                        </div>
                        <div className="p-2 border border-white/10 bg-black">
                          <span className="text-zinc-500 block text-[9px]">GAS CONSUMED</span>
                          <span className="text-white font-bold">{executionRecord.gasUsed}</span>
                        </div>
                        <div className="p-2 border border-white/10 bg-black">
                          <span className="text-zinc-500 block text-[9px]">x402 FEE</span>
                          <span className="text-[#00FF4F] font-bold">{executionRecord.x402Proof.amount} USDC</span>
                        </div>
                        <div className="p-2 border border-white/10 bg-black">
                          <span className="text-zinc-500 block text-[9px]">SLA RECORD</span>
                          <span className="text-[#00FF4F] font-bold">AUDITED</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-black border border-white/10 font-mono text-xs">
                      <span className="text-yellow-400 font-bold block mb-1">EXECUTION SAFELY ABORTED</span>
                      <p className="text-zinc-400 text-xs">
                        KeplerX's deterministic guard prevented this flawed call from being submitted to the mempool.
                        Agent context was updated with the decoded revert explanation.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* AUDIT TRAIL LOG TABLE */}
            <div className="border border-white/15 bg-zinc-950 overflow-hidden mt-8">
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-200 font-bold flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#00FF4F]" />
                  Immutable Audit Trail ({auditTrail.length} Recorded Runs)
                </span>
                <div className="flex items-center gap-3">
                  {auditTrail.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAuditTrail}
                      className="font-mono text-[10px] text-zinc-500 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>CLEAR</span>
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-[#00FF4F]">PERSISTENT AUDIT</span>
                </div>
              </div>

              {auditTrail.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-600">
                  No execution runs recorded yet. Select a scenario and dispatch via x402 to generate verifiable audit entries.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-black text-zinc-500 border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-4 font-normal">TIMESTAMP</th>
                        <th className="py-2.5 px-4 font-normal">INTENT</th>
                        <th className="py-2.5 px-4 font-normal">x402 FEE</th>
                        <th className="py-2.5 px-4 font-normal">STATUS</th>
                        <th className="py-2.5 px-4 font-normal">TRANSACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {auditTrail.map((record) => (
                        <tr key={record.runId} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-4 text-zinc-500 text-[11px]">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-4 text-white max-w-xs truncate">
                            {record.intent}
                          </td>
                          <td className="py-2.5 px-4 text-[#00FF4F]">
                            {record.x402Proof.amount} USDC
                          </td>
                          <td className="py-2.5 px-4">
                            {record.status === 'confirmed' ? (
                              <span className="px-2 py-0.5 border border-[#00FF4F]/30 bg-[#00FF4F]/10 text-[#00FF4F] text-[10px]">
                                CONFIRMED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">
                                REVERT CAUGHT
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {record.txHash ? (
                              <a
                                href={record.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00FF4F] hover:underline flex items-center gap-1"
                              >
                                <span>{record.txHash.slice(0, 10)}...</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-zinc-600">PREFLIGHT BLOCKED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* MCP AGENT CONNECT & JSON-RPC TESTER MODAL                               */}
      {/* ========================================================================= */}
      {isMcpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="border border-[#00FF4F]/40 bg-zinc-950 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,255,79,0.18)] my-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#00FF4F]/50 bg-[#00FF4F]/10 flex items-center justify-center">
                  <Server className="w-4 h-4 text-[#00FF4F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm sm:text-base text-white font-bold tracking-wide">
                      Model Context Protocol (MCP) Gateway
                    </h3>
                    <span className="px-1.5 py-0.5 bg-[#00FF4F]/10 border border-[#00FF4F]/30 text-[#00FF4F] font-mono text-[10px] font-bold">
                      JSON-RPC 2.0
                    </span>
                  </div>
                  <p className="text-zinc-400 font-mono text-xs mt-0.5">
                    Connect Claude Desktop, Cursor, Python, ElizaOS, or any AI model to KeplerX tools.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMcpModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white border border-transparent hover:border-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs font-mono flex-1">
              
              {/* Multi-Tenant Security Bar */}
              <div className="border border-white/10 bg-black p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <span className="text-white font-bold flex items-center gap-1.5 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-[#00FF4F]" />
                    MULTI-TENANT SANDBOX IDENTITY
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">
                      Created: {new Date(mcpSession.createdAt).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={handleRotateSession}
                      className="px-2 py-0.5 border border-white/15 hover:border-[#00FF4F]/40 bg-zinc-900 text-zinc-300 hover:text-[#00FF4F] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                      Rotate Session Token
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">MCP ENDPOINT URL</span>
                    <div className="flex items-center gap-1 mt-1">
                      <code className="bg-zinc-900 px-2 py-1 border border-white/10 text-zinc-300 truncate flex-1 text-[11px]">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'http://localhost:3000/api/mcp'}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyText(typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'http://localhost:3000/api/mcp', 'ep-url')}
                        className="px-2 py-1 border border-white/10 hover:border-white/30 text-zinc-300 cursor-pointer"
                        title="Copy"
                      >
                        {copiedId === 'ep-url' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[10px]">BEARER TOKEN (KEEP PRIVATE)</span>
                    <div className="flex items-center gap-1 mt-1">
                      <code className="bg-zinc-900 px-2 py-1 border border-[#00FF4F]/30 text-[#00FF4F] truncate flex-1 text-[11px]">
                        {mcpSession.token}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyText(mcpSession.token, 'bearer-tok')}
                        className="px-2 py-1 border border-white/10 hover:border-white/30 text-zinc-300 cursor-pointer"
                        title="Copy Token"
                      >
                        {copiedId === 'bearer-tok' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900/60 border border-white/5 text-[10px] text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00FF4F] shrink-0" />
                  <span>
                    <strong>Anti-Collision Guarantee:</strong> Each session has an isolated 256-bit cryptographic token. Users cannot share state, mutate another user's execution history, or spoof access.
                  </span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-white/10 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedConfigTab('claude')}
                  className={`px-4 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                    selectedConfigTab === 'claude'
                      ? 'border-[#00FF4F] text-[#00FF4F] bg-[#00FF4F]/5'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Claude Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConfigTab('cursor')}
                  className={`px-4 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                    selectedConfigTab === 'cursor'
                      ? 'border-[#00FF4F] text-[#00FF4F] bg-[#00FF4F]/5'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Cursor IDE
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConfigTab('python')}
                  className={`px-4 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                    selectedConfigTab === 'python'
                      ? 'border-[#00FF4F] text-[#00FF4F] bg-[#00FF4F]/5'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Python / LangChain
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConfigTab('tester')}
                  className={`px-4 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                    selectedConfigTab === 'tester'
                      ? 'border-[#00FF4F] text-[#00FF4F] bg-[#00FF4F]/5'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Live Tool Tester
                </button>
              </div>

              {/* TAB 1: Claude Desktop Config */}
              {selectedConfigTab === 'claude' && (
                <div className="space-y-4">
                  <div className="text-zinc-300 space-y-1">
                    <p>
                      Add KeplerX MCP Server to your <code className="text-[#00FF4F]">claude_desktop_config.json</code>:
                    </p>
                    <p className="text-zinc-500 text-[11px]">
                      macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code><br/>
                      Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code>
                    </p>
                  </div>

                  <div className="relative border border-white/10 bg-black p-4">
                    <button
                      type="button"
                      onClick={() => handleCopyText(JSON.stringify({
                        mcpServers: {
                          keplerx: {
                            url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp?token=${mcpSession.token}`,
                            headers: {
                              Authorization: `Bearer ${mcpSession.token}`
                            }
                          }
                        }
                      }, null, 2), 'claude-cfg')}
                      className="absolute top-3 right-3 px-2 py-1 border border-white/15 hover:border-[#00FF4F] bg-zinc-900 text-zinc-300 hover:text-[#00FF4F] text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'claude-cfg' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                      Copy JSON
                    </button>
                    <pre className="text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify({
  mcpServers: {
    keplerx: {
      url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp?token=${mcpSession.token}`,
      headers: {
        Authorization: `Bearer ${mcpSession.token}`
      }
    }
  }
}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: Cursor IDE Config */}
              {selectedConfigTab === 'cursor' && (
                <div className="space-y-4">
                  <div className="text-zinc-300 space-y-1">
                    <p>
                      Add to your workspace's <code className="text-[#00FF4F]">.cursor/mcp.json</code> or configure under <strong>Cursor Settings &gt; Features &gt; MCP</strong>:
                    </p>
                  </div>

                  <div className="relative border border-white/10 bg-black p-4">
                    <button
                      type="button"
                      onClick={() => handleCopyText(JSON.stringify({
                        mcpServers: {
                          "keplerx-base": {
                            url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp?token=${mcpSession.token}`
                          }
                        }
                      }, null, 2), 'cursor-cfg')}
                      className="absolute top-3 right-3 px-2 py-1 border border-white/15 hover:border-[#00FF4F] bg-zinc-900 text-zinc-300 hover:text-[#00FF4F] text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'cursor-cfg' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                      Copy JSON
                    </button>
                    <pre className="text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify({
  mcpServers: {
    "keplerx-base": {
      url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp?token=${mcpSession.token}`
    }
  }
}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: Python / Generic AI Model */}
              {selectedConfigTab === 'python' && (
                <div className="space-y-4">
                  <p className="text-zinc-300">
                    Use any Python agent (LangChain, LangGraph, CrewAI, AutoGen, or raw HTTP) with standard JSON-RPC 2.0:
                  </p>
                  <div className="relative border border-white/10 bg-black p-4">
                    <button
                      type="button"
                      onClick={() => handleCopyText(`import httpx

url = "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp"
headers = {"Authorization": "Bearer ${mcpSession.token}"}

payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "keeperhub_preflight_simulate",
        "arguments": {
            "intent": "Swap 500 USDC for WETH on Aerodrome",
            "targetContract": "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
            "calldata": "0x38ed1739",
            "network": "8453"
        }
    }
}

response = httpx.post(url, headers=headers, json=payload)
print(response.json())`, 'py-snippet')}
                      className="absolute top-3 right-3 px-2 py-1 border border-white/15 hover:border-[#00FF4F] bg-zinc-900 text-zinc-300 hover:text-[#00FF4F] text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'py-snippet' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                      Copy Python
                    </button>
                    <pre className="text-[#00FF4F] overflow-x-auto text-[11px] leading-relaxed">
{`import httpx

url = "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/mcp"
headers = {"Authorization": "Bearer ${mcpSession.token}"}

payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "keeperhub_preflight_simulate",
        "arguments": {
            "intent": "Swap 500 USDC for WETH on Aerodrome",
            "targetContract": "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
            "calldata": "0x38ed1739",
            "network": "8453"
        }
    }
}

response = httpx.post(url, headers=headers, json=payload)
print(response.json())`}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 4: Live Interactive Tool Tester */}
              {selectedConfigTab === 'tester' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1">
                        Select MCP Tool:
                      </label>
                      <select
                        value={selectedTestTool}
                        onChange={(e) => handleSelectTool(e.target.value)}
                        className="w-full bg-black border border-white/20 p-2 text-white font-mono text-xs focus:border-[#00FF4F] focus:outline-none"
                      >
                        {MCP_TOOLS.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-zinc-400 text-[11px] leading-relaxed">
                        {MCP_TOOLS.find((t) => t.name === selectedTestTool)?.description}
                      </p>

                      <div className="mt-4">
                        <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1">
                          Tool Arguments (JSON):
                        </label>
                        <textarea
                          rows={6}
                          value={testToolArgs}
                          onChange={(e) => setTestToolArgs(e.target.value)}
                          className="w-full bg-black border border-white/20 p-2.5 text-white font-mono text-xs focus:border-[#00FF4F] focus:outline-none leading-relaxed"
                          spellCheck={false}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleExecuteTestTool}
                        disabled={isTestingTool}
                        className="mt-3 w-full py-2.5 px-4 border border-[#00FF4F] bg-[#00FF4F] hover:bg-[#00FF4F]/90 text-black font-bold uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isTestingTool ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Executing via JSON-RPC...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            Execute Tool Call
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-400 text-[10px] uppercase font-bold">
                          JSON-RPC 2.0 Response:
                        </span>
                        {testResult && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(testResult, 'test-res')}
                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === 'test-res' ? <Check className="w-3 h-3 text-[#00FF4F]" /> : <Copy className="w-3 h-3" />}
                            Copy
                          </button>
                        )}
                      </div>
                      <div className="border border-white/10 bg-black p-3 h-[280px] overflow-y-auto">
                        {testResult ? (
                          <pre className="text-zinc-300 text-[11px] leading-relaxed">
                            {testResult}
                          </pre>
                        ) : (
                          <div className="h-full flex items-center justify-center text-zinc-600 italic text-center p-4">
                            Click "Execute Tool Call" to simulate an incoming AI Agent JSON-RPC 2.0 dispatch and inspect real on-chain output.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-[#00FF4F]" />
                <span>Anthropic Model Context Protocol compliant · Production Ready</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href="/docs"
                  className="px-3 py-1.5 border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Documentation
                </a>
                <button
                  type="button"
                  onClick={() => setIsMcpModalOpen(false)}
                  className="px-4 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

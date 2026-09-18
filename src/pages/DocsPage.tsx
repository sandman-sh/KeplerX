import React, { useState } from 'react';
import { 
  Cpu, 
  ArrowLeft, 
  ArrowUpRight, 
  Terminal, 
  ShieldCheck, 
  Lock, 
  Code2, 
  Check, 
  Copy, 
  Layers, 
  BookOpen, 
  ExternalLink,
  Zap,
  Server,
  Key
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sections = [
    { id: 'intro', title: '1. Overview & Core Architecture' },
    { id: 'mcp', title: '2. Model Context Protocol (MCP)' },
    { id: 'security', title: '3. Multi-Tenant Security & Isolation' },
    { id: 'preflight', title: '4. EVM Preflight Simulation' },
    { id: 'contracts', title: '5. Verified Smart Contracts' },
    { id: 'tools-ref', title: '6. Tool Schema & API Reference' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#00FF4F]/30 selection:text-white pb-24">
      
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-black/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 hover:border-[#00FF4F]/50 bg-black text-zinc-400 hover:text-[#00FF4F] font-mono text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal</span>
            </a>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#00FF4F]/50 bg-[#00FF4F]/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#00FF4F]" />
              </div>
              <div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="font-mono text-sm tracking-wider uppercase text-white font-bold">
                    KeplerX Docs
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#00FF4F]/15 text-[#00FF4F] border border-[#00FF4F]/40 font-bold">
                    v1.0.0
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
                  Protocol &amp; MCP Reference
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabel={false} />
            <a 
              href="/app" 
              className="btn-primary btn-sm flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs font-bold uppercase"
            >
              <span>Launch Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Documentation Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="lg:col-span-3 sticky top-24 space-y-2 border border-white/10 bg-zinc-950 p-4 font-mono text-xs">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-2 font-bold">
            Documentation Index
          </span>
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`block px-3 py-2 border transition-colors ${
                activeSection === s.id
                  ? 'border-[#00FF4F] bg-[#00FF4F]/10 text-[#00FF4F] font-bold'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {s.title}
            </a>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            <span className="text-[10px] text-zinc-500 uppercase block">QUICK LINKS</span>
            <a href="/app" className="text-zinc-400 hover:text-[#00FF4F] block flex items-center gap-1">
              <span>Studio &amp; MCP Hub</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#00FF4F] block flex items-center gap-1">
              <span>Basescan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <main className="lg:col-span-9 space-y-16">

          {/* Section 1: Introduction */}
          <section id="intro" className="space-y-4 border border-white/10 bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00FF4F] uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>Section 01</span>
            </div>
            <h1 className="text-3xl font-mono uppercase font-bold text-white">
              Overview &amp; Core Architecture
            </h1>
            <p className="text-zinc-300 leading-relaxed font-sans text-sm md:text-base">
              <strong>KeplerX</strong> bridges autonomous AI agents (built with Claude, Gemini, ElizaOS, Daydreams, AutoGen, or LangChain) with deterministic on-chain execution on the <strong>Base (EVM)</strong> blockchain.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 font-mono text-xs">
              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block text-sm">1. Autonomous Cognitive Loop</span>
                <p className="text-zinc-400 font-sans text-xs">
                  Probabilistic reasoning that processes user intent, assesses liquidity bounds, and encodes EVM calldata.
                </p>
              </div>
              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block text-sm">2. HTTP 402 Settlement</span>
                <p className="text-zinc-400 font-sans text-xs">
                  Native web micropayment rail. The gateway challenges the agent for micro-fees (0.005 USDC) settled cryptographically.
                </p>
              </div>
              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block text-sm">3. KeplerX Execution Engine</span>
                <p className="text-zinc-400 font-sans text-xs">
                  Preflight dry-run guard on Base RPC, MEV private relayer dispatch, and semantic revert diagnostics.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Model Context Protocol (MCP) */}
          <section id="mcp" className="space-y-6 border border-white/10 bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00FF4F] uppercase tracking-wider">
              <Server className="w-4 h-4" />
              <span>Section 02</span>
            </div>
            <h2 className="text-2xl font-mono uppercase font-bold text-white">
              Model Context Protocol (MCP) Integration
            </h2>
            <p className="text-zinc-300 font-sans text-sm leading-relaxed">
              KeplerX provides a production-grade <strong>JSON-RPC 2.0 MCP server</strong> conforming to Anthropic's open specification. Any AI agent, LLM tool runner, or IDE extension can connect over standard HTTP.
            </p>

            {/* Config Snippet 1: Claude Desktop */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-300 font-semibold">Claude Desktop Configuration (claude_desktop_config.json)</span>
                <button
                  onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "keplerx": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "@modelcontextprotocol/server-fetch",\n        "http://localhost:3000/api/mcp?token=YOUR_SESSION_TOKEN"\n      ]\n    }\n  }\n}`, 'claude-cfg')}
                  className="text-zinc-400 hover:text-[#00FF4F] flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'claude-cfg' ? <Check className="w-3.5 h-3.5 text-[#00FF4F]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'claude-cfg' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="p-4 bg-black border border-white/10 text-xs font-mono text-[#00FF4F] overflow-x-auto">
{`{
  "mcpServers": {
    "keplerx": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "http://localhost:3000/api/mcp?token=YOUR_SESSION_TOKEN"
      ]
    }
  }
}`}
              </pre>
            </div>

            {/* Config Snippet 2: Cursor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-300 font-semibold">Cursor IDE Configuration (.cursor/mcp.json)</span>
                <button
                  onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "keplerx": {\n      "url": "http://localhost:3000/api/mcp?token=YOUR_SESSION_TOKEN"\n    }\n  }\n}`, 'cursor-cfg')}
                  className="text-zinc-400 hover:text-[#00FF4F] flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'cursor-cfg' ? <Check className="w-3.5 h-3.5 text-[#00FF4F]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'cursor-cfg' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="p-4 bg-black border border-white/10 text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "mcpServers": {
    "keplerx": {
      "url": "http://localhost:3000/api/mcp?token=YOUR_SESSION_TOKEN"
    }
  }
}`}
              </pre>
            </div>

            {/* Config Snippet 3: Python */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-300 font-semibold">Python Agent / Requests Integration</span>
                <button
                  onClick={() => copyToClipboard(`import requests\n\nTOKEN = "YOUR_SESSION_TOKEN"\nMCP_URL = f"http://localhost:3000/api/mcp?token={TOKEN}"\n\n# Call telemetry\nres = requests.post(MCP_URL, json={\n    "jsonrpc": "2.0",\n    "id": 1,\n    "method": "tools/call",\n    "params": {\n        "name": "keplerx_get_telemetry",\n        "arguments": {"network": "8453"}\n    }\n})\nprint(res.json())`, 'py-cfg')}
                  className="text-zinc-400 hover:text-[#00FF4F] flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'py-cfg' ? <Check className="w-3.5 h-3.5 text-[#00FF4F]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'py-cfg' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="p-4 bg-black border border-white/10 text-xs font-mono text-zinc-300 overflow-x-auto">
{`import requests

TOKEN = "YOUR_SESSION_TOKEN"
MCP_URL = f"http://localhost:3000/api/mcp?token={TOKEN}"

# Call telemetry
res = requests.post(MCP_URL, json={
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "keplerx_get_telemetry",
        "arguments": {"network": "8453"}
    }
})
print(res.json())`}
              </pre>
            </div>
          </section>

          {/* Section 3: Multi-Tenant Security & Anti-Collision */}
          <section id="security" className="space-y-4 border border-white/10 bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00FF4F] uppercase tracking-wider">
              <Key className="w-4 h-4" />
              <span>Section 03</span>
            </div>
            <h2 className="text-2xl font-mono uppercase font-bold text-white">
              Multi-Tenant Security &amp; Anti-Collision
            </h2>
            <p className="text-zinc-300 font-sans text-sm leading-relaxed">
              When multiple users or agents connect to the MCP gateway simultaneously, their sessions are strictly isolated with cryptographic guarantees:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-black border border-white/10 flex items-start gap-3">
                <span className="text-[#00FF4F] font-bold">256-BIT ENTROPY</span>
                <p className="text-zinc-400 font-sans">
                  Session tokens (<code className="text-white">mcp_sess_...</code>) are generated via CSPRNG with 256 bits of entropy. It is computationally impossible to guess or brute-force another user's session.
                </p>
              </div>

              <div className="p-4 bg-black border border-white/10 flex items-start gap-3">
                <span className="text-[#00FF4F] font-bold">ZERO COLLISION</span>
                <p className="text-zinc-400 font-sans">
                  User 1 and User 2 maintain separate memory stores, separate agent keypairs, and independent audit trails. User 1 cannot view, replay, or intercept User 2's transactions.
                </p>
              </div>

              <div className="p-4 bg-black border border-white/10 flex items-start gap-3">
                <span className="text-[#00FF4F] font-bold">URL TAMPER RESISTANT</span>
                <p className="text-zinc-400 font-sans">
                  Any attempt to manipulate URL parameters without presenting a valid session token in <code className="text-white">Authorization: Bearer</code> or query string is rejected with <code className="text-red-400 font-bold">401 Unauthorized</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: EVM Preflight Simulation */}
          <section id="preflight" className="space-y-4 border border-white/10 bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00FF4F] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Section 04</span>
            </div>
            <h2 className="text-2xl font-mono uppercase font-bold text-white">
              EVM Preflight Simulation (`simulate: true`)
            </h2>
            <p className="text-zinc-300 font-sans text-sm leading-relaxed">
              Preflight simulation is the safety backbone of the KeplerX engine. It executes a live dry-run on Base node state before broadcasting to the mempool:
            </p>

            <div className="p-4 bg-black border border-[#00FF4F]/30 font-mono text-xs space-y-2">
              <div className="text-[#00FF4F] font-bold">WHY THIS SAVES AGENTS THOUSANDS OF DOLLARS:</div>
              <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                If an AI agent submits a transaction directly to the mempool with outdated price bounds or insufficient balance, the Ethereum/Base virtual machine fails the call but <strong>still burns 100% of the gas fee</strong>. KeplerX's preflight guard catches this on the RPC layer, burning <strong>$0 in gas</strong>, and decodes the error reason for the agent.
              </p>
            </div>
          </section>

          {/* Section 5: Smart Contracts */}
          <section id="contracts" className="space-y-4 border border-white/10 bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00FF4F] uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Section 05</span>
            </div>
            <h2 className="text-2xl font-mono uppercase font-bold text-white">
              Verified Smart Contract Registry
            </h2>
            <p className="text-zinc-300 font-sans text-sm leading-relaxed">
              Official deployed contracts on Base Mainnet (Chain ID 8453) and Base Sepolia (Chain ID 84532):
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-white/10">
                <thead className="bg-black text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-4">CONTRACT</th>
                    <th className="py-2.5 px-4">NETWORK</th>
                    <th className="py-2.5 px-4">ADDRESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-white">Base Native USDC</td>
                    <td className="py-2.5 px-4 text-[#00FF4F]">Base Mainnet (8453)</td>
                    <td className="py-2.5 px-4 text-zinc-400">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-white">Aerodrome Router V2</td>
                    <td className="py-2.5 px-4 text-[#00FF4F]">Base Mainnet (8453)</td>
                    <td className="py-2.5 px-4 text-zinc-400">0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-white">Aave V3 Pool</td>
                    <td className="py-2.5 px-4 text-[#00FF4F]">Base Mainnet (8453)</td>
                    <td className="py-2.5 px-4 text-zinc-400">0xA238Dd80C259a72e81d7e4664a9801593F98d1c5</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-white">Base Sepolia USDC</td>
                    <td className="py-2.5 px-4 text-yellow-400">Base Sepolia (84532)</td>
                    <td className="py-2.5 px-4 text-zinc-400">0x036CbD53842c5426634e7929541eC2318f3dCF7e</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Tool Schema Reference */}
          <section id="tools-ref" className="space-y-4 border border-white/10 bg-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-2 font-mono text-xs text-[#00FF4F] uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Section 06</span>
            </div>
            <h2 className="text-2xl font-mono uppercase font-bold text-white">
              MCP Tools Schema &amp; Reference
            </h2>
            <p className="text-zinc-400 font-sans text-xs">
              Tools are exposed via the prefix <code className="text-[#00FF4F]">keplerx_*</code> (with <code className="text-zinc-400">keeperhub_*</code> maintained for backwards compatibility).
            </p>
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block">keplerx_get_telemetry</span>
                <p className="text-zinc-400 font-sans text-xs">Returns block number, gas price in Gwei, active relayer nodes, and RPC status.</p>
                <code className="text-zinc-300 block text-[11px]">&#123; "network": "8453" | "84532" &#125;</code>
              </div>

              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block">keplerx_preflight_simulate</span>
                <p className="text-zinc-400 font-sans text-xs">Executes live on-chain dry-run using eth_estimateGas and eth_call against Base RPC nodes.</p>
                <code className="text-zinc-300 block text-[11px]">&#123; "intent": string, "targetContract": string, "calldata": string, "forceRevert": boolean &#125;</code>
              </div>

              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block">keplerx_create_x402_challenge</span>
                <p className="text-zinc-400 font-sans text-xs">Creates a cryptographic HTTP 402 challenge for micro-settlement.</p>
                <code className="text-zinc-300 block text-[11px]">&#123; "intent": string, "network": "8453" | "84532" &#125;</code>
              </div>

              <div className="p-4 bg-black border border-white/10 space-y-2">
                <span className="text-[#00FF4F] font-bold block">keplerx_execute_dispatch</span>
                <p className="text-zinc-400 font-sans text-xs">Dispatches transaction to Base network with MEV shield, returning receipt with transaction hash.</p>
                <code className="text-zinc-300 block text-[11px]">&#123; "intent": string, "protocol": string, "targetContract": string, "calldata": string &#125;</code>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

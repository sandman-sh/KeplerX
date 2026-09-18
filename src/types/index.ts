export interface X402Challenge {
  challengeId: string;
  recipient: string;
  amount: string; // e.g. "0.01" USDC
  token: string;   // USDC contract address
  tokenSymbol: string;
  network: string; // "8453" (Base) or "84532" (Base Sepolia)
  nonce: string;
  timestamp: number;
  expiresAt: number;
  purpose: string;
}

export interface X402PaymentProof {
  challengeId: string;
  payerAddress: string;
  signature: string;
  amount: string;
  token: string;
  network: string;
  nonce: string;
  timestamp: number;
}

export interface EvmSimulationResult {
  simulated: boolean;
  success: boolean;
  gasEstimate: string;
  failureKind?: 'none' | 'validation' | 'revert' | 'insufficient_balance';
  wouldRevert: boolean;
  revertReason?: string;
  decodedError?: {
    code: string;
    selector: string;
    title: string;
    explanation: string;
    actionableAdvice: string;
  };
  sender: string;
  targetContract: string;
  calldata: string;
}

export interface ExecutionRecord {
  runId: string;
  agentId: string;
  timestamp: string;
  intent: string;
  protocol: string;
  network: string;
  networkName: string;
  x402Proof: {
    amount: string;
    token: string;
    settled: boolean;
    payer: string;
  };
  simulation: EvmSimulationResult;
  status: 'pending' | 'preflight_simulating' | 'payment_required' | 'executing' | 'confirmed' | 'reverted_caught' | 'failed';
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  latencyMs: number;
  gasUsed?: string;
  errorReason?: string;
}

export interface DaydreamsAgentThought {
  step: number;
  phase: 'PERCEPTION' | 'CHAIN_OF_THOUGHT' | 'PAYMENT_AUTH' | 'EXECUTION_DISPATCH' | 'OBSERVATION';
  content: string;
  timestamp: string;
}

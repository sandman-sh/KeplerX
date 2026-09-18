import type { DaydreamsAgentThought, X402Challenge, X402PaymentProof } from '../types/index.ts';
import { X402Service } from './x402Service.ts';
import { WalletService } from './walletService.ts';

export interface PredefinedScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  intent: string;
  protocol: string;
  targetContract: string;
  forceRevert: boolean;
  calldataSample: string;
}

export const PREDEFINED_SCENARIOS: PredefinedScenario[] = [
  {
    id: 'base-usdc-micropayment',
    name: 'x402 Micropayment & Service Dispatch',
    category: 'x402 Core Rails',
    description: 'Daydreams agent triggers micro-execution on Base USDC paying 0.005 USDC via HTTP 402',
    intent: 'Execute autonomous compute settlement of 0.005 USDC to service worker on Base',
    protocol: 'Base Native ERC-20',
    targetContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    forceRevert: false,
    calldataSample: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000000000000001388'
  },
  {
    id: 'aerodrome-swap',
    name: 'Aerodrome Liquidity Swap: USDC -> AERO',
    category: 'DeFi Swaps',
    description: 'Autonomous portfolio rebalancing using Aerodrome router on Base with MEV private routing',
    intent: 'Swap 15.00 USDC for AERO tokens on Aerodrome DEX router with 0.5% max slippage',
    protocol: 'Aerodrome Finance',
    targetContract: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    forceRevert: false,
    calldataSample: '0x38ed17390000000000000000000000000000000000000000000000000000000000e4e1c00000000000000000000000000000000000000000000000000000000001f3b000'
  },
  {
    id: 'aave-v3-supply',
    name: 'Aave V3 Collateral Supply & Yield Stream',
    category: 'Lending & Collateral',
    description: 'Daydreams treasury agent supplies 50.00 USDC into Aave V3 Base pool to earn yield',
    intent: 'Supply 50 USDC collateral to Aave V3 Pool contract on Base to maintain health factor > 2.0',
    protocol: 'Aave V3 Base',
    targetContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    forceRevert: false,
    calldataSample: '0x617ba037000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000000000000000000000000000000000000002faf080'
  },
  {
    id: 'unhappy-revert-demo',
    name: 'Slippage Revert Preflight Catch (Un-Happy Path)',
    category: 'Resilience & Diagnostics',
    description: 'Tests KeeperHub preflight simulation catching a DEX slippage revert before on-chain commit',
    intent: 'Attempt high-slippage swap on volatile pool with outdated price quote to trigger preflight revert',
    protocol: 'Uniswap V3 Base',
    targetContract: '0x2626664c2603336E57B271c5C0b26F421741e481',
    forceRevert: true,
    calldataSample: '0x414bacae000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000004200000000000000000000000000000000000006'
  }
];

export class DaydreamsAgentService {
  public static readonly AGENT_NAME = 'Daydreams-Reasoner-v2.1';

  /**
   * Returns the autonomous agent address derived from the local Agent Key
   */
  public static get AGENT_ADDRESS(): string {
    return WalletService.getAgentAccount().address;
  }

  /**
   * Generates step-by-step Chain of Thought trace for the given intent
   */
  public static generateThoughts(scenario: PredefinedScenario, networkName: string = 'Base Mainnet'): DaydreamsAgentThought[] {
    const timestamp = new Date().toLocaleTimeString();

    return [
      {
        step: 1,
        phase: 'PERCEPTION',
        content: `Perceived target state: "${scenario.intent}". Environment: ${networkName}. Polling active Base RPC node for block height, gas bounds, and liquidity depth.`,
        timestamp
      },
      {
        step: 2,
        phase: 'CHAIN_OF_THOUGHT',
        content: `Synthesizing execution route for ${scenario.protocol}. Target contract: ${scenario.targetContract}. Encoded calldata: ${scenario.calldataSample.slice(0, 32)}... Dispatching to KeeperHub x402 Gateway.`,
        timestamp
      },
      {
        step: 3,
        phase: 'PAYMENT_AUTH',
        content: `Received HTTP 402 challenge from KeeperHub Gateway. Verifying micro-fee requirement (${0.005} USDC). Generating cryptographic ECDSA secp256k1 signature.`,
        timestamp
      },
      {
        step: 4,
        phase: 'EXECUTION_DISPATCH',
        content: `Submitting verified x402 payment proof. Running live on-chain preflight verification on Base RPC node (eth_estimateGas & eth_call) before broadcast.`,
        timestamp
      },
      {
        step: 5,
        phase: 'OBSERVATION',
        content: scenario.forceRevert 
          ? `Preflight revert successfully intercepted by KeeperHub! Semantic Revert Decoder returned actionable diagnosis. Execution halted before mempool exposure — 0 gas burned.`
          : `Execution confirmed on Base! Transaction receipt indexed into Daydreams episodic memory. Gas utilized within optimal threshold.`,
        timestamp
      }
    ];
  }

  /**
   * Signs the x402 challenge using real ECDSA secp256k1 signature
   * Supports either connected browser wallet or autonomous Daydreams Agent Key
   */
  public static async signX402Challenge(
    challenge: X402Challenge, 
    customSigner?: { address: string; signMessage: (args: { message: string }) => Promise<string> }
  ): Promise<X402PaymentProof> {
    const canonicalMessage = X402Service.formatCanonicalX402Message(challenge);
    let signature: string;
    let payerAddress: string;

    if (customSigner) {
      payerAddress = customSigner.address;
      signature = await customSigner.signMessage({ message: canonicalMessage });
    } else {
      const agentAccount = WalletService.getAgentAccount();
      payerAddress = agentAccount.address;
      if (!agentAccount.signMessage) {
        throw new Error('Agent account does not support cryptographic signing');
      }
      signature = await agentAccount.signMessage({ message: canonicalMessage });
    }

    return {
      challengeId: challenge.challengeId,
      payerAddress,
      signature,
      amount: challenge.amount,
      token: challenge.token,
      network: challenge.network,
      nonce: challenge.nonce,
      timestamp: Date.now()
    };
  }
}

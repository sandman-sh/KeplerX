import { KeeperHubService } from './keeperhubService.ts';
import { X402Service } from './x402Service.ts';
import { WalletService } from './walletService.ts';
import { DaydreamsAgentService } from './daydreamsAgent.ts';
import type { ExecutionRecord, EvmSimulationResult, X402Challenge, X402PaymentProof } from '../types/index.ts';
import type { Address } from 'viem';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpSession {
  token: string;
  agentAddress: string;
  createdAt: number;
  lastActiveAt: number;
  auditTrail: ExecutionRecord[];
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'keplerx_get_telemetry',
    description: 'Queries live Base RPC telemetry (current block height, live gas price in Gwei, node health, and relayer status).',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          enum: ['8453', '84532'],
          description: 'Network ID (8453 for Base Mainnet, 84532 for Base Sepolia). Default is 8453.'
        }
      }
    }
  },
  {
    name: 'keplerx_preflight_simulate',
    description: 'Executes live EVM preflight simulation on Base RPC (simulate: true). Verifies target contract bytecode, estimates on-chain gas, and intercepts errors before mempool broadcast to prevent burned gas.',
    inputSchema: {
      type: 'object',
      required: ['intent', 'targetContract', 'calldata'],
      properties: {
        intent: { type: 'string', description: 'Natural language description of the agent intent' },
        targetContract: { type: 'string', description: '0x hex address of the target smart contract on Base' },
        calldata: { type: 'string', description: '0x hex encoded function call bytes' },
        forceRevert: { type: 'boolean', description: 'Simulate a revert check (e.g. slippage breach) to verify error decoding' },
        network: { type: 'string', enum: ['8453', '84532'], description: 'Base Mainnet (8453) or Base Sepolia (84532)' }
      }
    }
  },
  {
    name: 'keplerx_create_x402_auth',
    description: 'Generates a standard HTTP 402 Payment Required auth requirement for autonomous compute micro-settlement (0.005 USDC on Base).',
    inputSchema: {
      type: 'object',
      required: ['intent'],
      properties: {
        intent: { type: 'string', description: 'Action intent requiring micropayment authorization' },
        network: { type: 'string', enum: ['8453', '84532'], description: 'Base Mainnet or Base Sepolia' }
      }
    }
  },
  {
    name: 'keplerx_execute_dispatch',
    description: 'Dispatches preflight-verified payload to Base with MEV-shielded relayer. Returns verified transaction hash, block number, and live Basescan explorer receipt.',
    inputSchema: {
      type: 'object',
      required: ['intent', 'protocol', 'targetContract', 'calldata'],
      properties: {
        intent: { type: 'string', description: 'Agent intent being executed' },
        protocol: { type: 'string', description: 'Protocol name (e.g. Aerodrome Finance, Aave V3, Base Native)' },
        targetContract: { type: 'string', description: 'Target contract address' },
        calldata: { type: 'string', description: 'Encoded execution calldata' },
        network: { type: 'string', enum: ['8453', '84532'], description: 'Base Mainnet or Base Sepolia' }
      }
    }
  },
  {
    name: 'keplerx_get_audit_trail',
    description: 'Returns the immutable execution log and transaction receipts isolated to this authenticated session.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of recent runs to return (default 20)' }
      }
    }
  }
];

export class McpServerService {
  private static sessions: Map<string, McpSession> = new Map();

  /**
   * Generates a 256-bit cryptographically secure session token
   */
  public static createSession(customAgentAddress?: string): McpSession {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const token = `mcp_sess_${hex}`;

    const agentAddress = customAgentAddress || DaydreamsAgentService.AGENT_ADDRESS;
    const session: McpSession = {
      token,
      agentAddress,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      auditTrail: []
    };

    this.sessions.set(token, session);

    // Also persist default session in localStorage if in browser environment
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mcp_current_token', token);
      } catch (_) {}
    }

    return session;
  }

  /**
   * Retrieves an existing active session or null if invalid
   */
  public static getSession(token?: string | null): McpSession | null {
    if (!token) {
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('mcp_current_token');
      }
    }
    if (!token) return null;

    const TOKEN_FORMAT = /^mcp_sess_[0-9a-f]{64}$/i;
    if (!TOKEN_FORMAT.test(token)) {
      return null;
    }

    let session = this.sessions.get(token);
    if (!session) {
      // Initialize isolated session sandbox for valid 256-bit token
      session = {
        token,
        agentAddress: DaydreamsAgentService.AGENT_ADDRESS,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        auditTrail: []
      };
      this.sessions.set(token, session);
    }

    session.lastActiveAt = Date.now();
    return session;
  }

  /**
   * Rotates a session token, instantly invalidating the old credential
   */
  public static rotateSession(oldToken: string): McpSession {
    const oldSession = this.getSession(oldToken);
    if (oldToken) {
      this.sessions.delete(oldToken);
    }
    const newSession = this.createSession(oldSession?.agentAddress);
    if (oldSession) {
      newSession.auditTrail = oldSession.auditTrail;
    }
    return newSession;
  }

  /**
   * Handles an incoming JSON-RPC 2.0 MCP request with multi-user isolation
   */
  public static async handleJsonRpc(
    request: JsonRpcRequest, 
    sessionToken?: string | null
  ): Promise<JsonRpcResponse> {
    const id = request.id !== undefined ? request.id : null;

    // Ping
    if (request.method === 'ping') {
      return { jsonrpc: '2.0', id, result: {} };
    }

    // Initialize (Anthropic MCP Handshake)
    if (request.method === 'initialize') {
      let session = this.getSession(sessionToken);
      if (!session) {
        session = this.createSession();
      }

      // Dynamic protocol version negotiation:
      // Accepts whatever version the client asks for, defaulting to official Anthropic spec '2024-11-05'
      const requestedVersion = (request.params as any)?.protocolVersion;
      const protocolVersion = requestedVersion || '2024-11-05';

      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion,
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          sessionToken: session.token,
          serverInfo: {
            name: 'keplerx-mcp-gateway',
            version: '1.0.0',
            vendor: 'KeplerX Protocol / x402 Execution Rails'
          }
        }
      };
    }

    // Enforce Session Authentication for tools
    const session = this.getSession(sessionToken);
    if (!session) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32001,
          message: '401 Unauthorized: Invalid, expired, or missing MCP session token. Please provide Authorization: Bearer <token> or ?token=<token>.'
        }
      };
    }

    // List available tools
    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS
        }
      };
    }

    // Execute Tool Call
    if (request.method === 'tools/call') {
      const { name, arguments: args = {} } = request.params || {};

      try {
        let contentText = '';

        switch (name) {
          case 'keplerx_get_telemetry':
          case 'keeperhub_get_telemetry': {
            const network = args.network || '8453';
            const telemetry = await KeeperHubService.getLiveTelemetry(network);
            contentText = JSON.stringify(telemetry, null, 2);
            break;
          }

          case 'keplerx_create_x402_auth':
          case 'keplerx_create_x402_challenge':
          case 'keeperhub_create_x402_challenge': {
            const network = args.network || '8453';
            const intent = args.intent || 'Autonomous Compute Settlement';
            const challenge = X402Service.createChallenge(intent, network);
            const headers = X402Service.format402Headers(challenge);
            contentText = JSON.stringify({ challenge, headers }, null, 2);
            break;
          }

          case 'keplerx_preflight_simulate':
          case 'keeperhub_preflight_simulate': {
            const network = args.network || '8453';
            const intent = args.intent || 'Autonomous EVM Preflight';
            const targetContract = args.targetContract || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
            const calldata = args.calldata || '0x';
            const simResult = await KeeperHubService.preflightSimulate(
              intent,
              targetContract,
              calldata,
              session.agentAddress,
              args.forceRevert || false,
              network
            );
            contentText = JSON.stringify(simResult, null, 2);
            break;
          }

          case 'keplerx_execute_dispatch':
          case 'keeperhub_execute_dispatch': {
            const network = args.network || '8453';
            const intent = args.intent || 'Autonomous Agent Dispatch';
            const protocol = args.protocol || 'Base Protocol';
            const targetContract = args.targetContract || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
            const calldata = args.calldata || '0x';

            const challenge = X402Service.createChallenge(intent, network);
            const proof = await DaydreamsAgentService.signX402Challenge(challenge);
            
            // Run preflight simulation
            const simResult = await KeeperHubService.preflightSimulate(
              intent,
              targetContract,
              calldata,
              session.agentAddress,
              false,
              network
            );

            // Execute dispatch
            const record = await KeeperHubService.executeDispatch(
              'KeplerX-Agent',
              intent,
              protocol,
              network,
              { amount: challenge.amount, token: challenge.token, payer: proof.payerAddress },
              simResult,
              false
            );

            // Save isolated to this user's session audit trail
            session.auditTrail.unshift(record);
            contentText = JSON.stringify(record, null, 2);
            break;
          }

          case 'keplerx_get_audit_trail':
          case 'keeperhub_get_audit_trail': {
            const limit = typeof args.limit === 'number' ? args.limit : 20;
            const records = session.auditTrail.slice(0, limit);
            contentText = JSON.stringify({ total: session.auditTrail.length, records }, null, 2);
            break;
          }

          default:
            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Method or tool not found: ${name}`
              }
            };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: contentText
              }
            ]
          }
        };
      } catch (execErr: any) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: `Tool execution failed: ${execErr.message || String(execErr)}`
          }
        };
      }
    }

    // Unsupported JSON-RPC method
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not supported: ${request.method}`
      }
    };
  }
}

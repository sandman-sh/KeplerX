import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
  formatEther, 
  formatUnits, 
  type Address, 
  type Account 
} from 'viem';
import { privateKeyToAccount, generatePrivateKey, type PrivateKeyAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

export const BASE_USDC_MAINNET: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const BASE_USDC_SEPOLIA: Address = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const;

export interface WalletState {
  isConnected: boolean;
  address: Address | null;
  mode: 'wallet' | 'agent';
  chainId: number;
  ethBalance: string;
  usdcBalance: string;
}

export class WalletService {
  private static agentAccount: PrivateKeyAccount | null = null;

  public static getPublicClient(network: string = '8453') {
    const chain = network === '84532' ? baseSepolia : base;
    const defaultRpc = network === '84532' ? 'https://sepolia.base.org' : 'https://mainnet.base.org';
    const rpc = network === '84532'
      ? ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_SEPOLIA_RPC) || defaultRpc)
      : ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_MAINNET_RPC) || defaultRpc);
    return createPublicClient({
      chain,
      transport: http(rpc)
    });
  }

  /**
   * Retrieves or initializes the persistent autonomous KeplerX Agent Key
   */
  public static getAgentAccount(): PrivateKeyAccount {
    if (this.agentAccount) {
      return this.agentAccount;
    }

    const storageKey = 'keplerx_agent_pk';
    const envKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_AGENT_PRIVATE_KEY : null;
    let privateKey = envKey || (typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null);

    if (!privateKey || !privateKey.startsWith('0x') || privateKey.length < 66) {
      // Generate secure isolated keypair for this autonomous agent instance
      privateKey = generatePrivateKey();
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, privateKey);
        } catch (_) {}
      }
    }

    this.agentAccount = privateKeyToAccount(privateKey as `0x${string}`);
    return this.agentAccount;
  }

  /**
   * Checks if user has a Web3 browser wallet injected
   */
  public static hasInjectedWallet(): boolean {
    return typeof window !== 'undefined' && Boolean((window as any).ethereum);
  }

  /**
   * Connects to user's browser wallet (MetaMask, Coinbase Wallet, etc.)
   */
  public static async connectBrowserWallet(targetNetwork: string = '8453'): Promise<Address> {
    if (!this.hasInjectedWallet()) {
      throw new Error('No Web3 wallet found in browser. Please install MetaMask, Coinbase Wallet, or Rabby.');
    }

    const ethereum = (window as any).ethereum;
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts authorized by user.');
    }

    const userAddress = accounts[0] as Address;

    // Request chain switch if needed
    const targetChainId = targetNetwork === '84532' ? '0x14a34' : '0x2105'; // 84532 or 8453 in hex
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }]
      });
    } catch (switchError: any) {
      // Chain not added to user wallet yet (4902)
      if (switchError.code === 4902) {
        const isSepolia = targetNetwork === '84532';
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetChainId,
            chainName: isSepolia ? 'Base Sepolia' : 'Base Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [isSepolia ? 'https://sepolia.base.org' : 'https://mainnet.base.org'],
            blockExplorerUrls: [isSepolia ? 'https://sepolia.basescan.org' : 'https://basescan.org']
          }]
        });
      }
    }

    return userAddress;
  }

  /**
   * Creates a Viem WalletClient for the connected browser wallet
   */
  public static getBrowserWalletClient(network: string = '8453') {
    if (!this.hasInjectedWallet()) return null;
    const chain = network === '84532' ? baseSepolia : base;
    return createWalletClient({
      chain,
      transport: custom((window as any).ethereum)
    });
  }

  /**
   * Fetches real on-chain ETH and Base USDC balances for an address
   */
  public static async fetchBalances(address: Address, network: string = '8453'): Promise<{ eth: string; usdc: string }> {
    const client = this.getPublicClient(network);
    const usdcAddress = network === '84532' ? BASE_USDC_SEPOLIA : BASE_USDC_MAINNET;

    try {
      // Real ETH balance
      const ethRaw = await client.getBalance({ address });
      const ethFormatted = Number(formatEther(ethRaw)).toFixed(4);

      // Real USDC ERC-20 balance
      let usdcFormatted = '0.00';
      try {
        const usdcRaw = await client.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address]
        });
        usdcFormatted = Number(formatUnits(usdcRaw, 6)).toFixed(2);
      } catch (e) {
        usdcFormatted = '0.00';
      }

      return { eth: ethFormatted, usdc: usdcFormatted };
    } catch (err) {
      console.warn('Could not fetch balances:', err);
      return { eth: '0.0000', usdc: '0.00' };
    }
  }
}

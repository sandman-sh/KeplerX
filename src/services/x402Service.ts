import type { X402Challenge, X402PaymentProof } from '../types/index.ts';
import { verifyMessage } from 'viem';

export const BASE_USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const BASE_USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const KEEPERHUB_DISPATCHER_RECEIVER = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

export class X402Service {
  /**
   * Generates a standard canonical EIP-191 string message for cryptographic signing
   */
  public static formatCanonicalX402Message(challenge: X402Challenge): string {
    return [
      'KEEPERHUB_X402_AUTHORIZATION',
      `Challenge: ${challenge.challengeId}`,
      `Recipient: ${challenge.recipient}`,
      `Amount: ${challenge.amount} ${challenge.tokenSymbol}`,
      `Token: ${challenge.token}`,
      `Network: ${challenge.network}`,
      `Nonce: ${challenge.nonce}`,
      `ExpiresAt: ${challenge.expiresAt}`
    ].join('\n');
  }

  /**
   * Generates an HTTP 402 challenge for an incoming Daydreams agent intent
   */
  public static createChallenge(intent: string, network: string = '8453'): X402Challenge {
    const timestamp = Date.now();
    const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const challengeId = `x402_${timestamp}_${nonce.slice(2, 10)}`;
    const isSepolia = network === '84532';

    return {
      challengeId,
      recipient: KEEPERHUB_DISPATCHER_RECEIVER,
      amount: '0.005', // 0.005 USDC per autonomous dispatch
      token: isSepolia ? BASE_USDC_SEPOLIA : BASE_USDC_MAINNET,
      tokenSymbol: 'USDC',
      network,
      nonce,
      timestamp,
      expiresAt: timestamp + 300000, // 5 min expiry
      purpose: `Execution fee for intent: "${intent.slice(0, 48)}..."`
    };
  }

  /**
   * Cryptographically validates the x402 payment proof using ECDSA secp256k1
   */
  public static async verifyPaymentProof(challenge: X402Challenge, proof: X402PaymentProof): Promise<{ valid: boolean; reason?: string }> {
    if (proof.challengeId !== challenge.challengeId) {
      return { valid: false, reason: 'Challenge ID mismatch' };
    }
    if (Date.now() > challenge.expiresAt) {
      return { valid: false, reason: 'x402 payment challenge expired' };
    }
    if (proof.nonce !== challenge.nonce) {
      return { valid: false, reason: 'Cryptographic nonce mismatch' };
    }
    if (parseFloat(proof.amount) < parseFloat(challenge.amount)) {
      return { valid: false, reason: 'Insufficient micro-fee amount' };
    }
    if (!proof.signature || proof.signature.length < 32) {
      return { valid: false, reason: 'Invalid or missing agent cryptographic signature' };
    }

    try {
      const canonicalMessage = this.formatCanonicalX402Message(challenge);
      const isSignatureValid = await verifyMessage({
        address: proof.payerAddress as `0x${string}`,
        message: canonicalMessage,
        signature: proof.signature as `0x${string}`
      });

      if (!isSignatureValid) {
        return { valid: false, reason: 'Cryptographic signature verification failed (ECDSA mismatch)' };
      }
    } catch (err: any) {
      return { valid: false, reason: `Signature verification error: ${err.message || String(err)}` };
    }

    return { valid: true };
  }

  /**
   * Formats HTTP 402 response headers as per x402 spec
   */
  public static format402Headers(challenge: X402Challenge): Record<string, string> {
    return {
      'Status': '402 Payment Required',
      'X-Payment-Protocol': 'x402-v1',
      'X-Payment-Recipient': challenge.recipient,
      'X-Payment-Amount': `${challenge.amount} ${challenge.tokenSymbol}`,
      'X-Payment-Token': challenge.token,
      'X-Payment-Network': challenge.network,
      'X-Payment-Nonce': challenge.nonce,
      'X-Payment-Expires': new Date(challenge.expiresAt).toISOString(),
    };
  }
}

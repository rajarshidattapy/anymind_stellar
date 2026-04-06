import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useStellarWallet } from '../contexts/StellarWalletContext';
import { useApiClient } from '../lib/api';
import { sendPayment, PaymentResult } from '../utils/solanaPayment';
import {
  isX402Challenge,
  payAndRetry,
  getStellarExplorerUrl,
  type X402Challenge,
  type StellarPaymentResult,
} from '../utils/stellarPayment';

export interface QueryResult {
  response: string;
  capsule_id: string;
  price_paid: number;
  txSignature?: string;
  payment_method?: 'solana' | 'stellar_x402';
  stellar_tx_hash?: string;
}

export function useCapsuleQuery() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { address: stellarAddress, connected: stellarConnected } = useStellarWallet();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<{
    challenge: X402Challenge;
    capsuleId: string;
    prompt: string;
  } | null>(null);

  /**
   * Query a capsule with automatic payment handling.
   *
   * Flow:
   *   1. Send query to backend
   *   2. If 402 → x402 Stellar payment flow (Freighter)
   *   3. If Stellar not available → fall back to Solana payment
   */
  const queryWithPayment = async (
    capsuleId: string,
    prompt: string,
    creatorWallet: string,
    pricePerQuery: number
  ): Promise<QueryResult | null> => {
    const activeWalletAddress = publicKey?.toBase58() || stellarAddress || '';

    if (!activeWalletAddress) {
      setError('Wallet not connected. Please connect a Solana or Stellar wallet first.');
      return null;
    }

    if (!prompt.trim()) {
      setError('Please enter a question');
      return null;
    }

    setLoading(true);
    setError(null);
    setPendingChallenge(null);

    try {
      // Step 1: Try the query — may return 402 if x402 is configured
      const rawResponse = await apiClient.queryCapsuleRaw(
        capsuleId,
        { prompt },
        { 'X-Wallet-Address': activeWalletAddress }
      );

      // Step 2: Handle 402 → x402 Stellar payment
      if (rawResponse.status === 402) {
        const body = await rawResponse.json();

        if (isX402Challenge(402, body)) {
          setPendingChallenge({
            challenge: body,
            capsuleId,
            prompt,
          });

          if (!stellarConnected) {
            return await queryWithSolanaPayment(
              capsuleId, prompt, creatorWallet, pricePerQuery
            );
          }

          // Execute x402 Stellar payment
          const result = await payWithStellar(capsuleId, prompt, body);
          return result;
        }
      }

      // Step 3: Non-402 response — either success or error
      if (!rawResponse.ok) {
        const errorData = await rawResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `Query failed (${rawResponse.status})`);
      }

      const data = await rawResponse.json();
      return {
        response: data.response,
        capsule_id: data.capsule_id,
        price_paid: data.price_paid || 0,
        payment_method: data.payment_method,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setError(message);
      console.error('Query error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute x402 Stellar payment flow via the connected Stellar wallet.
   */
  const payWithStellar = async (
    capsuleId: string,
    prompt: string,
    challenge: X402Challenge
  ): Promise<QueryResult | null> => {
    try {
      const walletAddress = publicKey?.toBase58() || stellarAddress || '';
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const url = `${apiBaseUrl}/api/v1/capsules/${encodeURIComponent(capsuleId)}/query`;

      const result: StellarPaymentResult = await payAndRetry(
        url,
        challenge,
        { prompt },
        { 'X-Wallet-Address': walletAddress }
      );

      if (!result.success) {
        throw new Error(result.error || 'Stellar payment failed');
      }

      return {
        response: result.data?.response || 'Query processed',
        capsule_id: capsuleId,
        price_paid: result.data?.price_paid || 0,
        payment_method: 'stellar_x402',
        stellar_tx_hash: result.txHash,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stellar payment failed';
      setError(message);
      return null;
    }
  };

  /**
   * Legacy Solana payment flow (fallback).
   */
  const queryWithSolanaPayment = async (
    capsuleId: string,
    prompt: string,
    creatorWallet: string,
    pricePerQuery: number
  ): Promise<QueryResult | null> => {
    if (!publicKey || !signTransaction) {
      setError('Solana wallet not connected');
      return null;
    }

    try {
      let paymentSignature: string | undefined;

      if (pricePerQuery > 0) {
        const paymentResult: PaymentResult = await sendPayment(
          connection,
          publicKey,
          creatorWallet,
          pricePerQuery,
          signTransaction
        );

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment failed');
        }

        paymentSignature = paymentResult.signature;
      }

      const response = await apiClient.queryCapsule(capsuleId, {
        prompt,
        payment_signature: paymentSignature,
        amount_paid: pricePerQuery,
      });

      return {
        ...(response as any),
        txSignature: paymentSignature,
        payment_method: 'solana',
      };
    } catch (err) {
      throw err; // Re-throw for caller to handle
    }
  };

  return {
    queryWithPayment,
    loading,
    error,
    pendingChallenge,
    clearError: () => setError(null),
    getStellarExplorerUrl,
  };
}

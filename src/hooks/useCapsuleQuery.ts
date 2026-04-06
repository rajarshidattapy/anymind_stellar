import { useState } from 'react';
import { useWallet } from '../contexts/WalletContextProvider';
import { useApiClient } from '../lib/api';
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
  payment_method?: 'stellar_x402';
  stellar_tx_hash?: string;
}

export function useCapsuleQuery() {
  const { publicKey } = useWallet();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<{
    challenge: X402Challenge;
    capsuleId: string;
    prompt: string;
  } | null>(null);

  const queryWithPayment = async (
    capsuleId: string,
    prompt: string,
    _creatorWallet: string,
    _pricePerQuery: number
  ): Promise<QueryResult | null> => {
    const activeWalletAddress = publicKey || '';

    if (!activeWalletAddress) {
      setError('Wallet not connected. Please connect a Stellar wallet first.');
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
      const rawResponse = await apiClient.queryCapsuleRaw(
        capsuleId,
        { prompt },
        { 'X-Wallet-Address': activeWalletAddress }
      );

      if (rawResponse.status === 402) {
        const body = await rawResponse.json();

        if (isX402Challenge(402, body)) {
          setPendingChallenge({
            challenge: body,
            capsuleId,
            prompt,
          });

          return await payWithStellar(capsuleId, prompt, body);
        }

        throw new Error('This capsule requires a Stellar x402 payment before it can be queried.');
      }

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

  const payWithStellar = async (
    capsuleId: string,
    prompt: string,
    challenge: X402Challenge
  ): Promise<QueryResult | null> => {
    try {
      const walletAddress = publicKey || '';
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

  return {
    queryWithPayment,
    loading,
    error,
    pendingChallenge,
    clearError: () => setError(null),
    getStellarExplorerUrl,
  };
}

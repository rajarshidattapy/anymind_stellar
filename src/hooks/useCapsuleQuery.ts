import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useApiClient } from '../lib/api';
import { sendPayment, PaymentResult } from '../utils/solanaPayment';

export interface QueryResult {
  response: string;
  capsule_id: string;
  price_paid: number;
  txSignature?: string;
}

export function useCapsuleQuery() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryWithPayment = async (
    capsuleId: string,
    prompt: string,
    creatorWallet: string,
    pricePerQuery: number
  ): Promise<QueryResult | null> => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected. Please connect your wallet first.');
      return null;
    }

    if (!prompt.trim()) {
      setError('Please enter a question');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let paymentSignature: string | undefined;

      // Send payment if price > 0
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

      // Query capsule with payment proof
      const response = await apiClient.queryCapsule(capsuleId, {
        prompt,
        payment_signature: paymentSignature,
        amount_paid: pricePerQuery,
      });

      return {
        ...response,
        txSignature: paymentSignature
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

  return {
    queryWithPayment,
    loading,
    error,
    clearError: () => setError(null)
  };
}

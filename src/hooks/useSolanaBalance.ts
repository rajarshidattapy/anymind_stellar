import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';

export const useSolanaBalance = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, connected]);

  useEffect(() => {
    fetchBalance();

    // Set up subscription for balance changes
    if (publicKey && connected) {
      const subscriptionId = connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
          console.log('Balance updated via subscription:', newBalance);
          // Always update balance to ensure UI reflects changes
          setBalance(newBalance);
        },
        'confirmed' // Use confirmed commitment for faster updates
      );

      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    }
  }, [connection, publicKey, connected, fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
};

import { useEffect, useState } from 'react';

const DEFAULT_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL ?? DEFAULT_HORIZON_URL;

export function useStellarBalance(accountId: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setBalance(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadBalance() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${HORIZON_URL}/accounts/${encodeURIComponent(accountId ?? '')}`,
          { signal: controller.signal }
        );

        if (response.status === 404) {
          setBalance(0);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load balance (${response.status})`);
        }

        const account = await response.json();
        const nativeBalance = Array.isArray(account.balances)
          ? account.balances.find((entry: { asset_type?: string }) => entry.asset_type === 'native')
          : null;

        setBalance(nativeBalance ? Number.parseFloat(nativeBalance.balance) : 0);
      } catch (nextError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : 'Failed to load balance');
        setBalance(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadBalance();

    return () => {
      controller.abort();
    };
  }, [accountId]);

  return { balance, loading, error };
}

import { useCallback } from 'react';
import { useWallet } from '../contexts/WalletContextProvider';
import {
  createSignedClient,
  capsuleIdForAgent,
  xlmToStroops,
  stroopsToXlm,
  type AnymindClient,
} from '../lib/contract';

const CAPSULES_CREATED_KEY = 'anymind_capsules_created';

function getCreatedCapsules(): Set<string> {
  try {
    const raw = localStorage.getItem(CAPSULES_CREATED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markCapsuleCreated(capsuleId: string): void {
  const set = getCreatedCapsules();
  set.add(capsuleId);
  localStorage.setItem(CAPSULES_CREATED_KEY, JSON.stringify([...set]));
}

export interface ContractStakeResult {
  txHash?: string;
  capsuleId: string;
}

export function useContract() {
  const { publicKey, connected } = useWallet();

  const getClient = useCallback((): AnymindClient => {
    if (!publicKey) throw new Error('Wallet not connected');
    return createSignedClient(publicKey);
  }, [publicKey]);

  /**
   * Register an agent on-chain.
   * Call this after creating an agent via the backend API.
   */
  const registerAgent = useCallback(
    async (args: {
      agentId: string;
      name: string;
      displayName: string;
      platform: string;
    }) => {
      if (!publicKey) throw new Error('Wallet not connected');
      const client = getClient();
      const tx = await client.register_agent({
        owner: publicKey,
        agent_id: args.agentId,
        name: args.name,
        display_name: args.displayName,
        platform: args.platform,
      });
      const sent = await tx.signAndSend();
      return sent;
    },
    [publicKey, getClient]
  );

  /**
   * Stake XLM on a capsule for an agent.
   * Creates the capsule on-chain on first stake, then records the stake.
   *
   * @param agentId   - backend agent ID (used to derive capsule_id)
   * @param agentName - human name used as capsule name
   * @param category  - capsule category
   * @param description - capsule description
   * @param xlmAmount - stake amount in XLM (e.g. 10.5)
   * @param pricePerQueryXlm - price per query in XLM (default 0.05)
   */
  const stakeOnAgent = useCallback(
    async (args: {
      agentId: string;
      agentName: string;
      category: string;
      description: string;
      xlmAmount: number;
      pricePerQueryXlm?: number;
    }): Promise<ContractStakeResult> => {
      if (!publicKey) throw new Error('Wallet not connected');
      const client = getClient();

      const capsuleId = capsuleIdForAgent(args.agentId, publicKey);
      const amount = xlmToStroops(args.xlmAmount);
      const pricePerQuery = xlmToStroops(args.pricePerQueryXlm ?? 0.05);

      // Create capsule on-chain only once per agent per user
      const alreadyCreated = getCreatedCapsules().has(capsuleId);
      if (!alreadyCreated) {
        const createTx = await client.create_capsule({
          creator: publicKey,
          capsule_id: capsuleId,
          name: args.agentName,
          description: args.description,
          category: args.category,
          price_per_query: pricePerQuery,
        });
        await createTx.signAndSend();
        markCapsuleCreated(capsuleId);
      }

      // Record the stake on-chain
      const stakeTx = await client.stake_on_capsule({
        staker: publicKey,
        capsule_id: capsuleId,
        amount,
      });
      const sent = await stakeTx.signAndSend();

      return { txHash: (sent as any).hash, capsuleId };
    },
    [publicKey, getClient]
  );

  /**
   * Withdraw earnings for a capsule.
   * Returns the amount in XLM.
   */
  const withdrawEarnings = useCallback(
    async (capsuleId: string): Promise<number> => {
      if (!publicKey) throw new Error('Wallet not connected');
      const client = getClient();
      const tx = await client.withdraw_earnings({
        creator: publicKey,
        capsule_id: capsuleId,
      });
      const sent = await tx.signAndSend();
      const stroops: bigint = (sent as any).result ?? 0n;
      return stroopsToXlm(stroops);
    },
    [publicKey, getClient]
  );

  /**
   * Update the price per query for a capsule.
   */
  const updateCapsulePrice = useCallback(
    async (capsuleId: string, newPriceXlm: number) => {
      if (!publicKey) throw new Error('Wallet not connected');
      const client = getClient();
      const tx = await client.update_capsule_price({
        creator: publicKey,
        capsule_id: capsuleId,
        new_price: xlmToStroops(newPriceXlm),
      });
      return tx.signAndSend();
    },
    [publicKey, getClient]
  );

  return {
    connected,
    registerAgent,
    stakeOnAgent,
    withdrawEarnings,
    updateCapsulePrice,
    capsuleIdForAgent: (agentId: string) =>
      publicKey ? capsuleIdForAgent(agentId, publicKey) : null,
  };
}

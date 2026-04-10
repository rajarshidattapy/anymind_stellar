import { useState, useEffect } from 'react';
import { TrendingUp, Shield, Star, Coins, Plus, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useApiClient } from '../lib/api';
import { useWallet } from '../contexts/WalletContextProvider';
import { useContract } from '../hooks/useContract';
import { getStellarExplorerUrl } from '../utils/stellarPayment';

interface Agent {
  id: string;
  name: string;
  display_name: string;
  platform: string;
  api_key_configured: boolean;
  model?: string;
  user_wallet?: string;
}

interface StakingInfo {
  capsule_id: string;
  wallet_address: string;
  stake_amount: number;
  staked_at: string;
}

const Staking = () => {
  const { publicKey, connected, connecting, connect } = useWallet();
  const apiClient = useApiClient();
  const contract = useContract();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [stakingInfo, setStakingInfo] = useState<Record<string, StakingInfo>>({});
  const [loadingStaking, setLoadingStaking] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (connected && publicKey) {
      void fetchAgents();
      void fetchStakingInfo();
    }
  }, [connected, publicKey]);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const data = await apiClient.getAgents() as Agent[];
      setAgents(data);
    } catch (nextError) {
      console.error('Error fetching agents:', nextError);
      setError('Failed to load agents');
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchStakingInfo = async () => {
    if (!publicKey) return;

    try {
      const staking = await apiClient.getStakingInfo() as StakingInfo[];
      const stakingMap: Record<string, StakingInfo> = {};
      staking.forEach((entry) => {
        stakingMap[entry.capsule_id] = entry;
      });
      setStakingInfo(stakingMap);
    } catch (nextError) {
      console.error('Error fetching staking info:', nextError);
    }
  };

  const handleStake = async (agentId: string, agentName: string, platform: string) => {
    if (!connected || !publicKey) {
      setError('Please connect your Stellar wallet first');
      return;
    }

    const amountStr = stakeAmounts[agentId] || '0';
    const amount = Number.parseFloat(amountStr);

    if (Number.isNaN(amount) || amount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    if (amount < 0.1) {
      setError('Minimum stake is 0.1 XLM');
      return;
    }

    setLoadingStaking((prev) => ({ ...prev, [agentId]: true }));
    setError(null);

    try {
      // Step 1: Record stake on-chain via Soroban contract
      const { txHash, capsuleId } = await contract.stakeOnAgent({
        agentId,
        agentName,
        category: 'General',
        description: `Memory capsule for ${agentName}`,
        xlmAmount: amount,
        pricePerQueryXlm: 0.05,
      });

      if (txHash) {
        setTxHashes((prev) => ({ ...prev, [agentId]: txHash }));
      }

      // Step 2: Inform backend for off-chain tracking
      try {
        await apiClient.stakeOnAgent(agentId, {
          stake_amount: amount,
          price_per_query: 0.05,
          category: 'General',
          description: `Memory capsule for ${agentName}`,
        });
      } catch (backendErr) {
        // Backend sync failure is non-fatal; on-chain stake is the source of truth
        console.warn('Backend stake sync failed (on-chain stake succeeded):', backendErr);
      }

      await fetchStakingInfo();
      await fetchAgents();
      setStakeAmounts((prev) => ({ ...prev, [agentId]: '' }));

      // Update local capsule registry for marketplace display
      try {
        const stakedCapsule = {
          id: capsuleId,
          name: agentName,
          category: 'General',
          creator_wallet: publicKey,
          reputation: 0,
          stake_amount: amount,
          price_per_query: 0.05,
          description: `Memory capsule for ${agentName}`,
          query_count: 0,
          rating: 0,
          agent_id: agentId,
          platform,
          staked_at: new Date().toISOString(),
          tx_hash: txHash,
        };

        const existingStaked = JSON.parse(localStorage.getItem('staked_capsules') || '[]') as typeof stakedCapsule[];
        const filtered = existingStaked.filter((capsule) => capsule.agent_id !== agentId);
        filtered.push(stakedCapsule);
        localStorage.setItem('staked_capsules', JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('capsuleStaked', { detail: stakedCapsule }));
      } catch (storageError) {
        console.error('Error storing staked capsule:', storageError);
      }
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Staking failed';
      setError(message);
      console.error('Staking error:', nextError);
    } finally {
      setLoadingStaking((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const totalStaked = Object.values(stakingInfo).reduce((sum, entry) => sum + entry.stake_amount, 0);
  const activeStakes = Object.keys(stakingInfo).length;

  if (!connected) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
            <p className="text-gray-300 mb-4">Connect your Stellar wallet to manage capsule staking.</p>
            <button
              onClick={() => void connect()}
              disabled={connecting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {connecting ? 'Opening Wallets...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Staking</h1>
          <p className="text-gray-400">Back your agents with XLM to improve discovery across the marketplace.</p>
        </div>

        <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-300 mr-3 mt-0.5" />
          <div className="text-blue-100 text-sm">
            Stakes are recorded on the Stellar testnet via the Anymind Soroban contract. Contract ID:{' '}
            <span className="font-mono text-xs break-all">CBD3R6PV…DOGVPJ</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-red-200">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Coins className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">Total Staked</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalStaked.toFixed(2)} XLM</div>
            <div className="text-sm text-gray-400">Across all agents</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="h-5 w-5 text-purple-400" />
              <span className="text-gray-400">Active Stakes</span>
            </div>
            <div className="text-2xl font-bold text-white">{activeStakes}</div>
            <div className="text-sm text-gray-400">Staked agents</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-400">My Agents</span>
            </div>
            <div className="text-2xl font-bold text-white">{agents.length}</div>
            <div className="text-sm text-gray-400">Available to stake</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-gray-400">Platform</span>
            </div>
            <div className="text-2xl font-bold text-white">Anymind</div>
            <div className="text-sm text-gray-400">Marketplace</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">My Agents</h2>

          {loadingAgents ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading your agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Agents Yet</h3>
              <p className="text-gray-400 mb-4">Create an agent first to add XLM backing and list it in the marketplace.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => {
                const isStaking = loadingStaking[agent.id];
                const stakeAmount = stakeAmounts[agent.id] || '';
                const existingStake = Object.values(stakingInfo).find(
                  (entry) => entry.capsule_id.includes(agent.id) || entry.wallet_address === publicKey
                );

                return (
                  <div key={agent.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{agent.display_name || agent.name}</h3>
                        <div className="text-sm text-gray-400">
                          Platform: {agent.platform} | Model: {agent.model || 'N/A'}
                        </div>
                        {existingStake && (
                          <div className="text-sm text-green-400 mt-1">
                            Currently staked: {existingStake.stake_amount} XLM
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="number"
                        placeholder="Enter stake amount (XLM)"
                        value={stakeAmount}
                        onChange={(event) => setStakeAmounts((prev) => ({ ...prev, [agent.id]: event.target.value }))}
                        disabled={isStaking}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                        min="0"
                        step="0.1"
                      />
                      <button
                        onClick={() => void handleStake(agent.id, agent.display_name || agent.name, agent.platform)}
                        disabled={isStaking || !stakeAmount || Number.parseFloat(stakeAmount) <= 0}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isStaking ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Stake
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2 text-sm">Staking Benefits</h4>
                      <div className="text-xs text-gray-300 space-y-1">
                        <div>Your agent appears in the marketplace.</div>
                        <div>Earn from query fees when others use your capsule.</div>
                        <div>Higher XLM backing improves marketplace visibility.</div>
                      </div>
                    </div>

                    {txHashes[agent.id] && (
                      <div className="mt-3 flex items-center space-x-2 text-xs text-green-400">
                        <span>Last tx:</span>
                        <span className="font-mono truncate max-w-xs">{txHashes[agent.id]}</span>
                        <a
                          href={getStellarExplorerUrl(txHashes[agent.id])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 hover:text-green-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staking;

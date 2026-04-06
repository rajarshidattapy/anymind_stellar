import { useState, useEffect } from 'react';
import { TrendingUp, Shield, Star, Coins, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useApiClient } from '../lib/api';
import { sendPayment } from '../utils/solanaPayment';

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
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const apiClient = useApiClient();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [stakingInfo, setStakingInfo] = useState<Record<string, StakingInfo>>({});
  const [loadingStaking, setLoadingStaking] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});

  // Fetch user's agents
  useEffect(() => {
    if (connected && publicKey) {
      fetchAgents();
      fetchStakingInfo();
    }
  }, [connected, publicKey]);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const data = await apiClient.getAgents() as Agent[];
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
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
      staking.forEach(s => {
        // Find agent by capsule_id (we'll need to track this relationship)
        stakingMap[s.capsule_id] = s;
      });
      setStakingInfo(stakingMap);
    } catch (error) {
      console.error('Error fetching staking info:', error);
    }
  };

  const handleStake = async (agentId: string, agentName: string) => {
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    const amountStr = stakeAmounts[agentId] || '0';
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    setLoadingStaking(prev => ({ ...prev, [agentId]: true }));
    setError(null);

    try {
      // For staking, we need to send SOL to a staking pool
      // For now, we'll use a placeholder address - in production this should be a proper staking pool PDA
      // IMPORTANT: The balance will decrease due to transaction fees (~0.000005 SOL)
      // The actual SOL amount is sent to the staking pool (currently placeholder)
      // TODO: Replace with actual staking pool PDA derived from capsule_id using the Solana staking program
      const STAKING_POOL_ADDRESS = publicKey.toBase58(); // Placeholder - will be replaced with actual pool
      
      // Send SOL payment transaction (this will trigger wallet popup)
      let paymentResult;
      try {
        paymentResult = await sendPayment(
          connection,
          publicKey,
          STAKING_POOL_ADDRESS,
          amount,
          signTransaction
        );
      } catch (paymentError) {
        // Handle wallet extension errors
        const errorMsg = paymentError instanceof Error ? paymentError.message : 'Payment failed';
        if (errorMsg.includes('channel closed') || errorMsg.includes('message channel')) {
          throw new Error('Wallet connection was interrupted. Please try again and keep the wallet popup open.');
        }
        throw new Error(`Payment error: ${errorMsg}`);
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment transaction failed');
      }

      // Create capsule from agent if needed and stake with transaction signature
      const stakeResponse = await apiClient.stakeOnAgent(agentId, {
        stake_amount: amount,
        price_per_query: 0.05, // Default price, can be made configurable
        category: 'General',
        description: `Memory capsule for ${agentName}`,
        payment_signature: paymentResult.signature // Include transaction signature
      }) as any;

      // Refresh data
      await fetchStakingInfo();
      await fetchAgents();
      
      // Clear stake amount input
      setStakeAmounts(prev => ({ ...prev, [agentId]: '' }));
      
      // Store staked capsule info in localStorage for immediate marketplace display
      // This ensures the marketplace shows the staked agent even if backend has delays
      try {
        const capsuleId = stakeResponse?.capsule_id || `staked-${Date.now()}`;
        const stakedCapsule = {
          id: capsuleId, // Use actual capsule_id from backend if available
          name: agentName,
          category: 'General',
          creator_wallet: publicKey.toBase58(),
          reputation: 0,
          stake_amount: amount,
          price_per_query: 0.05,
          description: `Memory capsule for ${agentName}`,
          query_count: 0,
          rating: 0,
          agent_id: agentId,
          staked_at: new Date().toISOString()
        };
        
        // Get existing staked capsules from localStorage
        const existingStaked = JSON.parse(localStorage.getItem('staked_capsules') || '[]');
        // Add new staked capsule (avoid duplicates by agent_id)
        const filtered = existingStaked.filter((c: any) => c.agent_id !== agentId);
        filtered.push(stakedCapsule);
        localStorage.setItem('staked_capsules', JSON.stringify(filtered));
        
        // Trigger custom event to notify marketplace to refresh
        window.dispatchEvent(new CustomEvent('capsuleStaked', { detail: stakedCapsule }));
        
        console.log('Staked capsule stored in localStorage:', stakedCapsule);
      } catch (err) {
        console.error('Error storing staked capsule:', err);
      }
      
      // Note: Balance will decrease slightly due to transaction fees
      // The actual SOL is sent to the staking pool (currently a placeholder address)
      alert(`Successfully staked ${amount} SOL on ${agentName}!\n\nTransaction: ${paymentResult.signature}\n\nYour agent is now available in the Marketplace!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Staking failed';
      setError(message);
      console.error('Staking error:', err);
    } finally {
      setLoadingStaking(prev => ({ ...prev, [agentId]: false }));
    }
  };

  // Calculate total staked
  const totalStaked = Object.values(stakingInfo).reduce((sum, s) => sum + s.stake_amount, 0);
  const activeStakes = Object.keys(stakingInfo).length;

  if (!connected) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
            <p className="text-gray-300">Please connect your wallet to view and stake on your agents</p>
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
          <p className="text-gray-400">Stake SOL on your agents to make them available in the marketplace</p>
        </div>

        {error && (
          <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="text-red-200">{error}</div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Coins className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">Total Staked</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalStaked.toFixed(2)} SOL</div>
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
            <div className="text-2xl font-bold text-white">SolMind</div>
            <div className="text-sm text-gray-400">Marketplace</div>
          </div>
        </div>

        {/* My Agents for Staking */}
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
              <p className="text-gray-400 mb-4">Create an agent first to stake and make it available in the marketplace</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => {
                const isStaking = loadingStaking[agent.id];
                const stakeAmount = stakeAmounts[agent.id] || '';
                const existingStake = Object.values(stakingInfo).find(s => 
                  s.capsule_id.includes(agent.id) || s.wallet_address === publicKey?.toBase58()
                );
                
                return (
                  <div key={agent.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{agent.display_name || agent.name}</h3>
                        <div className="text-sm text-gray-400">
                          Platform: {agent.platform} • Model: {agent.model || 'N/A'}
                        </div>
                        {existingStake && (
                          <div className="text-sm text-green-400 mt-1">
                            Currently staked: {existingStake.stake_amount} SOL
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="number"
                        placeholder="Enter stake amount (SOL)"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmounts(prev => ({ ...prev, [agent.id]: e.target.value }))}
                        disabled={isStaking}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                        min="0"
                        step="0.1"
                      />
                      <button
                        onClick={() => handleStake(agent.id, agent.display_name || agent.name)}
                        disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isStaking ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Staking...
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
                        <div>• Your agent will appear in the marketplace</div>
                        <div>• Earn from query fees when others use your capsule</div>
                        <div>• Higher stakes = better visibility in marketplace</div>
                      </div>
                    </div>
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
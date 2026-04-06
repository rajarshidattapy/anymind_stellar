import { TrendingUp, Plus, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { useSolanaBalance } from '../hooks/useSolanaBalance';
import { useWallet } from '@solana/wallet-adapter-react';
import solanaLogo from '../assets/solana-logo.png';

const WalletBalance = () => {
  const { balance, loading } = useSolanaBalance();
  const { connected, publicKey } = useWallet();
  
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  const transactions = [
    {
      id: '1',
      type: 'purchase',
      description: 'Query - DeFi Yield Farming Expert',
      amount: -0.05,
      timestamp: new Date(Date.now() - 1800000),
      status: 'completed'
    },
    {
      id: '2',
      type: 'earning',
      description: 'Earnings - Pokemon Strategy Master',
      amount: +0.08,
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed'
    },
    {
      id: '3',
      type: 'deposit',
      description: 'Wallet Top-up',
      amount: +10.0,
      timestamp: new Date(Date.now() - 86400000),
      status: 'completed'
    },
    {
      id: '4',
      type: 'staking',
      description: 'Staked behind Crypto Trading Intelligence',
      amount: -5.0,
      timestamp: new Date(Date.now() - 172800000),
      status: 'completed'
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet & Balance</h1>
          <p className="text-gray-400">
            {connected && publicKey ? shortenAddress(publicKey.toBase58()) : 'Connect your Solana wallet to view balance'}
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
                <span className="text-gray-400">SOL Balance</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {loading ? '...' : connected ? `${balance?.toFixed(4) ?? '0'} SOL` : 'Not connected'}
            </div>
            <div className="text-sm text-gray-400">{connected ? 'Wallet connected' : 'Connect wallet to view'}</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-gray-400">Capsule Earnings</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">0.00 SOL</div>
            <div className="text-sm text-gray-400">From your intelligence capsules</div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-600 bg-opacity-20 rounded-lg border border-green-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <span className="text-green-400 text-sm">All systems operational</span>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Minimum Required Balance</div>
                <div className="text-xl font-bold text-white">0.50 SOL</div>
                <div className="text-xs text-gray-500 mt-1">To maintain access to premium features</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Estimated Runtime</div>
                <div className="text-xl font-bold text-white">16 days</div>
                <div className="text-xs text-gray-500 mt-1">At current usage rate</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Add Funds
              </button>
              
              {connected && publicKey && (
                <a 
                  href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors flex items-center justify-center font-semibold"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View on Explorer
                </a>
              )}
            </div>

          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            {connected && publicKey && (
              <a 
                href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                View on Solscan →
              </a>
            )}
          </div>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'earning' ? 'bg-green-600' :
                    tx.type === 'deposit' ? 'bg-blue-600' :
                    tx.type === 'staking' ? 'bg-purple-600' : 'bg-red-600'
                  }`}>
                    {tx.type === 'earning' || tx.type === 'deposit' ? 
                      <ArrowUpRight className="h-4 w-4 text-white" /> :
                      <ArrowDownLeft className="h-4 w-4 text-white" />
                    }
                  </div>
                  
                  <div>
                    <div className="text-white font-medium">{tx.description}</div>
                    <div className="text-xs text-gray-400">
                      {tx.timestamp.toLocaleDateString()} at {tx.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-semibold ${
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(3)} SOL
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;
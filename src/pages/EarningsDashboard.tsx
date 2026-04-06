import { useState } from 'react';
import { TrendingUp, Users, Calendar, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useSolanaBalance } from '../hooks/useSolanaBalance';
import { useWallet } from '@solana/wallet-adapter-react';
import solanaLogo from '../assets/solana-logo.png';

const EarningsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { balance, loading } = useSolanaBalance();
  const { connected, publicKey } = useWallet();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const earningsData = {
    total: 0,
    thisMonth: 0,
    growth: 0,
    queryCount: 0
  };

  const capsuleEarnings = [
    {
      id: '1',
      name: 'Pokemon Strategy Master',
      category: 'Gaming',
      queries: 487,
      revenue: 8.45,
      avgPrice: 0.02,
      trend: 15.2
    },
    {
      id: '2',
      name: 'Crypto Trading Intelligence',
      category: 'Finance',
      queries: 312,
      revenue: 6.80,
      avgPrice: 0.05,
      trend: -2.1
    },
    {
      id: '3',
      name: 'Fitness Coach Pro',
      category: 'Health',
      queries: 198,
      revenue: 3.67,
      avgPrice: 0.03,
      trend: 8.7
    }
  ];


  // Mock chart data
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    earnings: Math.random() * 0.5 + 0.1
  }));

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Earnings Dashboard</h1>
            <p className="text-gray-400">
              {connected && publicKey ? shortenAddress(publicKey.toBase58()) : 'Connect wallet to view earnings'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <img src={solanaLogo} alt="SOL" className="h-5 w-5" />
              <span className="text-gray-400">Wallet Balance</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : connected ? `${balance?.toFixed(4) ?? '0'} SOL` : 'N/A'}
            </div>
            <div className="text-sm text-gray-400">{connected ? 'Connected' : 'Not connected'}</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">Capsule Earnings</span>
            </div>
            <div className="text-2xl font-bold text-white">{earningsData.thisMonth} SOL</div>
            <div className="text-sm text-gray-400">This month</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="text-gray-400">Total Queries</span>
            </div>
            <div className="text-2xl font-bold text-white">{earningsData.queryCount}</div>
            <div className="text-sm text-gray-400">Across all capsules</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-400">Avg Revenue</span>
            </div>
            <div className="text-2xl font-bold text-white">0.00</div>
            <div className="text-sm text-gray-400">SOL per query</div>
          </div>
        </div>

        {/* View on Explorer */}
        {connected && publicKey && (
          <div className="mb-8">
            <a 
              href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View full transaction history on Solana Explorer
            </a>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Chart */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Earnings</h3>
            <div className="h-64 flex items-end space-x-1 mb-4">
              {chartData.map((data, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t-sm flex-1 min-w-0 transition-all hover:bg-blue-400"
                  style={{ height: `${(data.earnings / 0.6) * 100}%` }}
                  title={`Day ${data.day}: ${data.earnings.toFixed(3)} SOL`}
                ></div>
              ))}
            </div>
            <div className="text-center text-gray-400 text-sm">Last 30 days</div>
          </div>

          {/* Top Performing Capsules */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Capsule</h3>
            <div className="space-y-4">
              {capsuleEarnings.slice(0, 3).map((capsule, index) => (
                <div key={capsule.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{capsule.name}</div>
                      <div className="text-sm text-gray-400">{capsule.queries} queries</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{capsule.revenue} SOL</div>
                    <div className={`text-sm ${capsule.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {capsule.trend > 0 ? '+' : ''}{capsule.trend}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Capsule Details */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Capsule Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="text-left pb-3">Capsule</th>
                  <th className="text-right pb-3">Queries</th>
                  <th className="text-right pb-3">Revenue</th>
                  <th className="text-right pb-3">Trend</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {capsuleEarnings.map((capsule) => (
                  <tr key={capsule.id} className="border-t border-gray-700">
                    <td className="py-3">
                      <div>
                        <div className="text-white font-medium">{capsule.name}</div>
                        <div className="text-sm text-gray-400">{capsule.category}</div>
                      </div>
                    </td>
                    <td className="text-right py-3 text-white">{capsule.queries}</td>
                    <td className="text-right py-3 text-green-400 font-semibold">{capsule.revenue} SOL</td>
                    <td className="text-right py-3">
                      <span className={`flex items-center justify-end space-x-1 ${
                        capsule.trend > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <ArrowUpRight className={`h-3 w-3 ${capsule.trend < 0 ? 'rotate-180' : ''}`} />
                        <span className="text-sm">{Math.abs(capsule.trend)}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
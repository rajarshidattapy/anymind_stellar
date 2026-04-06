import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, ExternalLink, MessageSquare, Play, Star, TrendingUp, User } from 'lucide-react';
import { useCapsuleQuery } from '../hooks/useCapsuleQuery';
import { useApiClient } from '../lib/api';
import { useWallet } from '../contexts/WalletContextProvider';

const CapsuleDetail = () => {
  const { id } = useParams();
  const { publicKey, connected, connecting, connect } = useWallet();
  const apiClient = useApiClient();
  const { queryWithPayment, loading: queryLoading, error: queryError, clearError, getStellarExplorerUrl } = useCapsuleQuery();

  const [activeTab, setActiveTab] = useState<'overview' | 'trial' | 'reviews'>('overview');
  const [capsule, setCapsule] = useState<any>(null);
  const [loadingCapsule, setLoadingCapsule] = useState(true);
  const [capsuleError, setCapsuleError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [stellarTxHash, setStellarTxHash] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      void fetchCapsule();
    }
  }, [id]);

  const fetchCapsule = async () => {
    try {
      setLoadingCapsule(true);
      const data = await apiClient.getCapsule(id!);
      setCapsule(data);
      setCapsuleError(null);
    } catch (error) {
      console.error('Error fetching capsule:', error);
      setCapsuleError(error instanceof Error ? error.message : 'Failed to load capsule');
      setCapsule({
        id,
        name: 'DeFi Yield Farming Expert',
        category: 'Finance',
        creator_wallet: 'GDemoCreatorWalletAddress0000000000000000000000000000',
        reputation: 98,
        stake_amount: 1200,
        price_per_query: 0.05,
        description:
          'Advanced yield farming strategies across multiple protocols with real-time risk assessment and opportunity identification.',
        metadata: {
          knowledge: [
            'Multi-protocol yield optimization',
            'Impermanent loss calculation',
            'Risk assessment frameworks',
            'APY vs APR analysis',
            'Smart contract risk evaluation',
            'Liquidity mining strategies',
          ],
        },
        query_count: 1547,
        rating: 4.9,
      });
    } finally {
      setLoadingCapsule(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnectWallet = async () => {
    await connect();
  };

  const handleQuerySubmit = async () => {
    if (!connected) {
      alert('Please connect a Stellar wallet first');
      return;
    }

    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    clearError();
    setQueryResponse(null);
    setStellarTxHash(null);
    setPaymentMethod(null);

    const result = await queryWithPayment(
      id!,
      question,
      capsule.creator_wallet,
      capsule.price_per_query
    );

    if (result) {
      setQueryResponse(result.response);
      setStellarTxHash(result.stellar_tx_hash || null);
      setPaymentMethod(result.payment_method || null);
      setQuestion('');
    }
  };

  const exampleQuestions = [
    'What are the best yield farming opportunities on Ethereum right now?',
    'How do I calculate impermanent loss for an ETH/USDC pool?',
    'What are the risks of providing liquidity to Curve pools?',
  ];

  const mockReviews = [
    {
      id: '1',
      user: 'DeFiTrader',
      rating: 5,
      comment:
        'Incredibly detailed analysis of yield farming opportunities. Helped me optimize my portfolio across 3 protocols.',
      timestamp: '2 days ago',
    },
    {
      id: '2',
      user: 'CryptoNovice',
      rating: 4,
      comment:
        'Great for understanding the basics of yield farming. Could use more beginner-friendly explanations.',
      timestamp: '1 week ago',
    },
  ];

  if (loadingCapsule) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading capsule...</div>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-400 text-xl">Capsule not found</div>
      </div>
    );
  }

  const knowledge = capsule.metadata?.knowledge || [];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {capsuleError && (
          <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div className="text-yellow-200 text-sm">Note: Using demo data. {capsuleError}</div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{capsule.name}</h1>
              <p className="text-blue-400 text-lg">{capsule.category}</p>
              <div className="flex items-center space-x-4 mt-3 text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-mono">{capsule.creator_wallet?.substring(0, 8)}...</span>
                </div>
                {capsule.reputation !== undefined && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{capsule.reputation}% reputation</span>
                  </div>
                )}
                {capsule.rating !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{capsule.rating} rating</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">${capsule.price_per_query} USDC</div>
              <div className="text-gray-400 text-sm">per query (Stellar x402)</div>
              <div className="text-gray-500 text-xs mt-1">Settled on Stellar testnet</div>
              <div className="mt-4 space-x-3">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  disabled
                >
                  Subscribe
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
                  onClick={() => setActiveTab('trial')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Try Now
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {capsule.stake_amount !== undefined && (
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{capsule.stake_amount}</div>
                <div className="text-sm text-gray-400">XLM Staked</div>
              </div>
            )}
            {capsule.query_count !== undefined && (
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{capsule.query_count}</div>
                <div className="text-sm text-gray-400">Total Queries</div>
              </div>
            )}
            {capsule.trial_queries !== undefined && (
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{capsule.trial_queries}</div>
                <div className="text-sm text-gray-400">Free Trials</div>
              </div>
            )}
            {capsule.rating !== undefined && (
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{capsule.rating}</div>
                <div className="text-sm text-gray-400">Rating</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="border-b border-gray-700">
            <div className="flex">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'trial', label: 'Try It Out' },
                { id: 'reviews', label: 'Reviews' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'trial' | 'reviews')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">About This Capsule</h3>
                  <p className="text-gray-300 leading-relaxed">{capsule.description}</p>
                </div>

                {knowledge.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">What This Capsule Knows</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {knowledge.map((item: string, index: number) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                            <span className="text-white">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trial' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    OK
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Try This Capsule</h3>
                  <p className="text-gray-400">
                    {capsule.price_per_query > 0
                      ? `Ask a question for $${capsule.price_per_query} USDC via Stellar`
                      : 'Ask a question for free'}
                  </p>
                  {capsule.price_per_query > 0 && (
                    <div className="mt-3 space-y-3">
                      <p className="text-gray-500 text-xs">
                        {connected && publicKey
                          ? `Stellar wallet connected: ${shortenAddress(publicKey)}`
                          : 'Connect a Stellar wallet to complete the x402 payment flow.'}
                      </p>
                      {!connected && (
                        <button
                          onClick={() => void handleConnectWallet()}
                          disabled={connecting}
                          className="inline-flex items-center justify-center rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {connecting ? 'Connecting Stellar...' : 'Connect Stellar Wallet'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!connected && (
                  <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                    <div className="text-yellow-200">
                      Connect a Stellar wallet to query this capsule
                    </div>
                  </div>
                )}

                {queryError && (
                  <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                    <div className="text-red-200">{queryError}</div>
                  </div>
                )}

                {queryResponse && (
                  <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-blue-400 font-semibold">Response:</h4>
                      <div className="flex items-center gap-3">
                        {paymentMethod && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                            Paid via Stellar USDC
                          </span>
                        )}
                        {stellarTxHash && (
                          <a
                            href={getStellarExplorerUrl(stellarTxHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                          >
                            View on Stellar <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300">{queryResponse}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-white font-medium">Example Questions:</h4>
                  {exampleQuestions.map((exampleQuestion, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestion(exampleQuestion)}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-left text-gray-300 p-4 rounded-lg transition-colors flex items-center justify-between"
                      disabled={queryLoading}
                    >
                      <span>{exampleQuestion}</span>
                      <MessageSquare className="h-5 w-5 text-gray-500" />
                    </button>
                  ))}
                </div>

                <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-6">
                  <h4 className="text-blue-400 font-semibold mb-4">Custom Question</h4>
                  <input
                    type="text"
                    placeholder="Ask your own question..."
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={queryLoading || !connected}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-4 disabled:opacity-50"
                  />
                  <button
                    onClick={handleQuerySubmit}
                    disabled={queryLoading || !connected || !question.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {queryLoading
                      ? 'Processing Payment & Query...'
                      : capsule.price_per_query > 0
                        ? `Ask Question ($${capsule.price_per_query} USDC)`
                        : 'Ask Question (Free)'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">User Reviews</h3>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">{capsule.rating || 'N/A'}</span>
                    <span className="text-gray-400">({mockReviews.length} reviews)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="bg-gray-700 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {review.user[0]}
                          </div>
                          <span className="text-white font-medium">{review.user}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                              }`}
                            />
                          ))}
                          <span className="text-gray-400 text-sm ml-2">{review.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">Leave a Review</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Rating:</span>
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className="h-5 w-5 text-gray-500 hover:text-yellow-400 cursor-pointer"
                        />
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your experience with this capsule..."
                      className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                      rows={3}
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapsuleDetail;

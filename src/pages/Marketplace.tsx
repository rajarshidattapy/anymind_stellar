import { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, ShoppingCart, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useApiClient } from '../lib/api';
import { sendPayment } from '../utils/solanaPayment';

interface MarketplaceCapsule {
  id: string;
  name: string;
  category: string;
  creator_wallet: string;
  reputation: number;
  stake_amount: number;
  price_per_query: number;
  description: string;
  query_count: number;
  rating: number;
}

const Marketplace = () => {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [capsules, setCapsules] = useState<MarketplaceCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [buyingCapsuleId, setBuyingCapsuleId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('Marketplace component mounted');
    return () => {
      console.log('Marketplace component unmounted');
    };
  }, []);

  // Listen for capsule staked events and refresh
  useEffect(() => {
    const handleCapsuleStaked = (event: CustomEvent) => {
      console.log('Capsule staked event received:', event.detail);
      // Refresh capsules when a new one is staked
      fetchCapsules();
    };

    window.addEventListener('capsuleStaked', handleCapsuleStaked as EventListener);
    return () => {
      window.removeEventListener('capsuleStaked', handleCapsuleStaked as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only set up listener once on mount

  const sortOptions = [
    { value: 'popular', label: 'Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  useEffect(() => {
    fetchCapsules();
    fetchCategories();
  }, [selectedCategory, sortBy]);

  // Fetch on mount to ensure we get latest data when navigating to marketplace
  useEffect(() => {
    fetchCapsules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {
        sort_by: sortBy
      };
      
      if (selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }
      
      console.log('Fetching marketplace with filters:', filters);
      const data = await apiClient.browseMarketplace(filters) as MarketplaceCapsule[];
      console.log('Marketplace response:', data);
      console.log('Number of capsules received:', data.length);
      
      // Also get staked capsules from localStorage (for immediate display after staking)
      try {
        const stakedCapsules = JSON.parse(localStorage.getItem('staked_capsules') || '[]') as any[];
        console.log('Staked capsules from localStorage:', stakedCapsules);
        
        // Merge backend data with localStorage data
        // Create a map of existing capsules by a unique key (name + creator_wallet)
        const existingMap = new Map<string, MarketplaceCapsule>();
        data.forEach(capsule => {
          const key = `${capsule.name}-${capsule.creator_wallet}`;
          existingMap.set(key, capsule);
        });
        
        // Add staked capsules from localStorage that aren't already in backend data
        stakedCapsules.forEach((staked: any) => {
          const key = `${staked.name}-${staked.creator_wallet}`;
          if (!existingMap.has(key) && staked.stake_amount > 0) {
            // Only add if stake_amount > 0
            existingMap.set(key, {
              id: staked.id,
              name: staked.name,
              category: staked.category,
              creator_wallet: staked.creator_wallet,
              reputation: staked.reputation || 0,
              stake_amount: staked.stake_amount,
              price_per_query: staked.price_per_query,
              description: staked.description,
              query_count: staked.query_count || 0,
              rating: staked.rating || 0
            });
          }
        });
        
        // Convert map back to array
        const mergedCapsules = Array.from(existingMap.values());
        console.log('Merged capsules (backend + localStorage):', mergedCapsules.length);
        setCapsules(mergedCapsules);
      } catch (localStorageErr) {
        console.error('Error reading from localStorage:', localStorageErr);
        // Fallback to just backend data
        setCapsules(data);
      }
    } catch (err) {
      console.error('Error fetching capsules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await apiClient.browseMarketplace({}) as MarketplaceCapsule[];
      const uniqueCategories = ['All', ...new Set(cats.map(c => c.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback to default categories
      setCategories(['All', 'Finance', 'Gaming', 'Health', 'Technology', 'Education']);
    }
  };

  const handleBuy = async (capsule: MarketplaceCapsule) => {
    if (!connected || !publicKey || !signTransaction) {
      alert('Please connect your wallet to purchase this capsule');
      return;
    }

    setBuyingCapsuleId(capsule.id);
    setError(null);
    setPurchaseSuccess(null);

    try {
      // Send 0.22 SOL payment to the creator
      const paymentResult = await sendPayment(
        connection,
        publicKey,
        capsule.creator_wallet,
        0.22, // Fixed price: 0.22 SOL
        signTransaction
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Show success message
      setPurchaseSuccess(capsule.id);
      
      // Show success alert
      alert(`Successfully purchased ${capsule.name}!\n\nTransaction: ${paymentResult.signature}\n\nYou can now access this chat.`);
      
      // Navigate to capsule detail page after a short delay
      setTimeout(() => {
        navigate(`/app/marketplace/${capsule.id}`);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      setError(message);
      alert(`Purchase failed: ${message}`);
      console.error('Buy error:', err);
    } finally {
      setBuyingCapsuleId(null);
    }
  };

  const filteredCapsules = capsules.filter(capsule => {
    const matchesSearch = searchQuery === '' || 
                         capsule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         capsule.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover and access AI memory capsules from the community</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading marketplace...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-6 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Purchase Success State */}
        {purchaseSuccess && (
          <div className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-6 mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-green-400 font-semibold mb-1">Purchase Successful!</h3>
              <p className="text-green-200 text-sm">You have successfully purchased this chat. Redirecting...</p>
            </div>
          </div>
        )}

        {/* Capsule Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCapsules.map((capsule) => (
                <div key={capsule.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{capsule.name}</h3>
                      <p className="text-sm text-blue-400">{capsule.category}</p>
                    </div>
                    {capsule.rating > 0 && (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{capsule.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{capsule.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span className="font-mono text-xs">{capsule.creator_wallet?.substring(0, 8)}...</span>
                    {capsule.reputation > 0 && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{capsule.reputation.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-green-400 font-semibold">{capsule.stake_amount.toFixed(1)}</div>
                      <div className="text-gray-400">SOL Staked</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-blue-400 font-semibold">{capsule.query_count}</div>
                      <div className="text-gray-400">Queries</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-purple-400 font-semibold">{capsule.price_per_query.toFixed(3)}</div>
                      <div className="text-gray-400">SOL/query</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBuy(capsule)}
                      disabled={!connected || buyingCapsuleId === capsule.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center"
                    >
                      {buyingCapsuleId === capsule.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Buy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCapsules.length === 0 && !loading && (
              <div className="text-center py-12">
                {capsules.length === 0 ? (
                  <>
                    <div className="text-gray-400 mb-2 text-lg">No capsules available in the marketplace yet</div>
                    <div className="text-gray-500 text-sm mb-4">
                      Stake on your agents in the Staking tab to make them available here
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 mb-2">No capsules found matching your criteria</div>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
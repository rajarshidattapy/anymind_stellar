import { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../lib/api';
import { useWallet } from '../contexts/WalletContextProvider';

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
  const { connected, connecting, connect } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [capsules, setCapsules] = useState<MarketplaceCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [openingCapsuleId, setOpeningCapsuleId] = useState<string | null>(null);

  useEffect(() => {
    const handleCapsuleStaked = () => {
      void fetchCapsules();
    };

    window.addEventListener('capsuleStaked', handleCapsuleStaked as EventListener);
    return () => {
      window.removeEventListener('capsuleStaked', handleCapsuleStaked as EventListener);
    };
  }, []);

  const sortOptions = [
    { value: 'popular', label: 'Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  useEffect(() => {
    void fetchCapsules();
    void fetchCategories();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    void fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: Record<string, string> = {
        sort_by: sortBy,
      };

      if (selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }

      const data = await apiClient.browseMarketplace(filters) as MarketplaceCapsule[];

      try {
        const stakedCapsules = JSON.parse(localStorage.getItem('staked_capsules') || '[]') as MarketplaceCapsule[];
        const existingMap = new Map<string, MarketplaceCapsule>();

        data.forEach((capsule) => {
          const key = `${capsule.name}-${capsule.creator_wallet}`;
          existingMap.set(key, capsule);
        });

        stakedCapsules.forEach((staked) => {
          const key = `${staked.name}-${staked.creator_wallet}`;
          if (!existingMap.has(key) && staked.stake_amount > 0) {
            existingMap.set(key, staked);
          }
        });

        setCapsules(Array.from(existingMap.values()));
      } catch (localStorageError) {
        console.error('Error reading staked capsules:', localStorageError);
        setCapsules(data);
      }
    } catch (nextError) {
      console.error('Error fetching capsules:', nextError);
      setError(nextError instanceof Error ? nextError.message : 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiClient.browseMarketplace({}) as MarketplaceCapsule[];
      const uniqueCategories = ['All', ...new Set(data.map((capsule) => capsule.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (nextError) {
      console.error('Error fetching categories:', nextError);
      setCategories(['All', 'Finance', 'Gaming', 'Health', 'Technology', 'Education']);
    }
  };

  const handleOpenCapsule = async (capsule: MarketplaceCapsule) => {
    setOpeningCapsuleId(capsule.id);
    setError(null);

    try {
      if (!connected) {
        const address = await connect();
        if (!address) {
          setError('Connect a Stellar wallet to open and query capsules.');
          return;
        }
      }

      navigate(`/app/marketplace/${capsule.id}`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Failed to open capsule';
      setError(message);
    } finally {
      setOpeningCapsuleId(null);
    }
  };

  const filteredCapsules = capsules.filter((capsule) => {
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
          <p className="text-gray-400">
            Discover AI intelligence capsules backed by Stellar stake and unlocked with x402 payments.
          </p>
        </div>

        <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-4 mb-6 flex items-start">
          <ExternalLink className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
          <div className="text-blue-100 text-sm">
            Capsule access now happens inside the capsule detail page. Query payments are handled there with Stellar x402.
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading marketplace...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-6 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

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
                      <div className="text-gray-400">XLM Staked</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-blue-400 font-semibold">{capsule.query_count}</div>
                      <div className="text-gray-400">Queries</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-purple-400 font-semibold">${capsule.price_per_query.toFixed(3)}</div>
                      <div className="text-gray-400">USDC/query</div>
                    </div>
                  </div>

                  <button
                    onClick={() => void handleOpenCapsule(capsule)}
                    disabled={openingCapsuleId === capsule.id || connecting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center"
                  >
                    {openingCapsuleId === capsule.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Opening...
                      </>
                    ) : connected ? (
                      'Open Capsule'
                    ) : (
                      'Connect Wallet'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {filteredCapsules.length === 0 && !loading && (
              <div className="text-center py-12">
                {capsules.length === 0 ? (
                  <>
                    <div className="text-gray-400 mb-2 text-lg">No capsules available in the marketplace yet</div>
                    <div className="text-gray-500 text-sm mb-4">
                      Add XLM backing from the Staking tab to make your agents available here.
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

import { useState } from 'react';
import { Package, CreditCard as Edit, Share, DollarSign, Brain, TrendingUp, Clock, Users } from 'lucide-react';

interface MemoryCapsule {
  id: string;
  name: string;
  category: string;
  interactions: number;
  confidence: number;
  lastUpdated: Date;
  description: string;
  knowledge: string[];
  price: number;
  trialQueries: number;
  isActive: boolean;
}

const MemoryCapsuleView = () => {
  const [selectedCapsule, setSelectedCapsule] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'summary' | 'knowledge' | 'trial' | 'monetization'>('summary');

  const capsules: MemoryCapsule[] = [
    {
      id: '1',
      name: 'Pokémon Strategy Master',
      category: 'Gaming → Pokémon',
      interactions: 247,
      confidence: 92,
      lastUpdated: new Date(),
      description: 'This capsule contains comprehensive Pokémon battle strategies, type matchups, and team-building heuristics learned through extensive competitive analysis and battle simulations.',
      knowledge: [
        'Team composition optimization',
        'Type effectiveness and matchup analysis',
        'Competitive tier rankings',
        'Move set recommendations',
        'EV/IV optimization strategies',
        'Meta game adaptation patterns'
      ],
      price: 0.01,
      trialQueries: 3,
      isActive: true
    },
    {
      id: '2',
      name: 'Crypto Trading Intelligence',
      category: 'Finance → Trading',
      interactions: 412,
      confidence: 88,
      lastUpdated: new Date(Date.now() - 86400000),
      description: 'Advanced cryptocurrency trading strategies and market analysis patterns derived from real-time market discussions and trading scenarios.',
      knowledge: [
        'Technical analysis patterns',
        'Risk management protocols',
        'Market sentiment analysis',
        'DeFi protocol evaluation',
        'Portfolio optimization strategies'
      ],
      price: 0.05,
      trialQueries: 5,
      isActive: true
    }
  ];

  const currentCapsule = capsules.find(c => c.id === selectedCapsule);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Package },
    { id: 'knowledge', label: 'What This Knows', icon: Brain },
    { id: 'trial', label: 'Trial Mode', icon: Users },
    { id: 'monetization', label: 'Monetization', icon: DollarSign }
  ];

  return (
    <div className="flex h-screen">
      {/* Capsule List */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Memory Capsules</h2>
          
          <div className="space-y-4">
            {capsules.map((capsule) => (
              <button
                key={capsule.id}
                onClick={() => setSelectedCapsule(capsule.id)}
                className={`w-full text-left p-4 rounded-lg transition-colors border ${
                  selectedCapsule === capsule.id 
                    ? 'bg-gray-700 border-blue-500' 
                    : 'bg-gray-750 hover:bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white">{capsule.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${capsule.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                </div>
                
                <div className="text-sm text-gray-400 mb-3">{capsule.category}</div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Interactions:</span>
                    <span className="text-white ml-1">{capsule.interactions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span className="text-green-400 ml-1">{capsule.confidence}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentCapsule && (
          <div className="p-8">
            {/* Capsule Overview */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{currentCapsule.name}</h1>
                  <p className="text-gray-400">{currentCapsule.category}</p>
                  <p className="text-sm text-gray-500 mt-1">Created by: You</p>
                </div>
                
                <div className="flex space-x-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <Share className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Prepare for Marketplace
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-sm text-gray-400">Interactions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{currentCapsule.interactions}</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm text-gray-400">Confidence</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{currentCapsule.confidence}%</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-sm text-gray-400">Last Updated</span>
                  </div>
                  <div className="text-sm font-medium text-white">
                    {currentCapsule.lastUpdated.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="border-b border-gray-700">
                <div className="flex">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 border-blue-500 text-blue-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-8">
                {activeTab === 'summary' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Auto-Generated Summary</h3>
                    <p className="text-gray-300 leading-relaxed">{currentCapsule.description}</p>
                  </div>
                )}

                {activeTab === 'knowledge' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Knowledge Areas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {currentCapsule.knowledge.map((item, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 text-blue-400 mr-2" />
                            <span className="text-white font-medium">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'trial' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Trial Access</h3>
                    <div className="bg-gray-700 rounded-lg p-6 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-2">{currentCapsule.trialQueries}</div>
                        <p className="text-gray-400">Free trial queries available</p>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-white mb-3">Example Questions Users Can Try:</h4>
                    <div className="space-y-2">
                      <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                        "What's the best team composition for OU tier?"
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                        "How do I counter Dragapult in the current meta?"
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                        "What are optimal EVs for a bulky Toxapex build?"
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'monetization' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Price per Query (SOL)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={currentCapsule.price}
                        className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                        placeholder="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Trial Queries
                      </label>
                      <input
                        type="number"
                        value={currentCapsule.trialQueries}
                        className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-white">Allow Forking</div>
                        <div className="text-sm text-gray-400">Let others create derivatives of this capsule</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
                      Save Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryCapsuleView;
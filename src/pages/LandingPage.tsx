import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  MessageSquare,
  Package,
  Store,
  ArrowRight,
  CheckCircle,
  Zap,
  Search,
  Terminal,
  Github,
  ExternalLink,
} from "lucide-react";
import solanaLogo from "../assets/solana-logo.png";
import appLogo from "../assets/app-logo.png";
import { useSolanaBalance } from "../hooks/useSolanaBalance";

export default function LandingPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { balance, loading } = useSolanaBalance();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectRef = useRef<HTMLDivElement>(null);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (disconnectRef.current && !disconnectRef.current.contains(event.target as Node)) {
        setShowDisconnect(false);
      }
    };

    if (showDisconnect) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDisconnect]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="fixed top-0 w-full z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={appLogo} alt="SolMind" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">SolMind</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="marketplace" className="hover:text-gray-100 transition-colors">
              Marketplace
            </a>
            <a href="#features" className="hover:text-gray-100 transition-colors">
              How it Works
            </a>
            <Link to="/developers" className="hover:text-gray-100 transition-colors">
              Developers
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {connected && publicKey ? (
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
                  <img src={solanaLogo} alt="SOL" className="w-4 h-4" />
                  <span className="text-sm font-medium text-white">
                    {loading ? '...' : `${balance?.toFixed(4) ?? '0'} SOL`}
                  </span>
                </div>
                <div className="relative" ref={disconnectRef}>
                  <button
                    onClick={() => setShowDisconnect(!showDisconnect)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {shortenAddress(publicKey.toBase58())}
                  </button>
                  {showDisconnect && (
                    <div className="absolute top-full right-0 mt-1 z-50">
                      <button
                        onClick={() => {
                          disconnect();
                          setShowDisconnect(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white !px-4 !py-2 !rounded-lg !text-sm !font-medium !transition-colors !h-auto" />
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <section className="container mx-auto px-6 text-center mb-32">
          <div className="inline-flex items-center gap-2 mb-6 py-1 px-3 border border-blue-600/20 bg-blue-600/5 text-blue-400 rounded-full text-sm">
            <img src={solanaLogo} alt="Solana" className="w-4 h-4" />
            v1 live on Solana testnet
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl mx-auto leading-tight">
            Turn AI conversations into <span className="text-blue-400">on-chain intelligence.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            SolMind is a Solana-native AI intelligence marketplace. Chat with agents, package long-term intelligence
            into capsules, and monetize them as revenue-generating assets.
          </p>
          <div className="flex flex-row items-center justify-center gap-6 mt-8">
            {connected ? (
              <Link
                to="/app"
                className="bg-white text-blue-600 font-medium px-8 py-3 rounded-md shadow hover:bg-blue-50 transition-colors border border-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Enter App
              </Link>
            ) : (
              <WalletMultiButton className="!bg-white !text-blue-600 !font-medium !px-8 !py-3 !rounded-md !shadow hover:!bg-blue-50 !transition-colors !border !border-white focus:!outline-none focus:!ring-2 focus:!ring-blue-300 !h-auto" />
            )}
            <Link
              to="/marketplace"
              className="bg-blue-600 text-white font-medium px-8 py-3 rounded-md border border-white shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              View Marketplace
            </Link>
          </div>

          <div className="mt-20 max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 border-b border-gray-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 ml-4 bg-gray-900 px-3 py-1 rounded-md border border-gray-800">
                  <Terminal className="w-3 h-3" />
                  solmind-agent.py
                </div>
              </div>
              <div className="grid md:grid-cols-[1fr_300px]">
                <div className="p-6 text-left font-mono text-sm leading-relaxed overflow-x-auto">
                  <div className="flex gap-4">
                    <span className="text-gray-500">1</span>
                    <span className="text-blue-400">from</span> solmind <span className="text-blue-400">import</span> Agent
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-500">2</span>
                    agent = Agent(
                  </div>
                  <div className="flex gap-4 pl-4">
                    <span className="text-gray-500">3</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;agent_id=<span className="text-green-400">"your-agent-id"</span>,
                  </div>
                  <div className="flex gap-4 pl-4">
                    <span className="text-gray-500">4</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;chat_id=<span className="text-green-400">"your-chat-id"</span>,
                  </div>
                  <div className="flex gap-4 pl-4">
                    <span className="text-gray-500">5</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;wallet_address=<span className="text-green-400">"YourSolanaWalletAddress"</span>,
                  </div>
                  <div className="flex gap-4 pl-4">
                    <span className="text-gray-500">6</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;base_url=<span className="text-green-400">"solmind.ai"</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-500">7</span>
                    )
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-500">8</span>
                    <span>&nbsp;</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-500">9</span>
                    response = agent.chat(<span className="text-green-400">"Your message here"</span>)
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-500">10</span>
                    <span className="text-blue-400">print</span>(response)
                  </div>
                </div>
                <div className="border-l border-gray-800 bg-gray-700/30 p-6 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</span>
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded">
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold tracking-tight">4,821</div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Queries Served</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold tracking-tight text-blue-400">24.1 SOL</div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Total Revenue</div>
                    </div>
                  </div>
                  <button className="w-full text-xs h-8 bg-gray-900 border border-gray-800 hover:bg-white/5 rounded text-white transition-colors">
                    View on Explorer <ExternalLink className="w-3 h-3 ml-2 inline" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-800 rounded-xl overflow-hidden divide-x divide-gray-800">
            {[
              { label: "Saved on Compute", val: "40%", sub: "vs traditional RAG" },
              { label: "Time to Market", val: "98%", sub: "faster deployment" },
              { label: "Revenue Generated", val: "2.4M", sub: "SOL to creators" },
              { label: "Active Capsules", val: "12k+", sub: "intelligence assets" },
            ].map((stat) => (
              <div key={stat.label} className="p-8 hover:bg-white/5 transition-colors">
                <div className="text-3xl font-bold tracking-tighter mb-1">{stat.val}</div>
                <div className="text-sm font-semibold mb-1">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 mb-32">
          <div className="flex flex-col md:flex-row gap-4 items-end justify-between mb-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold tracking-tight mb-4">The lifecycle of intelligence.</h2>
              <p className="text-gray-400">
                SolMind turns ephemeral chats into persistent, composable, and revenue-generating primitives.
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-100 transition-colors group">
              Read the whitepaper <ArrowRight className="ml-2 w-4 h-4 inline group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 overflow-hidden bg-gray-800 border border-gray-700 rounded-xl group">
              <div className="p-0">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 flex flex-col justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center mb-6">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">1. Chat & Compose</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Engage with foundational models. Our intelligence layer structures these conversations into
                      reusable reasoning patterns as you go.
                    </p>
                  </div>
                  <div className="bg-gray-700/50 p-8 flex items-center justify-center">
                    <div className="space-y-3 w-full">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border border-gray-800 bg-gray-900 shadow-sm ${i === 2 ? "translate-x-4 border-blue-600/20 bg-blue-600/5" : ""}`}
                        >
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-700 shrink-0" />
                            <div className="h-4 bg-gray-700 rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-xl group">
              <div className="p-8">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center mb-6">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">2. Package</h3>
                <p className="text-base text-gray-400 mt-4">
                  Seal your intelligence into an Intelligence Capsule. Define metadata, specialized context, and pricing
                  models.
                </p>
              </div>
            </div>

            <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-xl group">
              <div className="p-8">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center mb-6">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">3. Stake</h3>
                <p className="text-base text-gray-400 mt-4">
                  Stake SOL behind your capsule to signal reputation and boost visibility in the marketplace.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 overflow-hidden bg-gray-800 border border-gray-700 rounded-xl group">
              <div className="p-0">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 flex flex-col justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center mb-6">
                      <Store className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">4. Monetize</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Each query to your capsule triggers a lightning-fast Solana micropayment. Permissionless,
                      transparent, and direct.
                    </p>
                  </div>
                  <div className="bg-blue-600 p-8 flex flex-col items-center justify-center text-white text-center">
                    <div className="text-4xl font-bold tracking-tighter mb-2">0.0001s</div>
                    <div className="text-sm font-semibold opacity-80 uppercase tracking-widest">Settlement Time</div>
                    <div className="mt-8 w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="marketplace" className="container mx-auto px-6 mb-32">
          <div className="border border-gray-800 rounded-xl bg-gray-800 overflow-hidden">
            <div className="px-6 py-4 bg-gray-700/50 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                Featured Intelligence Assets
              </h3>
              <div className="flex gap-2">
                <span className="border border-gray-700 bg-gray-900 px-3 py-1 rounded text-sm">
                  All Categories
                </span>
                <span className="border border-gray-700 bg-gray-900 px-3 py-1 rounded text-sm">
                  Trending
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-800">
              {[
                {
                  name: "DeFi Alpha Hunter",
                  creator: "0xAlpha",
                  queries: "12.4k",
                  staked: "450 SOL",
                  price: "0.005",
                  category: "Trading",
                },
                {
                  name: "Legal Contract Analyzer",
                  creator: "LegalMind",
                  queries: "8.2k",
                  staked: "320 SOL",
                  price: "0.01",
                  category: "Legal",
                },
                {
                  name: "Code Review Assistant",
                  creator: "DevDAO",
                  queries: "24.1k",
                  staked: "890 SOL",
                  price: "0.003",
                  category: "Development",
                },
              ].map((capsule, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                      <img src={appLogo} alt="Capsule" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{capsule.name}</div>
                      <div className="text-xs text-gray-400">by {capsule.creator}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{capsule.queries}</div>
                      <div className="text-xs text-gray-400">Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-400">{capsule.staked}</div>
                      <div className="text-xs text-gray-400">Staked</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{capsule.price} SOL</div>
                      <div className="text-xs text-gray-400">per query</div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-gray-700">{capsule.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="developers" className="container mx-auto px-6 mb-32">
          <div className="border border-gray-800 rounded-xl bg-gray-800 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 mb-6 py-1 px-3 border border-gray-700 text-gray-400 rounded-full text-xs w-fit">
                  <Github className="w-3 h-3" />
                  Open Source SDK
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-4">Build on SolMind</h2>
                <p className="text-gray-400 mb-8">
                  Our TypeScript SDK makes it easy to create, query, and monetize intelligence capsules. Full Solana
                  integration out of the box.
                </p>
                <div className="flex gap-4">
                  <Link 
                    to="/developers"
                    className="bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    View Docs
                  </Link>
                  <button className="border border-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 p-8 font-mono text-sm leading-relaxed border-l border-gray-800">
                <div className="text-gray-400 mb-4">// Quick start</div>
                <div>
                  <span className="text-blue-400">npm install</span> @solmind/sdk
                </div>
                <div className="mt-4 text-gray-400">// Query a capsule</div>
                <div>
                  <span className="text-blue-400">const</span> response ={" "}
                  <span className="text-blue-400">await</span> capsule.query({"{"}
                </div>
                <div className="pl-4">
                  prompt: <span className="text-green-400">"Analyze this contract..."</span>
                </div>
                <div>{"}"});</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={appLogo} alt="SolMind" className="w-6 h-6" />
              <span className="font-bold">SolMind</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-100 transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-gray-100 transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-gray-100 transition-colors">
                Discord
              </a>
              <a href="#" className="hover:text-gray-100 transition-colors">
                Twitter
              </a>
            </div>
            <div className="text-xs text-gray-500">© 2024 SolMind Protocol. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

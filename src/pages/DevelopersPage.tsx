import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Package, 
  Terminal, 
  Copy, 
  Check, 
  ArrowLeft,
  Github,
  ExternalLink,
  FileCode,
  BookOpen,
  Zap
} from 'lucide-react';
import appLogo from '../assets/stellarmind.png';

export default function DevelopersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const cloneCode = `git clone https://github.com/rajarshidattapy/anymind_stellar.git
cd anymind_stellar/anymind-sdk`;
  const installationCode = `pip install -e .`;
  const usageCode = `from anymind import Agent

# Initialize agent with wallet address for authentication
agent = Agent(
    agent_id="your-agent-id",
    chat_id="your-chat-id",
    wallet_address="YourStellarAccountID",
    base_url="http://localhost:8000"  # Optional: defaults to localhost:8000
)

# Send a message to the agent
# The message is saved to chat history and memory is automatically updated
response = agent.chat("Your message here")
print(response)`;

  const exampleCode = `from anymind import Agent

# Initialize agent with wallet address for authentication
agent = Agent(
    agent_id="custom-1da9863b",
    chat_id="fe361c2a-4265-41e7-b260-76fd64357688",
    wallet_address="GBRPYHIL2C2A7L3S37JQZKJQBTQUL4H2WQX4J4S6CGN2VZ5F3M6V4T6D",
    base_url="http://localhost:8000"
)

# Send a message to the agent
response = agent.chat("Analyze the chat history and provide a summary of the conversation")

print(response)`;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={appLogo} alt="Anymind" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">Anymind</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link to="/" className="hover:text-gray-100 transition-colors">
              Home
            </Link>
            <Link to="/app" className="hover:text-gray-100 transition-colors">
              App
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Hero Section */}
          <div className="mb-16">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-400 hover:text-gray-100 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight">Developer Documentation</h1>
            </div>
            <p className="text-xl text-gray-400 max-w-2xl">
              Build powerful AI applications with Anymind's SDK. Integrate persistent memory capsules into your projects with just a few lines of code. Pay per query with Stellar x402 USDC micropayments — zero gas fees.
            </p>
          </div>

          {/* Python SDK Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold">Python SDK</h2>
              <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded-full">
                Available Now
              </span>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Github className="w-5 h-5 text-blue-400" />
                Clone Repository
              </h3>
              <p className="text-gray-400 mb-4">
                First, clone the Anymind repository:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-gray-100">{cloneCode}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(cloneCode, 'clone')}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copiedCode === 'clone' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Installation
              </h3>
              <p className="text-gray-400 mb-4">
                Install the Anymind Python SDK using pip:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-gray-100">{installationCode}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(installationCode, 'install')}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copiedCode === 'install' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                Quick Start
              </h3>
              <p className="text-gray-400 mb-4">
                Get started with the Anymind Python SDK in minutes:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-gray-100">{usageCode}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(usageCode, 'usage')}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copiedCode === 'usage' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                Example Usage
              </h3>
              <p className="text-gray-400 mb-4">
                Here's a complete example of using the SDK to interact with an agent:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-gray-100">{exampleCode}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(exampleCode, 'example')}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copiedCode === 'example' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Features
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Simple, intuitive API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Automatic memory management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Chat history persistence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Stellar wallet authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Type-safe responses</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Requirements
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Python 3.8+</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>requests {'>='} 2.31.0</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Stellar account ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Agent ID and Chat ID</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* NPM SDK Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-500" />
              </div>
              <h2 className="text-3xl font-bold">NPM SDK</h2>
              <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-sm font-medium rounded-full">
                Coming Soon
              </span>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-600/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">JavaScript/TypeScript Support</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">
                    We're working on bringing Anymind to the JavaScript ecosystem! The NPM SDK will provide the same powerful features as the Python SDK, with full TypeScript support and seamless integration with Node.js and browser environments.
                  </p>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-300 font-mono">
                      npm install anymind
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Stay tuned for updates. The NPM SDK will be available in a future release.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* x402 Payments Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold">Stellar x402 Payments</h2>
              <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded-full">
                Live on Testnet
              </span>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4">Pay-per-Query with USDC</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Anymind uses the <strong className="text-white">x402 protocol</strong> (by Coinbase) for capsule payments.
                When you query a capsule, the server returns a 402 challenge. Your client signs a Stellar USDC transfer,
                and the facilitator settles it on-chain. <strong className="text-white">Zero gas fees</strong> for buyers —
                the OZ Channels facilitator sponsors all Stellar network fees.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">$0</div>
                  <div className="text-xs text-gray-400">Gas fees for buyers</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">&lt;5s</div>
                  <div className="text-xs text-gray-400">Settlement time</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">USDC</div>
                  <div className="text-xs text-gray-400">Stablecoin payments</div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-white mb-3">How It Works</h4>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm leading-relaxed overflow-x-auto">
                <div className="text-gray-400">{'// 1. Query a capsule — get 402 challenge'}</div>
                <div><span className="text-blue-400">POST</span> /api/v1/capsules/{'{id}'}/query</div>
                <div className="text-gray-500">{'← 402 { x402Version: 2, accepts: [{ network: "stellar:testnet", amount: "10000", ... }] }'}</div>
                <div className="mt-2 text-gray-400">{'// 2. Sign Soroban USDC auth entries (Freighter wallet)'}</div>
                <div className="mt-2 text-gray-400">{'// 3. Retry with X-PAYMENT header'}</div>
                <div><span className="text-blue-400">POST</span> /api/v1/capsules/{'{id}'}/query</div>
                <div className="text-gray-500">  Headers: {'{ "X-PAYMENT": "<base64-encoded-payment>" }'}</div>
                <div className="text-gray-500">{'← 200 { response: "...", payment: { tx_hash, payer, amount_usdc } }'}</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-4">Wallet Requirements</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-2">For Buyers (Querying Capsules)</h4>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">1.</span>
                      <span>Install <strong className="text-white">Freighter</strong> browser extension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">2.</span>
                      <span>Fund with testnet USDC (no XLM needed for payments)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">3.</span>
                      <span>Query any capsule — payment is automatic</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">For Sellers (Capsule Creators)</h4>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">1.</span>
                      <span>Set <code className="bg-gray-700 px-1 rounded text-xs">STELLAR_PAY_TO_ADDRESS</code> to your G... address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">2.</span>
                      <span>Set capsule price — earnings arrive in USDC automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">3.</span>
                      <span>Stake XLM to improve capsule visibility in the marketplace</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Resources Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="https://github.com/rajarshidattapy/anymind_stellar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-600/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <Github className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-2">GitHub Repository</h3>
                <p className="text-gray-400 text-sm">
                  View the source code, contribute, and report issues on GitHub.
                </p>
              </a>

              <a
                href="#"
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-600/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-2">API Documentation</h3>
                <p className="text-gray-400 text-sm">
                  Comprehensive API reference and guides for all SDK methods.
                </p>
              </a>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Start integrating Anymind into your applications today. Join our community and start building the future of AI.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/app"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
              >
                View on GitHub
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


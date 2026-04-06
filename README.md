# Anymind

Anymind is a full-stack AI agent platform for creating, chatting with, packaging, and monetizing intelligence.

It combines:

- Solana for wallet-authenticated app state, staking, and legacy SOL flows
- Stellar for x402 USDC micropayments with sponsored fees
- FastAPI, Supabase, and Redis for backend APIs, storage, and caching
- React + Vite for the frontend

The current app lets users:

- create and manage custom AI agents
- turn agent output into memory capsules
- publish capsules into a marketplace
- query paid capsules through Stellar x402
- use Solana-based staking and legacy payment paths

## What Makes This Repo Different

This is not just a chat UI or a smart contract repo. It is a multi-part product:

- `src/`: frontend application
- `backend/`: FastAPI API, marketplace logic, wallet-aware endpoints, x402 integration
- `contracts/`: Solana smart contracts and staking programs
- `anymind-sdk/`: Python SDK for interacting with agents

## Architecture

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Solana wallet adapter
- Stellar Wallets Kit

### Backend

- FastAPI
- Supabase
- Upstash Redis / Vercel KV
- Mem0
- Tavily
- provider-based LLM integrations

### Blockchain and Payments

- Solana devnet wallet integration
- Solana staking contracts via Anchor
- Stellar x402 USDC payment flow
- OpenZeppelin Channels facilitator for Stellar settlement

## Repository Layout

```text
.
|-- src/                  Frontend app
|   |-- components/       Shared UI
|   |-- contexts/         Wallet and app state
|   |-- hooks/            React hooks
|   |-- pages/            Main product screens
|   `-- utils/            Payment and storage helpers
|-- backend/              FastAPI backend
|   |-- app/
|   |   |-- api/          REST endpoints
|   |   |-- core/         Settings and auth helpers
|   |   |-- db/           Database setup
|   |   |-- models/       Pydantic schemas
|   |   `-- services/     Marketplace, wallet, x402, memory logic
|   `-- supabase/         SQL migrations
|-- contracts/            Solana contract projects
|-- anymind-sdk/          Python SDK
|-- wallet.md             Local note pointing to Stellar Wallets Kit docs
`-- vercel.json           Frontend deployment config
```

## Core Flows

### 1. Agent Creation

Users create custom AI agents, store provider credentials, and chat with those agents through the backend.

### 2. Memory Capsules

Agent knowledge can be packaged into capsules with metadata, pricing, and staking-backed reputation.

### 3. Marketplace

Capsules can be discovered, browsed, and queried from the marketplace UI.

### 4. Payments

Paid capsule queries use two paths:

- preferred: Stellar x402 with USDC
- fallback: legacy Solana payment flow

### 5. Staking

Capsules and creators can use Solana staking mechanics for reputation and marketplace visibility.

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Python 3.9+
- a Supabase project
- an Upstash Redis or Vercel KV instance
- at least one LLM provider key for meaningful agent responses

Optional but useful:

- a Solana wallet such as Phantom
- a Stellar wallet compatible with Stellar Wallets Kit for x402 testing

### 1. Install frontend dependencies

```bash
npm install
```

If you are using PowerShell on Windows and `npm` is blocked by execution policy, use:

```powershell
npm.cmd install
```

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment variables

The frontend only hard-requires:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The backend reads its settings from `backend/.env` and expects values such as:

```env
DEBUG=True
HOST=0.0.0.0
PORT=8000

VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
SUPABASE_SERVICE_KEY=...

KV_REST_API_URL=...
KV_REST_API_TOKEN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

OPENROUTER_API_KEY=...
MEM0_API_KEY=...
TAVILY_API_KEY=...

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

STELLAR_PAY_TO_ADDRESS=...
STELLAR_NETWORK=stellar:testnet
STELLAR_USDC_ASSET=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
FACILITATOR_URL=https://channels.openzeppelin.com/x402/testnet
OZ_RELAYER_API_KEY=...
```

Use these repo files as references:

- `env.example`
- `backend/env.example`

### 4. Start the backend

From the `backend/` directory:

```bash
python main.py
```

The API will start on `http://localhost:8000`.

### 5. Start the frontend

From the repo root:

```bash
npm run dev
```

The app will start on `http://localhost:5173`.

## Frontend Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

## Backend API

Once the backend is running:

- OpenAPI docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

Main route groups:

- `/api/v1/agents`
- `/api/v1/capsules`
- `/api/v1/marketplace`
- `/api/v1/wallet`
- `/api/v1/auth`
- `/api/v1/preferences`

## Wallet Model

The app currently uses two wallet layers:

- Solana wallet adapter for app identity, staking, balances, and legacy flows
- Stellar Wallets Kit for x402-connected Stellar wallets

In practice:

- users can connect a Solana wallet to access most app flows
- users can connect a Stellar wallet when paying for capsule queries via x402
- paid capsule queries can use Stellar first and fall back to Solana where supported

## Stellar x402 Notes

The x402 integration is already wired into the client and backend.

A paid query flow looks like this:

1. The client sends a capsule query.
2. The backend responds with `402 Payment Required` when x402 is active.
3. The client signs a Stellar payment payload through Stellar Wallets Kit.
4. The request is retried with an `X-PAYMENT` header.
5. The facilitator settles the payment and the query completes.

To use this flow locally, make sure:

- `STELLAR_PAY_TO_ADDRESS` is set
- `FACILITATOR_URL` is valid
- the buyer has a compatible Stellar wallet connected

## Solana Contracts

Solana programs live under `contracts/`.

Key directories:

- `contracts/all-contracts/`
- `contracts/solmind-staking/`

If you are working on the staking program:

```bash
cd contracts/solmind-staking
anchor build
anchor deploy
```

## Python SDK

The repo also includes a Python SDK in `anymind-sdk/`.

That package is useful if you want to interact with Anymind agents outside the web app, for example from scripts or backend services.

## Deployment

### Frontend

The frontend is configured for Vercel with `vercel.json`.

### Backend

The backend is configured for Render using:

- `backend/render.yaml`
- `backend/Dockerfile`

## Known Setup Gotchas

- The frontend will fail fast if `VITE_API_BASE_URL` is missing.
- The backend expects Supabase and Redis-style credentials for full functionality.
- Some advanced flows degrade gracefully if optional services like Mem0 or Redis are unavailable.
- PowerShell users on Windows may need `npm.cmd` instead of `npm`.

## Contributing

Before opening a PR, run:

```bash
npm run lint
npm run typecheck
npm run build
```

If you changed backend logic, also validate:

- local API startup
- `/health`
- the relevant wallet or payment flow

## License

Proprietary. This repository is part of the Anymind project.

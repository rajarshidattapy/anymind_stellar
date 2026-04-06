# Anymind 🧠

**Anymind is a full-stack AI agent runtime for creating, monetizing, and distributing intelligence.**

It enables developers and creators to build stateful AI agents, package their intelligence into reusable memory capsules, and monetize access through programmable micropayments.

Built across **AI infra + Web3 rails + developer tooling**, Anymind combines:

- **Stellar** for wallet-authenticated identity, staking signals, and reputation
- **Stellar x402** for USDC micropayments with sponsored fees
- **FastAPI + Supabase + Redis** for backend orchestration and state
- **React + Vite** for a fast, wallet-native frontend
- **Python SDK** for programmatic agent access

This is not another chat UI.

It is a runtime layer for **persistent, portable, and monetizable intelligence**.

---

## Why Anymind?

Most AI products stop at conversations.

Anymind extends intelligence beyond a single session.

With Anymind, intelligence can be:

- **created** as custom agents
- **persisted** as memory capsules
- **published** to a marketplace
- **queried** through paid access
- **staked** for reputation and discovery
- **integrated** via SDKs into external applications

This turns agents from temporary chats into **long-lived economic entities**.

---

## Core Product Flows

### 1. Agent Creation

Create custom AI agents with provider-backed inference.

Agents support:

- custom prompts
- provider credentials
- session memory
- stateful backend interaction
- wallet-aware identity

---

### 2. Memory Capsules

Agent outputs and learned context can be packaged into **memory capsules**.

Each capsule includes:

- metadata
- ownership
- pricing
- access permissions
- creator reputation
- marketplace visibility

Think of capsules as **portable intelligence assets**.

---

### 3. Marketplace

Capsules can be published and monetized through the marketplace.

Users can:

- browse capsules
- discover creators
- query paid intelligence
- access premium agent memory

---

### 4. Payment Rails

Anymind supports dual payment paths.

#### Preferred: Stellar x402 + USDC

Fast programmable micropayments with sponsored fees.

Flow:

Client request  
→ `402 Payment Required`  
→ wallet signature  
→ `X-PAYMENT` header  
→ facilitator settlement  
→ response delivery

#### Wallet Flow

Stellar Wallets Kit powers connection, account identity, and signing across the frontend.

---

### 5. Staking + Reputation

Creators and capsules can participate in Stellar-first staking flows.

Staking powers:

- reputation scoring
- marketplace ranking
- creator trust
- discovery visibility

This creates an economic trust layer around intelligence.

---

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Stellar Wallets Kit
- Stellar Wallets Kit

### Backend

- FastAPI
- Supabase
- Upstash Redis / Vercel KV
- Mem0
- Tavily
- provider-based LLM integrations

### Blockchain + Payments

- Stellar testnet
- Soroban migration in progress
- Stellar x402
- OpenZeppelin Channels facilitator

---

## Repository Structure

```text
.
├── src/                     Frontend application
│   ├── components/          Shared UI components
│   ├── contexts/            Wallet + global state
│   ├── hooks/               Custom React hooks
│   ├── pages/               Main product screens
│   └── utils/               Payments + helpers
│
├── backend/                 FastAPI backend
│   ├── app/
│   │   ├── api/             REST endpoints
│   │   ├── core/            Settings + auth
│   │   ├── db/              Database setup
│   │   ├── models/          Pydantic schemas
│   │   └── services/        Core business logic
│   └── supabase/            SQL migrations
│
├── contracts/               Legacy contracts / migration work
├── anymind-sdk/             Python SDK
├── wallet.md
└── vercel.json
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm
- Python 3.9+
- Supabase project
- Redis / Upstash / Vercel KV
- LLM provider API key

Optional:

- Freighter or another Stellar-compatible wallet
- Stellar-compatible wallet

---

## 1. Install Frontend

```bash
npm install
```

PowerShell:

```powershell
npm.cmd install
```

---

## 2. Install Backend

```bash
cd backend
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

### Frontend

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

```env
DEBUG=True
HOST=0.0.0.0
PORT=8000

SUPABASE_SERVICE_KEY=...
OPENROUTER_API_KEY=...
MEM0_API_KEY=...
TAVILY_API_KEY=...

STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

STELLAR_PAY_TO_ADDRESS=...
STELLAR_NETWORK=stellar:testnet
FACILITATOR_URL=https://channels.openzeppelin.com/x402/testnet
```

Use:

- `env.example`
- `backend/env.example`

as reference templates.

---

## 4. Run Backend

```bash
cd backend
python main.py
```

Backend runs at:

```text
http://localhost:8000
```

---

## 5. Run Frontend

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## Frontend Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript checks |

---

## Backend API

- `/docs`
- `/redoc`
- `/health`

### Route Groups

- `/api/v1/agents`
- `/api/v1/capsules`
- `/api/v1/marketplace`
- `/api/v1/wallet`
- `/api/v1/auth`
- `/api/v1/preferences`

---

## Smart Contracts

Programs live inside `contracts/`.

Build + deploy:

```bash
cd contracts/solmind-staking
anchor build
anchor deploy
```

---

## Python SDK

The `anymind-sdk/` package enables agent access from:

- scripts
- external backends
- automations
- third-party products

This makes Anymind portable beyond the web app.

---

## Deployment

### Frontend

- Vercel

### Backend

- Render
- Dockerized deployment support

Files:

- `backend/render.yaml`
- `backend/Dockerfile`

---

## Known Gotchas

- frontend requires `VITE_API_BASE_URL`
- backend expects Supabase + Redis for full functionality
- advanced memory flows degrade gracefully without optional services
- PowerShell may require `npm.cmd`

---

## Vision

Anymind is building toward an **agentic internet** where intelligence is no longer session-bound.

Instead of isolated prompts, intelligence becomes:

- persistent
- composable
- monetizable
- portable
- economically native

The long-term goal is to make AI agents function like programmable digital entities.

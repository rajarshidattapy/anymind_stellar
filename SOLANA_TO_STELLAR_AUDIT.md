# Solana to Stellar Audit

This file lists the places where Solana is still explicitly mentioned or used in the codebase, so they can be swapped out for Stellar-first use cases.

## How to Read This

- `User-facing copy`: visible product text that still says `Solana`, `SOL`, `Phantom`, or related terms.
- `Frontend logic`: actual Solana wallet/payment code that still powers app behavior.
- `Backend logic`: API, config, or schema paths that still assume Solana.
- `Contracts/tooling`: Solana and Anchor projects that are still present in the repo.
- `Low priority/noisy`: generated or supporting files that are not the first place to edit.

## 1. Highest-Priority User-Facing Mentions

These are the places users will still see Solana language in the product.

### Landing page

- `src/pages/LandingPage.tsx`
  - line 259: `24.1 SOL`
  - line 277: `SOL to creators`
  - line 355: `Stake SOL behind your capsule`
  - line 370: `Solana staking for reputation`
  - line 454: marketplace card price still says `SOL`
  - line 475: developer section still says `Full Solana ...`

### Capsule detail

- `src/pages/CapsuleDetail.tsx`
  - line 200: `or {capsule.price_per_query} SOL (legacy)`
  - line 223: `SOL Staked`
  - line 313: `use a Solana wallet for the legacy fallback flow`
  - line 332: `Connect a Solana or Stellar wallet`
  - line 351: `Solana SOL`
  - line 361: `View on Solana`

### Wallet and earnings pages

- `src/pages/WalletBalance.tsx`
  - line 54: `Connect your Solana wallet to view balance`
- `src/pages/EarningsDashboard.tsx`
  - uses Solana balance hook and Solana wallet adapter

### Marketplace and staking screens

- `src/pages/Marketplace.tsx`
  - line 169: `Send 0.22 SOL payment to the creator`
  - line 174: `Fixed price: 0.22 SOL`
  - line 317: `SOL Staked`
  - line 325: `SOL/query`
- `src/pages/Staking.tsx`
  - line 90 onward: multiple `SOL` strings and comments
  - line 172: success alert says `staked ${amount} SOL`
  - line 205: `Stake SOL on your agents`
  - line 222: total staked in `SOL`
  - line 288: `Currently staked: ... SOL`
  - line 297: `Enter stake amount (SOL)`
- `src/pages/MemoryCapsuleView.tsx`
  - line 248: `Price per Query (SOL)`

### Developers/docs pages inside the app

- `src/pages/DevelopersPage.tsx`
  - line 36: `YourSolanaWalletAddress`
  - line 240: `Solana wallet authentication`
  - line 265: `Solana wallet address`
  - line 393: `Solana payment fallback`

### Shared navigation

- `src/components/Navbar.tsx`
  - line 54: balance display still renders `SOL`

## 2. Frontend Solana Logic Still in Use

These are the main code paths to replace if you want the app to become truly Stellar-first.

### Wallet providers and hooks

- `src/contexts/WalletContextProvider.tsx`
  - Solana wallet adapter provider
  - Phantom adapter
  - Solana devnet RPC endpoint
- `src/hooks/useSolanaBalance.ts`
  - fully Solana-specific
  - uses `LAMPORTS_PER_SOL`
  - subscribes to Solana account balance changes
- `src/lib/api.ts`
  - `useWallet()` from Solana adapter
  - wallet header source is still Solana-first

### Solana payment and explorer utilities

- `src/utils/solanaPayment.ts`
  - fully Solana-specific payment utility
  - uses `@solana/web3.js`
  - uses lamports
  - builds Solana explorer links

### Capsule query flow

- `src/hooks/useCapsuleQuery.ts`
  - still imports Solana wallet adapter
  - still has `payment_method: 'solana' | 'stellar_x402'`
  - still has explicit Solana fallback path
  - still shows Solana-specific errors like `Solana wallet not connected`

### Pages still depending on Solana wallet state

- `src/pages/MainApp.tsx`
- `src/pages/Settings.tsx`
- `src/pages/CapsuleDetail.tsx`
- `src/pages/Marketplace.tsx`
- `src/pages/Staking.tsx`
- `src/pages/WalletBalance.tsx`
- `src/pages/EarningsDashboard.tsx`
- `src/pages/LandingPage.tsx`

Common pattern still used:

- `useWallet()` from `@solana/wallet-adapter-react`
- `publicKey.toBase58()`
- Solana balance/payment assumptions

### Frontend dependencies and bundling

- `package.json`
  - `@solana/wallet-adapter-base`
  - `@solana/wallet-adapter-react`
  - `@solana/wallet-adapter-react-ui`
  - `@solana/wallet-adapter-wallets`
  - `@solana/web3.js`
- `vite.config.ts`
  - manual vendor chunk still includes Solana packages

## 3. Backend Solana Logic and Config

These are the main backend places that still assume Solana.

### Env and settings

- `env.example`
  - `SOLANA_RPC_URL`
  - `SOLANA_NETWORK`
- `backend/env.example`
  - `SOLANA_RPC_URL`
  - `SOLANA_NETWORK`
- `backend/render.yaml`
  - Solana config block
- `backend/app/core/config.py`
  - Solana config fields still present and loaded

### Capsule payment flow

- `backend/app/api/v1/capsules.py`
  - docs still describe `Solana (legacy)`
  - still checks `has_solana_payment`
  - still has `Legacy Solana payment flow`
- `backend/app/services/capsule_service.py`
  - `Verify Solana transaction on-chain`
  - payment response mentions `SOL`
  - earnings log still says `SOL`

### Wallet schema/service

- `backend/app/services/wallet_service.py`
  - gets wallet balance from Solana RPC
  - converts lamports to SOL
  - currency is still `SOL`
- `backend/app/models/schemas.py`
  - currency default still `SOL`

### Supabase auth config

- `backend/supabase/config.toml`
  - `auth.web3.solana`
  - Sign in with Solana section is still enabled/documented

### Backend comments

- `backend/requirements.txt`
  - comments still mention Solana RPC behavior

## 4. Contracts, Programs, and Tooling That Are Still Solana-Specific

If the goal is a full Stellar migration, this entire area needs a product decision.

### Main Solana contracts folder

- `contracts/all-contracts/`
  - `Anchor.toml`
  - `Cargo.toml`
  - `lib.rs`
  - `DEPLOY.md`
  - `deploy.ps1`

This folder is deeply Solana-specific:

- Anchor framework
- Solana CLI
- lamports
- SOL staking and transfer logic
- Solana testnet explorer links

### Solmind staking program

- `contracts/solmind-staking/`
  - `Anchor.toml`
  - `package.json`
  - `migrations/deploy.ts`
  - `tests/solmind-staking.ts`
  - `programs/solmind-staking/src/lib.rs`
  - `programs/solmind-staking/src/constants.rs`
  - `programs/solmind-staking/src/error.rs`
  - `programs/solmind-staking/src/instructions/initialize.rs`
  - `programs/solmind-staking/Cargo.toml`

This entire program still models:

- staking SOL
- transferring lamports
- Anchor-based Solana program deployment

## 5. SDK and External-Facing Developer References

- `anymind-sdk/anymind/agent.py`
  - docstring still says `Solana wallet address for authentication`
- `anymind-sdk/sdk.py`
  - references `sol-mind` deployment naming
- `README.md`
  - still contains multiple Solana references
  - still documents Phantom, Solana Wallet Adapter, Solana devnet, Anchor contracts, and Solana env vars

## 6. Low-Priority / Generated / Noisy Mentions

These exist, but they are not the best first edit targets.

- `contracts/solmind-staking/Cargo.lock`
  - contains many `solana-*` and `anchor-*` package references because it is generated from the Solana program

You usually would not hand-edit this file.

## Suggested Migration Order

If you want the app to feel Stellar-first quickly, the cleanest order is:

1. User-facing text and labels
2. Wallet screens and balance displays
3. Marketplace, capsule pricing, and staking copy
4. Solana fallback logic in `useCapsuleQuery.ts` and `solanaPayment.ts`
5. Backend Solana balance/payment services
6. Decide whether Solana staking contracts stay, get hidden, or get replaced
7. Update docs, SDK copy, and deployment notes

## Likely Decision Points

Before replacing everything, these are the main architecture choices to settle:

- Should Solana remain as a hidden legacy fallback, or be removed entirely?
- Should staking still exist?
- If staking stays, is it still Solana-based or will it become a Stellar-native concept?
- Should wallet identity come entirely from Stellar instead of Solana `publicKey.toBase58()`?
- Should marketplace prices move from `SOL` to `USDC`, `XLM`, or a Stellar asset abstraction?

## Summary

The repo is currently hybrid:

- Stellar is already the preferred payment story
- Solana is still heavily embedded in wallet state, staking, balance logic, backend services, contracts, docs, and some product copy

If the goal is a true Stellar-first app, the biggest code hotspots are:

- `src/contexts/WalletContextProvider.tsx`
- `src/hooks/useSolanaBalance.ts`
- `src/utils/solanaPayment.ts`
- `src/hooks/useCapsuleQuery.ts`
- `src/pages/Staking.tsx`
- `src/pages/Marketplace.tsx`
- `backend/app/services/wallet_service.py`
- `backend/app/services/capsule_service.py`
- `contracts/`

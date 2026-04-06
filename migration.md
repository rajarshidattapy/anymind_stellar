# Solana → Stellar Migration Guide

> Generated from the Solana-to-Stellar audit. Work through sections in the order listed — user-facing copy first, then wallet/payment logic, then backend, then contracts.
>
> **Stellar docs:** https://developers.stellar.org/
> **Freighter wallet guide:** https://developers.stellar.org/docs/build/guides/freighter
> **JS SDK:** https://www.npmjs.com/package/@stellar/stellar-sdk
> **Wallet Kit (multi-wallet):** https://github.com/Creit-Tech/Stellar-Wallets-Kit

---

## Quick Reference: Concept Mapping

| Solana concept | Stellar equivalent |
|---|---|
| SOL | XLM (or USDC on Stellar) |
| lamports | stroops (1 XLM = 10,000,000 stroops) |
| `LAMPORTS_PER_SOL` | `10_000_000` (stroops per XLM) |
| Phantom wallet | Freighter wallet |
| `@solana/wallet-adapter-*` | `@stellar/freighter-api` or Stellar Wallets Kit |
| `@solana/web3.js` | `@stellar/stellar-sdk` |
| `publicKey.toBase58()` | Stellar account ID — `G...` string (56 chars) |
| Solana devnet | Stellar Testnet (`https://horizon-testnet.stellar.org`) |
| Mainnet RPC URL | Stellar Mainnet Horizon (`https://horizon.stellar.org`) |
| Solana Explorer | [Stellar Expert](https://stellar.expert) or [Stellar Lab](https://lab.stellar.org) |
| Anchor framework | Stellar CLI + Soroban SDK (Rust) |
| `lib.rs` (Anchor program) | Soroban smart contract (`lib.rs` with `soroban-sdk`) |
| `anchor build / deploy` | `stellar contract build / deploy` |
| Solana transaction signature | Stellar transaction hash |
| `has_solana_payment` | `has_stellar_payment` |
| Sign in with Solana (SIWS) | Sign in with Stellar (SEP-10 / Web Authentication) |

---

## 1. User-Facing Copy

Find-and-replace pass across all `.tsx` / `.ts` files. Then do a targeted sweep of the lines noted below.

### Global string replacements

```
"SOL"                         → "XLM"
"Solana"                      → "Stellar"
"Phantom"                     → "Freighter"
"solana wallet"               → "Stellar wallet"
"Solana staking"              → "Stellar staking"
"lamports"                    → "stroops"
"View on Solana"              → "View on Stellar Expert"
"Solana devnet"               → "Stellar Testnet"
"sol-mind"                    → "stellar-mind"   (or your new brand name)
"YourSolanaWalletAddress"     → "YourStellarAccountID"
```

### `src/pages/LandingPage.tsx`

| Line | Old | New |
|---|---|---|
| 259 | `24.1 SOL` | `24.1 XLM` |
| 277 | `SOL to creators` | `XLM to creators` |
| 355 | `Stake SOL behind your capsule` | `Stake XLM behind your capsule` |
| 370 | `Solana staking for reputation` | `Stellar staking for reputation` |
| 454 | price card `SOL` | `XLM` |
| 475 | `Full Solana ...` | `Full Stellar ...` |

### `src/pages/CapsuleDetail.tsx`

| Line | Old | New |
|---|---|---|
| 200 | `or {capsule.price_per_query} SOL (legacy)` | `or {capsule.price_per_query} XLM` |
| 223 | `SOL Staked` | `XLM Staked` |
| 313 | `use a Solana wallet for the legacy fallback flow` | remove or rewrite as Stellar-only |
| 332 | `Connect a Solana or Stellar wallet` | `Connect a Stellar wallet` |
| 351 | `Solana SOL` | `Stellar XLM` |
| 361 | `View on Solana` | `View on Stellar Expert` (link: `https://stellar.expert/explorer/public/tx/{hash}`) |

### `src/pages/Staking.tsx`

| Line | Old | New |
|---|---|---|
| 90+ | `SOL` strings | `XLM` |
| 172 | `staked ${amount} SOL` | `staked ${amount} XLM` |
| 205 | `Stake SOL on your agents` | `Stake XLM on your agents` |
| 222 | total staked in `SOL` | `XLM` |
| 288 | `Currently staked: ... SOL` | `Currently staked: ... XLM` |
| 297 | `Enter stake amount (SOL)` | `Enter stake amount (XLM)` |

### `src/pages/Marketplace.tsx`

| Line | Old | New |
|---|---|---|
| 169 | `Send 0.22 SOL payment` | `Send 0.22 XLM payment` |
| 174 | `Fixed price: 0.22 SOL` | `Fixed price: 0.22 XLM` |
| 317 | `SOL Staked` | `XLM Staked` |
| 325 | `SOL/query` | `XLM/query` |

### `src/pages/MemoryCapsuleView.tsx`

| Line | Old | New |
|---|---|---|
| 248 | `Price per Query (SOL)` | `Price per Query (XLM)` |

### `src/pages/WalletBalance.tsx`

| Line | Old | New |
|---|---|---|
| 54 | `Connect your Solana wallet to view balance` | `Connect your Stellar wallet (Freighter) to view balance` |

### `src/pages/DevelopersPage.tsx`

| Line | Old | New |
|---|---|---|
| 36 | `YourSolanaWalletAddress` | `YourStellarAccountID` |
| 240 | `Solana wallet authentication` | `Stellar wallet authentication (SEP-10)` |
| 265 | `Solana wallet address` | `Stellar account ID` |
| 393 | `Solana payment fallback` | remove fallback copy |

### `src/components/Navbar.tsx`

| Line | Old | New |
|---|---|---|
| 54 | balance renders `SOL` | render `XLM` |

---

## 2. Frontend: Wallet Provider

Replace the Solana Wallet Adapter with Freighter or the Stellar Wallets Kit.

### Install

```bash
# Remove Solana adapter packages
npm uninstall @solana/wallet-adapter-base @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js

# Add Stellar packages
npm install @stellar/stellar-sdk @stellar/freighter-api
# Optional: multi-wallet support
npm install @creit.tech/stellar-wallets-kit
```

### `src/contexts/WalletContextProvider.tsx` — rewrite

```tsx
import { createContext, useContext, useState, useCallback } from "react";
import {
  isConnected,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

interface WalletCtx {
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: typeof signTransaction;
}

const WalletContext = createContext<WalletCtx | null>(null);

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const connected = await isConnected();
    if (!connected) {
      // Freighter not installed — prompt user
      window.open("https://freighter.app", "_blank");
      return;
    }
    const { address } = await getAddress();
    setPublicKey(address); // G... Stellar account ID
  }, []);

  const disconnect = useCallback(() => setPublicKey(null), []);

  return (
    <WalletContext.Provider value={{ publicKey, connect, disconnect, signTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletContextProvider");
  return ctx;
};
```

> **Freighter docs:** https://developers.stellar.org/docs/build/guides/freighter

---

## 3. Frontend: Balance Hook

### `src/hooks/useSolanaBalance.ts` → `src/hooks/useStellarBalance.ts`

```ts
import { useEffect, useState } from "react";
import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

const STROOPS_PER_XLM = 10_000_000;

export function useStellarBalance(accountId: string | null) {
  const [xlmBalance, setXlmBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    server
      .loadAccount(accountId)
      .then((account) => {
        const native = account.balances.find((b) => b.asset_type === "native");
        setXlmBalance(native ? parseFloat(native.balance) : 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accountId]);

  return { xlmBalance, loading };
}
```

Update every import of `useSolanaBalance` → `useStellarBalance`, and every reference to the returned value accordingly.

---

## 4. Frontend: Payment Utility

### `src/utils/solanaPayment.ts` → `src/utils/stellarPayment.ts`

```ts
import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK === "mainnet"
  ? Networks.PUBLIC
  : Networks.TESTNET;

const server = new Horizon.Server(HORIZON_URL);

export async function sendXlmPayment(
  senderAccountId: string,
  destinationAccountId: string,
  amountXlm: string, // e.g. "0.22"
  memo?: string
): Promise<string> {
  const senderAccount = await server.loadAccount(senderAccountId);

  const tx = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAccountId,
        asset: Asset.native(),
        amount: amountXlm,
      })
    )
    .setTimeout(30)
    .build();

  const { signedTxXdr } = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  );

  return result.hash; // Stellar transaction hash
}

export function stellarExplorerUrl(txHash: string, network: "testnet" | "public" = "testnet") {
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
}
```

Delete `solanaPayment.ts` after migrating all callers.

---

## 5. Frontend: Capsule Query Hook

### `src/hooks/useCapsuleQuery.ts`

```ts
// Remove:
import { useWallet } from "@solana/wallet-adapter-react";

// Replace with your new hook:
import { useWallet } from "../contexts/WalletContextProvider";

// Remove Solana fallback branch entirely.
// Change payment_method type:
type PaymentMethod = "stellar_x402"; // was: 'solana' | 'stellar_x402'

// Replace Solana-specific error:
// "Solana wallet not connected"  →  "Stellar wallet not connected"

// Remove:
//   payment_method: 'solana'
//   has_solana_payment
//   explicit Solana fallback path
```

---

## 6. Frontend: API Client

### `src/lib/api.ts`

```ts
// Remove:
import { useWallet } from "@solana/wallet-adapter-react";
const { publicKey } = useWallet();
headers["x-wallet-address"] = publicKey?.toBase58();

// Replace with:
import { useWallet } from "../contexts/WalletContextProvider";
const { publicKey } = useWallet();
headers["x-wallet-address"] = publicKey ?? ""; // Already a G... string
```

---

## 7. Frontend: `package.json` and `vite.config.ts`

### `package.json` — remove

```json
"@solana/wallet-adapter-base": "...",
"@solana/wallet-adapter-react": "...",
"@solana/wallet-adapter-react-ui": "...",
"@solana/wallet-adapter-wallets": "...",
"@solana/web3.js": "..."
```

### `package.json` — add

```json
"@stellar/stellar-sdk": "^13.x",
"@stellar/freighter-api": "^3.x"
```

### `vite.config.ts` — update manual chunks

```ts
// Remove from manualChunks:
"solana": ["@solana/web3.js", "@solana/wallet-adapter-react", ...]

// Add:
"stellar": ["@stellar/stellar-sdk", "@stellar/freighter-api"]
```

---

## 8. Backend: Env and Config

### `env.example` and `backend/env.example`

```diff
- SOLANA_RPC_URL=https://api.devnet.solana.com
- SOLANA_NETWORK=devnet
+ STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
+ STELLAR_RPC_URL=https://soroban-testnet.stellar.org
+ STELLAR_NETWORK=testnet
# For mainnet:
# STELLAR_HORIZON_URL=https://horizon.stellar.org
# STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
# STELLAR_NETWORK=public
```

### `backend/app/core/config.py`

```python
# Remove:
SOLANA_RPC_URL: str
SOLANA_NETWORK: str

# Add:
STELLAR_HORIZON_URL: str = "https://horizon-testnet.stellar.org"
STELLAR_RPC_URL: str = "https://soroban-testnet.stellar.org"
STELLAR_NETWORK: str = "testnet"  # or "public" for mainnet
```

### `backend/render.yaml`

Remove the Solana config block entirely; add the three Stellar vars above.

---

## 9. Backend: Wallet Service

### `backend/app/services/wallet_service.py`

```python
# Remove: solana-py / Solana RPC calls, lamports → SOL conversion
# Add: stellar-sdk (pip install stellar-sdk)

from stellar_sdk import Server

HORIZON_URL = settings.STELLAR_HORIZON_URL
server = Server(HORIZON_URL)

STROOPS_PER_XLM = 10_000_000

def get_stellar_balance(account_id: str) -> float:
    """Return XLM balance for a Stellar account ID."""
    account = server.accounts().account_id(account_id).call()
    for balance in account["balances"]:
        if balance["asset_type"] == "native":
            return float(balance["balance"])
    return 0.0

# In response payloads:
# currency: "SOL"  →  currency: "XLM"
```

---

## 10. Backend: Capsule Payment Service

### `backend/app/api/v1/capsules.py`

```python
# Remove: "Solana (legacy)", has_solana_payment, Legacy Solana payment flow

# Replace payment verification:
# Old: verify Solana transaction on-chain
# New: verify Stellar transaction on Horizon

from stellar_sdk import Server

def verify_stellar_payment(tx_hash: str, expected_amount_xlm: str, destination: str) -> bool:
    server = Server(settings.STELLAR_HORIZON_URL)
    tx = server.transactions().transaction(tx_hash).call()
    ops = server.operations().for_transaction(tx_hash).call()["_embedded"]["records"]
    for op in ops:
        if (
            op["type"] == "payment"
            and op["asset_type"] == "native"
            and op["to"] == destination
            and float(op["amount"]) >= float(expected_amount_xlm)
        ):
            return True
    return False
```

### `backend/app/services/capsule_service.py`

```python
# Change:
#   payment response "SOL"  →  "XLM"
#   earnings log "SOL"      →  "XLM"
#   "Verify Solana transaction on-chain"  →  "Verify Stellar transaction via Horizon"
```

---

## 11. Backend: Schema

### `backend/app/models/schemas.py`

```python
# Change default currency:
currency: str = "XLM"   # was "SOL"

# Change payment_method enum if present:
payment_method: Literal["stellar_x402"]  # remove "solana"
```

---

## 12. Backend: Supabase Auth — Sign in with Stellar (SEP-10)

### `backend/supabase/config.toml`

Remove or disable the `auth.web3.solana` / Sign in with Solana block.

Stellar's equivalent is **SEP-10 Web Authentication** — a challenge-response flow where the server issues a transaction the user signs with their Stellar keypair.

```
Stellar SEP-10 docs:
https://developers.stellar.org/docs/learn/fundamentals/stellar-ecosystem-proposals
```

Libraries:
- Python: `stellar-sdk` has full SEP-10 support (`stellar_sdk.sep.stellar_web_authentication`)
- JS: `@stellar/stellar-sdk` — `Utils.buildChallengeTx` / `Utils.readChallengeTx`

---

## 13. Contracts — Replace Anchor with Soroban

This is the largest scope change. Decide on the staking architecture first (see Decision Points below), then follow this path.

### Remove

```
contracts/all-contracts/    (Anchor.toml, Cargo.toml, lib.rs, DEPLOY.md, deploy.ps1)
contracts/solmind-staking/  (entire folder)
```

### Install Stellar CLI

```bash
cargo install --locked stellar-cli --features opt
```

Docs: https://developers.stellar.org/docs/tools/cli

### Scaffold a new Soroban contract

```bash
stellar contract init staking-contract
cd staking-contract
```

### Staking contract skeleton (`src/lib.rs`)

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, Symbol};

#[contract]
pub struct StakingContract;

#[contractimpl]
impl StakingContract {
    /// Stake `amount` stroops of XLM (or a custom token) on behalf of `staker`.
    pub fn stake(env: Env, staker: Address, amount: i128) {
        staker.require_auth();
        // Transfer XLM from staker to this contract via the native SAC
        let native = token::Client::new(&env, &env.current_contract_address());
        // TODO: implement storage, emit events
    }

    pub fn unstake(env: Env, staker: Address, amount: i128) {
        staker.require_auth();
        // Return XLM
    }

    pub fn get_stake(env: Env, staker: Address) -> i128 {
        // Read from persistent storage
        todo!()
    }
}
```

> Full Soroban token contract examples: https://developers.stellar.org/docs/build/smart-contracts/example-contracts

### Build and deploy

```bash
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/staking_contract.wasm \
  --source <your-secret-key-or-alias> \
  --network testnet
```

---

## 14. SDK and Docs

### `anymind-sdk/anymind/agent.py`

```python
# Old docstring:
# Solana wallet address for authentication

# New:
# Stellar account ID (G... format) for authentication via SEP-10
```

### `anymind-sdk/sdk.py`

```python
# "sol-mind" deployment naming → "stellar-mind" (or chosen brand name)
```

### `README.md`

Global find-and-replace with the table in section 0, then update:
- Phantom install instructions → Freighter install instructions (`https://freighter.app`)
- Wallet Adapter setup → Freighter / Stellar Wallets Kit setup
- Solana devnet faucet → Stellar Testnet Friendbot (`https://friendbot.stellar.org`)
- Anchor build/deploy steps → Stellar CLI build/deploy steps
- Solana env vars → Stellar env vars (section 8 above)
- Explorer links → `https://stellar.expert`

---

## 15. Decision Points (resolve before shipping)

| Question | Options |
|---|---|
| **Solana as legacy fallback?** | Keep hidden behind a feature flag, or remove entirely. Recommend remove to reduce surface area. |
| **Staking stays?** | Yes → port to Soroban. No → remove `Staking.tsx` and the contracts folder. |
| **Currency for marketplace** | `XLM` (native, easiest) or USDC on Stellar (via Stellar Asset Contract — more stable, more steps). |
| **Wallet identity** | Stellar account ID is already a human-readable string — no `.toBase58()` needed. Use it directly. |
| **Auth flow** | SEP-10 challenge-response replaces Sign in with Solana. Use `stellar-sdk` on both client and server. |

---

## Suggested Execution Order

1. **String/copy pass** — sections 1 (all pages)
2. **Wallet provider + balance hook** — sections 2, 3
3. **Payment utility + capsule query** — sections 4, 5
4. **API client + package cleanup** — sections 6, 7
5. **Backend env + config + wallet service** — sections 8, 9
6. **Backend capsule + schema** — sections 10, 11
7. **Auth (SEP-10)** — section 12
8. **Contracts** — section 13 (after product decision on staking)
9. **SDK + README** — section 14
import { Buffer } from 'buffer';
import {
  Client as ContractClient,
  Spec as ContractSpec,
  type AssembledTransaction,
  type ClientOptions as ContractClientOptions,
  type MethodOptions,
} from '@stellar/stellar-sdk/contract';
import type { u64 } from '@stellar/stellar-sdk/contract';
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk';

// Polyfill Buffer in browser
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

// ── Network config ──────────────────────────────────────────────
export const CONTRACT_NETWORK = {
  testnet: {
    contractId: 'CBD3R6PVDQ5PDDSNV344HZQQXYAAXOIZSEDRYXIPD3KRV5MPCLDOGVPJ',
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org',
  },
} as const;

/** 1 XLM expressed in stroops (contract's u64 unit) */
export const XLM_TO_STROOPS = 10_000_000n;

/** Convert XLM float to contract u64 stroops */
export function xlmToStroops(xlm: number): u64 {
  return BigInt(Math.round(xlm * 10_000_000));
}

/** Convert contract u64 stroops to XLM float */
export function stroopsToXlm(stroops: u64): number {
  return Number(stroops) / 10_000_000;
}

// ── Contract data types (mirrors bindings/src/index.ts) ────────
export type { u64 };

export interface Agent {
  agent_id: string;
  created_at: u64;
  display_name: string;
  name: string;
  owner: string;
  platform: string;
  reputation: u64;
  usage_count: u64;
}

export interface Capsule {
  capsule_id: string;
  category: string;
  created_at: u64;
  creator: string;
  description: string;
  name: string;
  price_per_query: u64;
  total_stake: u64;
  updated_at: u64;
}

export interface Staking {
  amount: u64;
  capsule_id: string;
  lock_until: u64;
  staked_at: u64;
  staker: string;
}

export interface Earnings {
  capsule_id: string;
  last_updated: u64;
  query_count: u64;
  total_earnings: u64;
  wallet: string;
}

// ── Contract spec (XDR base64 from bindings/src/index.ts) ──────
const ANYMIND_SPEC = new ContractSpec([
  'AAAAAQAAAAAAAAAAAAAABUFnZW50AAAAAAAACAAAAAAAAAAIYWdlbnRfaWQAAAAQAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAxkaXNwbGF5X25hbWUAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAhwbGF0Zm9ybQAAABAAAAAAAAAACnJlcHV0YXRpb24AAAAAAAYAAAAAAAAAC3VzYWdlX2NvdW50AAAAAAY=',
  'AAAAAQAAAAAAAAAAAAAAB0NhcHN1bGUAAAAACQAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAIY2F0ZWdvcnkAAAAQAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAABG5hbWUAAAAQAAAAAAAAAA9wcmljZV9wZXJfcXVlcnkAAAAABgAAAAAAAAALdG90YWxfc3Rha2UAAAAABgAAAAAAAAAKdXBkYXRlZF9hdAAAAAAABg==',
  'AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAABUFnZW50AAAAAAAAAQAAABAAAAABAAAAAAAAAAdDYXBzdWxlAAAAAAEAAAAQAAAAAQAAAAAAAAAFU3Rha2UAAAAAAAACAAAAEAAAABMAAAABAAAAAAAAAAhFYXJuaW5ncwAAAAIAAAAQAAAAEw==',
  'AAAAAQAAAAAAAAAAAAAAB1N0YWtpbmcAAAAABQAAAAAAAAAGYW1vdW50AAAAAAAGAAAAAAAAAApjYXBzdWxlX2lkAAAAAAAQAAAAAAAAAApsb2NrX3VudGlsAAAAAAAGAAAAAAAAAAlzdGFrZWRfYXQAAAAAAAAGAAAAAAAAAAZzdGFrZXIAAAAAABM=',
  'AAAAAQAAAAAAAAAAAAAACEVhcm5pbmdzAAAABQAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAMbGFzdF91cGRhdGVkAAAABgAAAAAAAAALcXVlcnlfY291bnQAAAAABgAAAAAAAAAOdG90YWxfZWFybmluZ3MAAAAAAAYAAAAAAAAABndhbGxldAAAAAAAEw==',
  'AAAAAAAAAAAAAAAOY3JlYXRlX2NhcHN1bGUAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAAPcHJpY2VfcGVyX3F1ZXJ5AAAAAAYAAAAA',
  'AAAAAAAAAAAAAAAOcmVnaXN0ZXJfYWdlbnQAAAAAAAUAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAIYWdlbnRfaWQAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAMZGlzcGxheV9uYW1lAAAAEAAAAAAAAAAIcGxhdGZvcm0AAAAQAAAAAA==',
  'AAAAAAAAAAAAAAAQc3Rha2Vfb25fY2Fwc3VsZQAAAAMAAAAAAAAABnN0YWtlcgAAAAAAEwAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAGYW1vdW50AAAAAAAGAAAAAA==',
  'AAAAAAAAAAAAAAARd2l0aGRyYXdfZWFybmluZ3MAAAAAAAACAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAACmNhcHN1bGVfaWQAAAAAABAAAAABAAAABg==',
  'AAAAAAAAAAAAAAAUdXBkYXRlX2NhcHN1bGVfcHJpY2UAAAADAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAACmNhcHN1bGVfaWQAAAAAABAAAAAAAAAACW5ld19wcmljZQAAAAAAAAYAAAAA',
]);

// ── Typed interface for the contract methods ────────────────────
export interface AnymindContractMethods {
  create_capsule(
    args: { creator: string; capsule_id: string; name: string; description: string; category: string; price_per_query: u64 },
    options?: MethodOptions
  ): Promise<AssembledTransaction<null>>;

  register_agent(
    args: { owner: string; agent_id: string; name: string; display_name: string; platform: string },
    options?: MethodOptions
  ): Promise<AssembledTransaction<null>>;

  stake_on_capsule(
    args: { staker: string; capsule_id: string; amount: u64 },
    options?: MethodOptions
  ): Promise<AssembledTransaction<null>>;

  withdraw_earnings(
    args: { creator: string; capsule_id: string },
    options?: MethodOptions
  ): Promise<AssembledTransaction<u64>>;

  update_capsule_price(
    args: { creator: string; capsule_id: string; new_price: u64 },
    options?: MethodOptions
  ): Promise<AssembledTransaction<null>>;
}

// ── Client class ────────────────────────────────────────────────
// ContractClient dynamically adds methods from the spec at construction time.
// The interface above provides TypeScript type safety for those methods.
export class AnymindClient extends ContractClient implements AnymindContractMethods {
  constructor(public readonly options: ContractClientOptions) {
    super(ANYMIND_SPEC, options);
  }

  // These are satisfied by ContractClient's dynamic dispatch at runtime.
  // We declare them here so TypeScript is satisfied.
  declare create_capsule: AnymindContractMethods['create_capsule'];
  declare register_agent: AnymindContractMethods['register_agent'];
  declare stake_on_capsule: AnymindContractMethods['stake_on_capsule'];
  declare withdraw_earnings: AnymindContractMethods['withdraw_earnings'];
  declare update_capsule_price: AnymindContractMethods['update_capsule_price'];
}

// ── Factory: build a signed client using the connected wallet ───
export function createSignedClient(publicKey: string): AnymindClient {
  const { testnet } = CONTRACT_NETWORK;

  const signTransaction: ContractClientOptions['signTransaction'] = async (xdr) => {
    return StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: testnet.networkPassphrase,
      address: publicKey,
    });
  };

  return new AnymindClient({
    contractId: testnet.contractId,
    networkPassphrase: testnet.networkPassphrase,
    rpcUrl: testnet.rpcUrl,
    publicKey,
    signTransaction,
  });
}

/** Build a deterministic capsule ID for an agent owned by a wallet */
export function capsuleIdForAgent(agentId: string, ownerAddress: string): string {
  return `capsule-${agentId}-${ownerAddress.slice(0, 8)}`;
}

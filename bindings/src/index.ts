import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBD3R6PVDQ5PDDSNV344HZQQXYAAXOIZSEDRYXIPD3KRV5MPCLDOGVPJ",
  }
} as const


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

export type DataKey = {tag: "Agent", values: readonly [string]} | {tag: "Capsule", values: readonly [string]} | {tag: "Stake", values: readonly [string, string]} | {tag: "Earnings", values: readonly [string, string]};


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

export interface Client {
  /**
   * Construct and simulate a create_capsule transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_capsule: ({creator, capsule_id, name, description, category, price_per_query}: {creator: string, capsule_id: string, name: string, description: string, category: string, price_per_query: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a register_agent transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register_agent: ({owner, agent_id, name, display_name, platform}: {owner: string, agent_id: string, name: string, display_name: string, platform: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a stake_on_capsule transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  stake_on_capsule: ({staker, capsule_id, amount}: {staker: string, capsule_id: string, amount: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw_earnings transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  withdraw_earnings: ({creator, capsule_id}: {creator: string, capsule_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a update_capsule_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_capsule_price: ({creator, capsule_id, new_price}: {creator: string, capsule_id: string, new_price: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABUFnZW50AAAAAAAACAAAAAAAAAAIYWdlbnRfaWQAAAAQAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAxkaXNwbGF5X25hbWUAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAhwbGF0Zm9ybQAAABAAAAAAAAAACnJlcHV0YXRpb24AAAAAAAYAAAAAAAAAC3VzYWdlX2NvdW50AAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAAB0NhcHN1bGUAAAAACQAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAIY2F0ZWdvcnkAAAAQAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAABG5hbWUAAAAQAAAAAAAAAA9wcmljZV9wZXJfcXVlcnkAAAAABgAAAAAAAAALdG90YWxfc3Rha2UAAAAABgAAAAAAAAAKdXBkYXRlZF9hdAAAAAAABg==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAABUFnZW50AAAAAAAAAQAAABAAAAABAAAAAAAAAAdDYXBzdWxlAAAAAAEAAAAQAAAAAQAAAAAAAAAFU3Rha2UAAAAAAAACAAAAEAAAABMAAAABAAAAAAAAAAhFYXJuaW5ncwAAAAIAAAAQAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAAB1N0YWtpbmcAAAAABQAAAAAAAAAGYW1vdW50AAAAAAAGAAAAAAAAAApjYXBzdWxlX2lkAAAAAAAQAAAAAAAAAApsb2NrX3VudGlsAAAAAAAGAAAAAAAAAAlzdGFrZWRfYXQAAAAAAAAGAAAAAAAAAAZzdGFrZXIAAAAAABM=",
        "AAAAAQAAAAAAAAAAAAAACEVhcm5pbmdzAAAABQAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAMbGFzdF91cGRhdGVkAAAABgAAAAAAAAALcXVlcnlfY291bnQAAAAABgAAAAAAAAAOdG90YWxfZWFybmluZ3MAAAAAAAYAAAAAAAAABndhbGxldAAAAAAAEw==",
        "AAAAAAAAAAAAAAAOY3JlYXRlX2NhcHN1bGUAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAAPcHJpY2VfcGVyX3F1ZXJ5AAAAAAYAAAAA",
        "AAAAAAAAAAAAAAAOcmVnaXN0ZXJfYWdlbnQAAAAAAAUAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAIYWdlbnRfaWQAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAMZGlzcGxheV9uYW1lAAAAEAAAAAAAAAAIcGxhdGZvcm0AAAAQAAAAAA==",
        "AAAAAAAAAAAAAAAQc3Rha2Vfb25fY2Fwc3VsZQAAAAMAAAAAAAAABnN0YWtlcgAAAAAAEwAAAAAAAAAKY2Fwc3VsZV9pZAAAAAAAEAAAAAAAAAAGYW1vdW50AAAAAAAGAAAAAA==",
        "AAAAAAAAAAAAAAARd2l0aGRyYXdfZWFybmluZ3MAAAAAAAACAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAACmNhcHN1bGVfaWQAAAAAABAAAAABAAAABg==",
        "AAAAAAAAAAAAAAAUdXBkYXRlX2NhcHN1bGVfcHJpY2UAAAADAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAACmNhcHN1bGVfaWQAAAAAABAAAAAAAAAACW5ld19wcmljZQAAAAAAAAYAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    create_capsule: this.txFromJSON<null>,
        register_agent: this.txFromJSON<null>,
        stake_on_capsule: this.txFromJSON<null>,
        withdraw_earnings: this.txFromJSON<u64>,
        update_capsule_price: this.txFromJSON<null>
  }
}
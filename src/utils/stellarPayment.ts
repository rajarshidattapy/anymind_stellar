import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";

/**
 * Stellar x402 Payment Utility
 *
 * Handles the client-side x402 payment flow:
 *   1. Detect 402 response from capsule query
 *   2. Parse the payment challenge
 *   3. Build Soroban USDC transfer via a connected Stellar wallet
 *   4. Sign auth entries
 *   5. Retry the original request with X-PAYMENT header
 *
 * Requires: A Stellar Wallets Kit compatible wallet connection
 */

// ── Types ───────────────────────────────────────────────────

export interface X402Accept {
  scheme: "exact";
  network: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: { areFeesSponsored: boolean };
}

export interface X402Challenge {
  x402Version: 2;
  resource: { url: string; description: string; mimeType: string };
  accepts: X402Accept[];
}

export interface X402PaymentPayload {
  x402Version: 2;
  accepted: X402Accept;
  payload: { transaction: string };
}

export interface StellarPaymentResult {
  success: boolean;
  data?: any;
  txHash?: string;
  error?: string;
}

function normalizeExplorerNetwork(network: string): "public" | "testnet" {
  return /pubnet|public|mainnet/i.test(network) ? "public" : "testnet";
}

// ── Freighter wallet helpers ────────────────────────────────

declare global {
  interface Window {
    freighterApi?: unknown;
  }
}

export function isFreighterInstalled(): boolean {
  return typeof window !== "undefined" && !!window.freighterApi;
}

export async function getConnectedStellarAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function isStellarWalletConnected(): Promise<boolean> {
  return Boolean(await getConnectedStellarAddress());
}

// ── x402 flow ───────────────────────────────────────────────

/**
 * Check if a fetch response is a 402 x402 challenge.
 */
export function isX402Challenge(status: number, body: any): body is X402Challenge {
  return (
    status === 402 &&
    body?.x402Version === 2 &&
    Array.isArray(body?.accepts) &&
    body.accepts.length > 0
  );
}

/**
 * Format the price from atomic USDC units to a human-readable string.
 */
export function formatUsdcPrice(atomicAmount: string): string {
  const usd = parseInt(atomicAmount, 10) / 10_000_000;
  return `$${usd.toFixed(4)} USDC`;
}

/**
 * Build a Soroban SAC USDC transfer, sign auth entries via a connected wallet,
 * and return the X-PAYMENT header value.
 *
 * This uses the Stellar SDK dynamically imported to avoid bundling it
 * for users who don't need Stellar payments.
 */
export async function buildStellarPayment(
  accept: X402Accept
): Promise<string> {
  // Dynamic import — only loads when user actually pays
  const StellarSdk = await import("@stellar/stellar-sdk");
  const {
    Networks,
    TransactionBuilder,
    nativeToScVal,
    contract,
    rpc: StellarRpc,
  } = StellarSdk;

  const networkPassphrase =
    accept.network === "stellar:pubnet" ? Networks.PUBLIC : Networks.TESTNET;
  const rpcUrl =
    accept.network === "stellar:pubnet"
      ? "https://mainnet.sorobanrpc.com"
      : "https://soroban-testnet.stellar.org";

  // Get the user's public key from the connected Stellar wallet
  const publicKey = await getConnectedStellarAddress();
  if (!publicKey) {
    throw new Error("Stellar wallet not connected. Connect a Stellar wallet and try again.");
  }

  // Build + simulate the Soroban USDC transfer (Recording Mode)
  const tx = await contract.AssembledTransaction.build({
    contractId: accept.asset,
    method: "transfer",
    args: [
      nativeToScVal(publicKey, { type: "address" }),
      nativeToScVal(accept.payTo, { type: "address" }),
      nativeToScVal(BigInt(accept.amount), { type: "i128" }),
    ],
    networkPassphrase,
    rpcUrl,
    parseResultXdr: (result: any) => result,
  });

  // Validate simulation
  if (!tx.simulation || StellarRpc.Api.isSimulationError(tx.simulation)) {
    const errMsg = tx.simulation
      ? (tx.simulation as any).error
      : "No simulation result";
    throw new Error(`Transaction simulation failed: ${errMsg}`);
  }

  // Sign auth entries via the active Stellar Wallets Kit module
  const latestLedger = (tx.simulation as any).latestLedger;
  const expiration = latestLedger + 12; // ~1 minute

  await tx.signAuthEntries({
    address: publicKey,
    signAuthEntry: async (entryXdr: string) => {
      return StellarWalletsKit.signAuthEntry(entryXdr, {
        networkPassphrase,
        address: publicKey,
      });
    },
    expiration,
  });

  // Re-simulate in Enforcing Mode
  await tx.simulate();

  if (!tx.simulation || StellarRpc.Api.isSimulationError(tx.simulation)) {
    throw new Error("Enforcing simulation failed after signing auth entries");
  }

  // Build final transaction XDR
  const successSim = tx.simulation as any;
  const baseFee = 10_000;
  const resourceFee = parseInt(successSim.minResourceFee || "0", 10);

  const finalTx = TransactionBuilder.cloneFrom(tx.built!, {
    fee: (baseFee + resourceFee).toString(),
    sorobanData: tx.simulationData.transactionData,
    networkPassphrase,
  }).build();

  return finalTx.toXDR();
}

/**
 * Execute the full x402 payment flow:
 *   1. Build Soroban transfer + sign auth entries
 *   2. Encode as X-PAYMENT header
 *   3. Retry the original request
 */
export async function payAndRetry(
  originalUrl: string,
  challenge: X402Challenge,
  originalBody: any,
  originalHeaders: Record<string, string> = {}
): Promise<StellarPaymentResult> {
  try {
    const accept = challenge.accepts[0];

    // Build the signed transaction
    const signedXDR = await buildStellarPayment(accept);

    // Build X-PAYMENT header payload
    const paymentPayload: X402PaymentPayload = {
      x402Version: 2,
      accepted: accept,
      payload: { transaction: signedXDR },
    };

    const headerValue = btoa(JSON.stringify(paymentPayload));

    // Retry the original request with payment
    const response = await fetch(originalUrl, {
      method: "POST",
      headers: {
        ...originalHeaders,
        "Content-Type": "application/json",
        "X-PAYMENT": headerValue,
      },
      body: JSON.stringify(originalBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return {
        success: false,
        error: errorData.detail || errorData.error || `Payment failed (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      txHash: data.payment?.tx_hash,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";

    if (message.includes("User rejected") || message.includes("rejected")) {
      return { success: false, error: "Transaction rejected by user" };
    }

    return { success: false, error: message };
  }
}

/**
 * Get Stellar explorer URL for a transaction.
 */
export function getStellarExplorerUrl(
  txHash: string,
  network: string = import.meta.env.VITE_STELLAR_NETWORK ?? "stellar:testnet"
): string {
  const explorerNetwork = normalizeExplorerNetwork(network);
  return `https://stellar.expert/explorer/${explorerNetwork}/tx/${txHash}`;
}

export function getStellarAccountExplorerUrl(
  accountId: string,
  network: string = import.meta.env.VITE_STELLAR_NETWORK ?? "stellar:testnet"
): string {
  const explorerNetwork = normalizeExplorerNetwork(network);
  return `https://stellar.expert/explorer/${explorerNetwork}/account/${accountId}`;
}

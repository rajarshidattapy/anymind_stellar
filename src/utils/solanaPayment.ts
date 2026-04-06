import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

export interface PaymentResult {
  signature: string;
  success: boolean;
  error?: string;
}

export async function sendPayment(
  connection: Connection,
  senderPubkey: PublicKey,
  recipientAddress: string,
  amountSOL: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<PaymentResult> {
  try {
    if (amountSOL <= 0) {
      return {
        signature: '',
        success: false,
        error: 'Payment amount must be greater than 0'
      };
    }

    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientAddress);
    } catch (err) {
      return {
        signature: '',
        success: false,
        error: 'Invalid recipient wallet address'
      };
    }

    // Create transfer instruction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPubkey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
      })
    );

    // Get recent blockhash and set fee payer
    // Use 'confirmed' commitment for faster response (wallet extensions can timeout on 'finalized')
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPubkey;

    // Sign transaction (will trigger wallet popup)
    // Wrap in try-catch to handle wallet extension errors
    let signed: Transaction;
    try {
      signed = await signTransaction(transaction);
    } catch (signError) {
      // Handle wallet-specific errors
      if (signError instanceof Error) {
        if (signError.message.includes('User rejected') || signError.message.includes('rejected')) {
          return {
            signature: '',
            success: false,
            error: 'Transaction rejected by user'
          };
        }
        if (signError.message.includes('channel closed') || signError.message.includes('message channel')) {
          return {
            signature: '',
            success: false,
            error: 'Wallet connection closed. Please try again.'
          };
        }
      }
      throw signError;
    }

    // Send transaction
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      maxRetries: 3
    });

    // Wait for confirmation with a more lenient approach
    // Use 'confirmed' commitment for faster response (avoids wallet extension timeouts)
    try {
      // Try to confirm, but don't wait too long
      await Promise.race([
        connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed'),
        // Timeout after 30 seconds
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
        )
      ]);
    } catch (confirmError) {
      // If confirmation fails or times out, check if transaction was at least sent
      // The transaction might still be processing on-chain
      const status = await connection.getSignatureStatus(signature);
      if (status.value) {
        // Transaction exists (even if not fully confirmed yet)
        console.warn('Transaction sent but confirmation incomplete:', signature);
        return {
          signature,
          success: true
        };
      }
      // If transaction doesn't exist, it likely failed
      throw new Error('Transaction failed to send');
    }

    return {
      signature,
      success: true
    };
  } catch (error) {
    console.error('Payment error:', error);

    // Handle common errors
    let errorMessage = 'Payment failed';
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      signature: '',
      success: false,
      error: errorMessage
    };
  }
}

export function getSolanaExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

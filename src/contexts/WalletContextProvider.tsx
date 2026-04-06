import { ReactNode } from 'react';
import { StellarWalletProvider, useStellarWallet } from './StellarWalletContext';

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  return <StellarWalletProvider>{children}</StellarWalletProvider>;
}

export function useWallet() {
  const wallet = useStellarWallet();

  return {
    publicKey: wallet.address,
    address: wallet.address,
    connected: wallet.connected,
    connecting: wallet.connecting,
    walletId: wallet.walletId,
    supportedWallets: wallet.supportedWallets,
    hasAvailableWallet: wallet.hasAvailableWallet,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    refreshAddress: wallet.refreshAddress,
    openProfile: wallet.openProfile,
  };
}

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk';
import {
  KitEventType,
  Networks,
  type ISupportedWallet,
  SwkAppDarkTheme,
} from '@creit-tech/stellar-wallets-kit/types';

interface StellarWalletContextValue {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  walletId: string | null;
  supportedWallets: ISupportedWallet[];
  hasAvailableWallet: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  refreshAddress: () => Promise<string | null>;
  openProfile: () => Promise<void>;
}

const StellarWalletContext = createContext<StellarWalletContextValue | null>(null);

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const initializedRef = useRef(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [supportedWallets, setSupportedWallets] = useState<ISupportedWallet[]>([]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    StellarWalletsKit.init({
      modules: defaultModules(),
      network: Networks.TESTNET,
      theme: SwkAppDarkTheme,
      authModal: {
        hideUnsupportedWallets: false,
        showInstallLabel: true,
      },
    });
    initializedRef.current = true;

    const unsubscribeState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      setAddress(event.payload.address ?? null);
    });

    const unsubscribeWalletSelected = StellarWalletsKit.on(
      KitEventType.WALLET_SELECTED,
      (event) => {
        setWalletId(event.payload.id ?? null);
      }
    );

    const unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setWalletId(null);
    });

    void refreshSupportedWallets();
    void syncAddress();

    return () => {
      unsubscribeState();
      unsubscribeWalletSelected();
      unsubscribeDisconnect();
    };
  }, []);

  async function refreshSupportedWallets() {
    try {
      const wallets = await StellarWalletsKit.refreshSupportedWallets();
      setSupportedWallets(wallets);
    } catch (error) {
      console.error('Error loading supported Stellar wallets:', error);
      setSupportedWallets([]);
    }
  }

  async function syncAddress() {
    try {
      const { address: nextAddress } = await StellarWalletsKit.getAddress();
      setAddress(nextAddress);
      return nextAddress;
    } catch {
      setAddress(null);
      return null;
    }
  }

  async function connect() {
    if (address) {
      return address;
    }

    setConnecting(true);
    try {
      const { address: nextAddress } = await StellarWalletsKit.authModal();
      setAddress(nextAddress);
      await refreshSupportedWallets();
      return nextAddress;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const wasCancelled = /cancelled|canceled|rejected|closed/i.test(message);

      if (!wasCancelled) {
        console.error('Error connecting Stellar wallet:', error);
      }

      return null;
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    try {
      await StellarWalletsKit.disconnect();
    } catch (error) {
      console.error('Error disconnecting Stellar wallet:', error);
    } finally {
      setAddress(null);
      setWalletId(null);
    }
  }

  async function openProfile() {
    if (!address) {
      return;
    }

    await StellarWalletsKit.profileModal();
  }

  return (
    <StellarWalletContext.Provider
      value={{
        address,
        connected: Boolean(address),
        connecting,
        walletId,
        supportedWallets,
        hasAvailableWallet: supportedWallets.some(
          (wallet) => wallet.isAvailable || wallet.isPlatformWrapper
        ),
        connect,
        disconnect,
        refreshAddress: syncAddress,
        openProfile,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);

  if (!context) {
    throw new Error('useStellarWallet must be used within a StellarWalletProvider');
  }

  return context;
}

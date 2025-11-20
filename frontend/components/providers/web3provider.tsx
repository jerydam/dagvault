'use client';

import { ReactNode, useEffect, useState } from 'react';
import { initializeProvider } from '@/lib/web3';
import { Loader2 } from 'lucide-react';

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * @deprecated This provider component is now a simple wrapper to ensure the
 * Ethers.js provider/signer is initialized as soon as the app loads.
 * It replaces the Wagmi/React Query setup.
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeProvider();
        setIsReady(true);
      } catch (err: any) {
        // This will catch errors like 'MetaMask not installed' if called outside a component
        // but here it's fine for initial setup.
        console.error('Failed to initialize Web3 provider:', err);
        setError(err.message || 'Failed to connect wallet provider.');
        setIsReady(true); // Still mark as ready to render app content
      }
    };

    init();
  }, []);

  if (!isReady) {
    // Optional: Show a loading state while Ethers is connecting/initializing
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Connecting to Wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Optional: Show an error banner if initialization failed (e.g., no wallet)
    // Note: The app should still render and prompt for connection later.
    console.warn('Web3 initialization error. App will attempt to proceed.');
  }

  // Once the initialization attempt is complete, render children.
  return <>{children}</>;
}
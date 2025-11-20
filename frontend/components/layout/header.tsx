'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { useAccount, useConnect, useDisconnect } from 'wagmi'; // REMOVED
// import { injected } from 'wagmi/connectors'; // REMOVED
import { formatAddress } from '@/lib/format';
import { cn } from '@/lib/utils';
import { BrowserProvider, hexlify } from 'ethers';

// Chain ID for Base sepolia
const BASE_SEPOLIA_CHAIN_ID = 84532; 

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Ethers/Raw RPC state to replace Wagmi hooks
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const isCorrectChain = chainId === BASE_SEPOLIA_CHAIN_ID;

  // --- Theme Logic ---
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) { // Toggle applies to the next state
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // --- Web3 Logic (Replacing Wagmi) ---

  const checkWalletStatus = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      // 1. Check Accounts (Connection status)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const connected = accounts && accounts.length > 0;
      setIsConnected(connected);
      setAddress(connected ? accounts[0] : null);

      if (connected) {
        // 2. Check Chain ID
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDec = parseInt(chainIdHex, 16);
        setChainId(chainIdDec);
      } else {
        setChainId(null);
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
      setIsConnected(false);
      setAddress(null);
      setChainId(null);
    }
  }, []);
  
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask or a similar wallet is required.');
      return;
    }
    try {
      // Request accounts using Ethers/RPC
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      checkWalletStatus();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    // There is no standard RPC method for "disconnecting" a wallet
    // (the connection is usually persistent until the user manually disconnects
    // via MetaMask or clears storage). We simulate a local "disconnect"
    // by clearing our application state.
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    console.log('Wallet state cleared locally.');
    // NOTE: To truly disconnect in the wallet, the user must use the wallet interface.
    // If using a library like Web3Modal, you would call its disconnect function here.
  };

  useEffect(() => {
    checkWalletStatus();

    if (typeof window.ethereum === 'undefined') return;

    // Set up listeners for changes (Ethers/Wagmi best practice)
    const handleChainChanged = (chainIdHex: string) => {
      // When chain changes, re-run status check
      checkWalletStatus(); 
    };

    const handleAccountsChanged = (accounts: string[]) => {
      // When account changes, re-run status check
      checkWalletStatus();
    };

    // NOTE: Using window.ethereum.on is typical for raw RPC/Ethers setup
    // @ts-ignore
    window.ethereum.on('chainChanged', handleChainChanged);
    // @ts-ignore
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Clean up listeners
    return () => {
      // @ts-ignore
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      // @ts-ignore
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [checkWalletStatus]);


  // --- Render ---
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">BD</span>
          </div>
          <span className="hidden sm:inline">Multisig Factory</span>
        </div>

        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Network Indicator */}
          {isConnected && chainId !== null && (
             <div className={cn(
               "hidden sm:flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border",
               isCorrectChain ? "border-emerald-500/30 text-emerald-600" : "border-red-500/30 text-red-600"
             )}>
               <div className={cn(
                 "h-2 w-2 rounded-full",
                 isCorrectChain ? "bg-emerald-500" : "bg-red-500"
               )} />
               <span>{isCorrectChain ? 'Base sepolia' : 'Wrong Network'}</span>
             </div>
          )}

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Connect/Disconnect Wallet */}
          {isConnected && address ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={disconnectWallet}
            >
              {formatAddress(address, 6)}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="hidden sm:flex"
              onClick={connectWallet}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      {/* Sidebar (Implementation not included, but toggle state handles it) */}
    </header>
  );
}
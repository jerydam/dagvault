'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Menu, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/format';
import { cn } from '@/lib/utils';
import Image from 'next/image';
// Chain ID for Base Sepolia (or your preferred chain)
const TARGET_CHAIN_ID = 84532; 
const TARGET_CHAIN_NAME = 'Base Sepolia';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  
  // Web3 State
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const isCorrectChain = chainId === TARGET_CHAIN_ID;

  // --- Theme Logic ---
  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // --- Web3 Logic ---
  const checkWalletStatus = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const connected = accounts && accounts.length > 0;
      setIsConnected(connected);
      setAddress(connected ? accounts[0] : null);

      if (connected) {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDec = parseInt(chainIdHex, 16);
        setChainId(chainIdDec);
      } else {
        setChainId(null);
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    }
  }, []);
  
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is required.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      checkWalletStatus();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    // Visual disconnect only
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
  };

  useEffect(() => {
    checkWalletStatus();
    if (typeof window.ethereum === 'undefined') return;

    // @ts-ignore
    window.ethereum.on('chainChanged', checkWalletStatus);
    // @ts-ignore
    window.ethereum.on('accountsChanged', checkWalletStatus);

    return () => {
      // @ts-ignore
      window.ethereum.removeListener('chainChanged', checkWalletStatus);
      // @ts-ignore
      window.ethereum.removeListener('accountsChanged', checkWalletStatus);
    };
  }, [checkWalletStatus]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        
        {/* Mobile Menu Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden shrink-0"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo - Visible on Mobile Header (Hidden on Desktop if Sidebar has it) */}
        
         <Image
          src={"/logo.png"}
          alt="Sigma Vault Logo"
          width={50}
          height={50}
          className=""
         />
        

        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Network Badge */}
          {isConnected && chainId !== null && (
             <div className={cn(
               "hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
               isCorrectChain 
                 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                 : "border-destructive/30 bg-destructive/10 text-destructive"
             )}>
               <div className={cn(
                 "h-2 w-2 rounded-full animate-pulse",
                 isCorrectChain ? "bg-emerald-500" : "bg-destructive"
               )} />
               <span>{isCorrectChain ? TARGET_CHAIN_NAME : 'Wrong Net'}</span>
             </div>
          )}

          {/* Dark Mode */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Wallet Button */}
          {isConnected && address ? (
            <Button
              variant="outline"
              onClick={disconnectWallet}
              className="hidden sm:flex gap-2 border-primary/20 hover:bg-primary/5"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              {formatAddress(address, 4)}
            </Button>
          ) : (
            <Button onClick={connectWallet} className="hidden sm:flex gap-2 shadow-lg shadow-primary/20">
              <Wallet className="h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// NOTE: Ethers.js is used for utilities, but we interact directly with window.ethereum.
import { BrowserProvider, hexlify } from 'ethers';

// Celo Sepolia Chain ID in decimal format
const CELO_SEPOLIA_CHAIN_ID = 11142220;


export function NetworkSwitchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to check connection and chain ID
  const checkNetworkStatus = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setIsConnected(false);
      setCurrentChainId(null);
      return;
    }

    try {
      // Check if wallet is connected (by checking accounts)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const connected = accounts && accounts.length > 0;
      setIsConnected(connected);

      if (connected) {
        // Get current chain ID
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDec = parseInt(chainIdHex, 16);
        setCurrentChainId(chainIdDec);

        // Show modal if connected but on wrong chain
        if (chainIdDec !== CELO_SEPOLIA_CHAIN_ID) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error checking network status:', error);
      setIsConnected(false);
      setCurrentChainId(null);
      setIsOpen(false);
    }
  }, []);

  // Handler for network switch
  const handleSwitchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask or similar wallet not found.');
      return;
    }

    try {
      // Ethers/RPC method to switch network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_SEPOLIA_CHAIN_ID }],
      });
      
      // If successful, the 'chainChanged' event will trigger checkNetworkStatus
      setIsOpen(false); 
    } catch (error: any) {
      // 4902 is the error code for "Chain hasn't been added to MetaMask."
      if (error.code === 4902) {
        // If the chain isn't added, attempt to add it first
        console.log('Chain not recognized, attempting to add...');
        await addCeloSepoliaChain();
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  // Helper function to add the chain if not present
  const addCeloSepoliaChain = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CELO_SEPOLIA_CHAIN_ID,
            chainName: 'Celo Sepolia Testnet',
            nativeCurrency: {
              name: 'Celo',
              symbol: 'CELO',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia-rc.celo-testnet.org/'], 
            blockExplorerUrls: ['https://celo-sepolia.explorers.ws/'],
          },
        ],
      });
      // After adding, wallet automatically switches, triggering 'chainChanged'
    } catch (addError) {
      console.error('Failed to add Celo Sepolia Testnet:', addError);
    }
  };


  useEffect(() => {
    checkNetworkStatus();

    if (typeof window.ethereum === 'undefined') return;

    // Set up listeners for changes (Ethers/Wagmi best practice)
    const handleChainChanged = (chainIdHex: string) => {
      // Reload on network change to clear state and re-initialize
      window.location.reload();
    };

    const handleAccountsChanged = (accounts: string[]) => {
      // Reload on account change
      window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Clean up listeners
    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [checkNetworkStatus]); // Dependency on useCallback

  // Render nothing if not connected or already on the correct chain
  if (!isConnected || currentChainId === CELO_SEPOLIA_CHAIN_ID) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>Wrong Network</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            You are currently connected to the wrong network. Please switch to Celo Sepolia to continue using the Multisig Factory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-semibold text-foreground">Required: Celo Sepolia Testnet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Current: {currentChainId ? `Chain ID: ${currentChainId}` : 'Unknown'}
          </p>
          <p className="text-muted-foreground text-xs">
            Required: Chain ID: {CELO_SEPOLIA_CHAIN_ID}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction onClick={handleSwitchNetwork} className="bg-primary text-primary-foreground">
            Switch Network
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
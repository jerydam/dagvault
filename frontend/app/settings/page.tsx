
// ============================================================================
// SettingsPage
// ============================================================================
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSigner, initializeProvider } from '@/lib/web3';

export default function SettingsPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    const init = async () => {
      try {
        const { signer } = await initializeProvider();
        const address = await signer.getAddress();
        setWalletAddress(address);
      } catch (err) {
        console.error('Failed to load wallet:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleDisconnect = async () => {
    try {
      setWalletAddress('');
      // Clear any stored connection data
      if (typeof window !== 'undefined' && window.ethereum) {
        // You might want to disconnect from MetaMask here if it supports it
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <div className="space-y-6">
        {/* Wallet Connection */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>Manage your connected blockchain wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Connected Wallet</Label>
              <div className="p-3 bg-muted rounded-lg text-sm font-mono">
                {walletAddress ? (
                  `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                ) : (
                  'Not connected'
                )}
              </div>
            </div>
            {walletAddress && (
              <Button variant="destructive" onClick={handleDisconnect}>
                Disconnect Wallet
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>Customize your interface experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm mb-3 block">Theme</Label>
              <div className="flex gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('auto')}
                >
                  Auto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm">Transaction confirmations</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm">Timelock expiries</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">Owner changes</span>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
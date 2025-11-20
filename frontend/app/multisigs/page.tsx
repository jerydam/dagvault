'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MultisigCard } from '@/components/multisig-card';
import Link from 'next/link';
import { useFactoryMultisigs } from '@/hooks/use-factory';
import { initializeProvider, MULTISIG_FACTORY_ADDRESS } from '@/lib/web3';

export default function MultisigsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const { multisigs, loading, error } = useFactoryMultisigs(
    MULTISIG_FACTORY_ADDRESS || ''
  );

  useEffect(() => {
    const init = async () => {
      try {
        await initializeProvider();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Filter by Name, Controller, or Wallet
  const filteredMultisigs = multisigs.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.controller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected && !isInitializing) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="border-orange-500/30 bg-orange-500/5 max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Wallet className="h-12 w-12 text-orange-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-orange-700 mb-2">Wallet Not Connected</h3>
            <p className="text-sm text-muted-foreground mb-6">Please connect your wallet to view your multisig treasuries.</p>
            <Button onClick={() => window.location.reload()} variant="outline">Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Multisigs</h1>
            <p className="text-muted-foreground">Manage all your deployed multisig wallets</p>
          </div>
          <Link href="/create">
            <Button size="lg" className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Create New Treasury
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name, Controller or Wallet..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5 mb-8">
            <CardContent className="py-4">
              <p className="text-sm text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading || isInitializing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border bg-card animate-pulse h-[280px]">
                <CardContent className="py-8">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-24 bg-muted rounded w-full mt-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMultisigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMultisigs.map((multisig) => (
              <MultisigCard key={multisig.controller} multisig={multisig} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/10">
            <CardContent className="py-16 text-center">
              <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                 <Wallet className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Multisigs Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery ? `No results matching "${searchQuery}"` : 'You haven\'t deployed any multisig wallets yet.'}
              </p>
              <Link href="/create">
                <Button>Create your first multisig</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
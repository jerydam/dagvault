'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Zap, Lock, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useFactoryMultisigs } from '@/hooks/use-factory';
import { initializeProvider, MULTISIG_FACTORY_ADDRESS } from '@/lib/web3';

export default function Dashboard() {
  const { multisigs, loading } = useFactoryMultisigs(MULTISIG_FACTORY_ADDRESS);
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [network, setNetwork] = useState<{ chainId: bigint; name: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { provider } = await initializeProvider();
        setIsConnected(true);
        
        const net = await provider.getNetwork();
        setNetwork(net);
      } catch (err) {
        console.warn('Wallet not connected');
        setIsConnected(false);
      } finally {
        setIsInitializing(false);
        setMounted(true);
      }
    };

    init();
  }, []);

  if (!mounted || isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Connecting to Blockchain...</p>
        </div>
      </div>
    );
  }

  const isFactoryConfigured = MULTISIG_FACTORY_ADDRESS && MULTISIG_FACTORY_ADDRESS.length === 42;

  // Stats Calculation
  const totalMultisigs = multisigs.length;
  // Safety checks for optional arrays
  const totalTransactions = multisigs.reduce((sum, m) => sum + (m.transactions ? m.transactions.length : 0), 0);
  const totalOwners = multisigs.reduce((sum, m) => sum + (m.owners ? m.owners.length : 0), 0);
  const tvlLocked = multisigs.reduce((sum, m) => sum + parseFloat(m.balance || '0'), 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        
        {/* Configuration Warning */}
        {!isFactoryConfigured && (
          <Card className="mb-8 border-orange-500/30 bg-orange-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-600">Factory Address Not Configured</p>
                  <p className="text-sm text-muted-foreground">
                    Please set <code className="bg-orange-500/10 px-1 py-0.5 rounded">NEXT_PUBLIC_FACTORY_ADDRESS</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Network Info */}
        {network && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground border">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Chain ID: {network.chainId.toString()} ({network.name})
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-16 text-center py-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance tracking-tight">
             Secure Company Treasury
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto leading-relaxed">
            Deploy percentage-based multisig wallets with advanced governance, timelocks, and role-based ownership.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="w-full sm:w-auto h-12 text-lg px-8 shadow-lg shadow-primary/20" disabled={!isFactoryConfigured}>
                Create Treasury
              </Button>
            </Link>
            {isConnected ? (
              <Link href="/multisigs">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-lg px-8">
                  My Wallets
                </Button>
              </Link>
            ) : (
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-lg px-8" onClick={() => window.location.reload()}>
                  Connect Wallet
                </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Total Treasuries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '-' : totalMultisigs}</div>
              <p className="text-xs text-muted-foreground mt-1">Deployed contracts</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '-' : totalTransactions}</div>
              <p className="text-xs text-muted-foreground mt-1">Processed proposals</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '-' : totalOwners}</div>
              <p className="text-xs text-muted-foreground mt-1">Active signers</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Value Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loading ? '-' : tvlLocked.toFixed(2)} <span className="text-sm font-normal text-foreground">ETH</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Secured in wallets</p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Weighted Voting</h3>
            <p className="text-muted-foreground">
                Assign different percentages of ownership to stakeholders (e.g., CEO 40%, CTO 30%, Investors 30%) rather than 1-person-1-vote.
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Batch Execution</h3>
            <p className="text-muted-foreground">
                Save on gas fees and administrative time by approving and executing multiple transfers or configuration changes in a single transaction.
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Wallet Abstraction</h3>
            <p className="text-muted-foreground">
                Logic and Funds are separated. The Controller contract manages governance, while a separate Company Wallet holds the funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, Users, Zap, Lock, Loader2, AlertCircle, 
  Wallet, ArrowRight, Layers, ShieldCheck, LayoutDashboard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium tracking-wide animate-pulse">INITIALIZING SIGMA PROTOCOL</p>
      </div>
    );
  }

  const isFactoryConfigured = MULTISIG_FACTORY_ADDRESS && MULTISIG_FACTORY_ADDRESS.length === 42;

  // Stats Calculation
  const totalMultisigs = multisigs.length;
  const totalTransactions = multisigs.reduce((sum, m) => sum + (m.transactions ? m.transactions.length : 0), 0);
  const totalOwners = multisigs.reduce((sum, m) => sum + (m.owners ? m.owners.length : 0), 0);
  const tvlLocked = multisigs.reduce((sum, m) => sum + parseFloat(m.balance || '0'), 0);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      
      {/* Navbar / Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center rounded-lg">
              Σ
            </div>
            <span>SIGMA</span>
          </div>
          
          {/* Network Status */}
          {network ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground border">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span>{network.name} ({network.chainId.toString()})</span>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Connect
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Configuration Warning */}
        {!isFactoryConfigured && (
          <Card className="mb-8 border-destructive/50 bg-destructive/10">
            <CardContent className="py-4">
              <div className="flex items-start sm:items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 sm:mt-0" />
                <div>
                  <p className="text-sm font-bold text-destructive">Configuration Error</p>
                  <p className="text-xs sm:text-sm text-destructive/80">
                    Factory address missing. Set <code className="bg-black/10 px-1 rounded">NEXT_PUBLIC_FACTORY_ADDRESS</code> in your env.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Section */}
        <div className="relative py-12 md:py-24 lg:py-32 flex flex-col items-center text-center space-y-8">
          
          {/* Background Gradient Blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

          <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
            V1.0 Protocol Live
          </Badge>

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
              The Sum of <br className="hidden sm:block" />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                Secure Finance
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Sigma aggregates multisig security with batch transaction efficiency. Manage your company treasury with percentage-based governance.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Link href="/create" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 text-lg px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                Initialize Treasury <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {isConnected ? (
              <Link href="/multisigs" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-14 text-lg px-8 rounded-xl">
                  <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="outline" className="w-full h-14 text-lg px-8 rounded-xl" onClick={() => window.location.reload()}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid - Responsive: 1col mobile -> 2col tablet -> 4col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
          <StatsCard 
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            label="Secured Treasuries"
            value={loading ? '-' : totalMultisigs}
            sub="Active Contracts"
          />
          <StatsCard 
            icon={<Layers className="h-5 w-5 text-blue-500" />}
            label="Operations"
            value={loading ? '-' : totalTransactions}
            sub="Processed Batches"
          />
          <StatsCard 
            icon={<Users className="h-5 w-5 text-violet-500" />}
            label="Signers"
            value={loading ? '-' : totalOwners}
            sub="Unique Owners"
          />
          <StatsCard 
            icon={<Wallet className="h-5 w-5 text-emerald-500" />}
            label="Value Locked"
            value={loading ? '-' : `${tvlLocked.toFixed(2)} ETH`}
            sub="Total Assets"
          />
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-16">
          <Feature 
            icon={<BarChart3 className="h-6 w-6 text-primary" />}
            title="Weighted Governance"
            desc="Move beyond 1-person-1-vote. Assign equity-based voting power (e.g., CEO 40%, Investors 60%) for realistic corporate control."
          />
          <Feature 
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="Batch Execution"
            desc="The 'Sigma' advantage. Aggregate dozens of payroll or vendor payments into a single transaction hash to save up to 40% on gas."
          />
          <Feature 
            icon={<Lock className="h-6 w-6 text-primary" />}
            title="Abstracted Security"
            desc="Logic and Liquidity are separated. The Controller manages the rules, while a distinct Vault Contract holds the actual assets."
          />
        </div>
      </main>
    </div>
  );
}

// --- Sub Components for Cleaner Code ---

function StatsCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string | number, sub: string }) {
  return (
    <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-all duration-300 group">
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          {label}
          <div className="p-2 bg-background rounded-lg border group-hover:border-primary/30 transition-colors">
            {icon}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-start p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-border transition-all">
      <div className="bg-primary/10 p-3 rounded-xl mb-4 ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
        {desc}
      </p>
    </div>
  );
}
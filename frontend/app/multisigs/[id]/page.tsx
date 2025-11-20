'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultisigTabs } from '@/components/multisig-tabs';
import Link from 'next/link';
import { 
  getMultisigOwners, 
  getMultisigConfig, 
  getWalletBalance, 
  initializeProvider,
  getConnectedWalletAddress
} from '@/lib/web3';
import { MultiSig } from '@/hooks/use-factory';

export default function MultisigDetailPage() {
  const params = useParams();
  const controllerAddress = params.id as string;

  const [multisig, setMultisig] = useState<MultiSig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMultisigDetail = async () => {
      try {
        setLoading(true);
        await initializeProvider();

        // 1. FETCH LINKED WALLET ADDRESS
        const walletAddress = await getConnectedWalletAddress(controllerAddress);

        // 2. FETCH DATA IN PARALLEL
        const [owners, config, balance] = await Promise.all([
          getMultisigOwners(controllerAddress),
          getMultisigConfig(controllerAddress), // This now returns { name, ... }
          getWalletBalance(walletAddress), 
        ]);

        const ownerList = owners.addresses.map((addr: string, i: number) => ({
          address: addr,
          name: owners.names[i] || `Owner ${i + 1}`,
          percentage: owners.percentages[i],
          removable: owners.removables[i],
        }));

        setMultisig({
          controller: controllerAddress,
          wallet: walletAddress,
          name: config.name || 'Unnamed Treasury', // Get name from config
          owners: ownerList,
          config,
          balance,
          transactions: [], // Transactions loaded in tab component
          deployed: Date.now(),
        });
      } catch (err: any) {
        console.error("Error loading multisig:", err);
        setError(err.message || 'Failed to load multisig details');
      } finally {
        setLoading(false);
      }
    };

    if (controllerAddress) {
      fetchMultisigDetail();
    }
  }, [controllerAddress]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
         <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full mb-4"/>
            <p className="text-muted-foreground">Loading Multisig Data...</p>
         </div>
      </div>
    );
  }

  if (error || !multisig) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <Link href="/multisigs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Multisigs
          </Button>
        </Link>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 font-semibold">Error loading multisig</p>
            <p className="text-sm text-red-500/80 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="mb-8 max-w-6xl mx-auto">
        <Link href="/multisigs">
          <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 border-b pb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-bold tracking-tight">
                  {multisig.name}
               </h1>
               <div className={`px-2 py-1 rounded text-xs font-medium ${multisig.config.paused ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {multisig.config.paused ? 'PAUSED' : 'ACTIVE'}
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-x-8 gap-y-2 text-sm text-muted-foreground mt-4">
              <div className="group relative">
                <p className="text-xs font-medium text-foreground mb-1">Controller Contract</p>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border">
                   <code className="font-mono">{multisig.controller}</code>
                   <button onClick={() => copyToClipboard(multisig.controller)} className="hover:text-primary"><Copy className="h-3 w-3"/></button>
                </div>
              </div>

              <div className="group relative">
                <p className="text-xs font-medium text-foreground mb-1">Treasury Wallet (Send Funds Here)</p>
                <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md border border-primary/10">
                   <code className="font-mono text-primary">{multisig.wallet}</code>
                   <button onClick={() => copyToClipboard(multisig.wallet)} className="hover:text-primary"><Copy className="h-3 w-3"/></button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-center bg-card border p-4 rounded-xl shadow-sm min-w-[200px]">
             <p className="text-sm text-muted-foreground mb-1">Total Treasury Balance</p>
             <p className="text-3xl font-bold text-primary">{parseFloat(multisig.balance).toFixed(4)} <span className="text-sm text-foreground">ETH</span></p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <MultisigTabs multisig={multisig} />
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, Plus, Layers, Wallet, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultisigTabs } from '@/components/multisig-tabs';
import Link from 'next/link';
import { 
  getMultisigOwners, 
  getMultisigConfig, 
  getWalletBalance, 
  initializeProvider,
  getConnectedWalletAddress,
  getTransaction
} from '@/lib/web3';
import { MultiSig, Transaction } from '@/hooks/use-factory';

// Modals
import { SubmitTransactionModal } from '@/components/modals/submit-transaction-modal';
import { BatchConfirmModal } from '@/components/modals/batch-confirm-modal';

export default function MultisigDetailPage() {
  const params = useParams();
  const controllerAddress = params.id as string;

  const [multisig, setMultisig] = useState<MultiSig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const fetchMultisigDetail = async () => {
      try {
        setLoading(true);
        await initializeProvider();

        const walletAddress = await getConnectedWalletAddress(controllerAddress);

        const [owners, config, balance] = await Promise.all([
          getMultisigOwners(controllerAddress),
          getMultisigConfig(controllerAddress),
          getWalletBalance(walletAddress), 
        ]);

        // Fetch recent transactions (Simple fetch for last 20 IDs)
        const recentTxs: Transaction[] = [];
        for(let i=0; i<20; i++) {
           try {
             const tx = await getTransaction(controllerAddress, i);
             // Filter out uninitialized transactions
             if(tx.initiator !== '0x0000000000000000000000000000000000000000') {
                recentTxs.push({ id: i, ...tx });
             } else {
                break; // Stop if we hit empty
             }
           } catch(e) { break; }
        }

        const ownerList = owners.addresses.map((addr: string, i: number) => ({
          address: addr,
          name: owners.names[i] || `Owner ${i + 1}`,
          percentage: owners.percentages[i],
          removable: owners.removables[i],
        }));

        setMultisig({
          controller: controllerAddress,
          wallet: walletAddress,
          name: config.name || 'Unnamed Treasury',
          owners: ownerList,
          config,
          balance,
          transactions: recentTxs.sort((a, b) => b.id - a.id),
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <div className="flex flex-col items-center animate-pulse">
            <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-primary animate-bounce" />
            </div>
            <p className="text-muted-foreground font-medium">Loading Treasury...</p>
         </div>
      </div>
    );
  }

  if (error || !multisig) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <Card className="border-red-500/30 bg-red-500/5 max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 font-semibold mb-2">Error loading multisig</p>
            <p className="text-sm text-red-500/80 mb-6">{error}</p>
            <Link href="/multisigs">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Back */}
        <Link href="/multisigs" className="inline-block mb-6">
          <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b pb-8 mb-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
                  {multisig.name}
               </h1>
               <Badge variant={multisig.config.paused ? 'destructive' : 'outline'} className={multisig.config.paused ? '' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}>
                  {multisig.config.paused ? 'PAUSED' : 'ACTIVE'}
               </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              {/* Controller Address */}
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
                 <span className="text-xs font-medium uppercase tracking-wider opacity-70">Controller</span>
                 <code className="font-mono text-foreground">{multisig.controller.slice(0,6)}...{multisig.controller.slice(-4)}</code>
                 <button onClick={() => handleCopy(multisig.controller, 'controller')} className="hover:text-primary transition-colors">
                    {copied === 'controller' ? <Check className="h-3.5 w-3.5 text-emerald-500"/> : <Copy className="h-3.5 w-3.5"/>}
                 </button>
              </div>

              {/* Wallet Address (Highlighted) */}
              <div className="flex items-center gap-2 text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-md border border-primary/10">
                 <span className="text-xs font-medium uppercase tracking-wider text-primary/80">Wallet</span>
                 <code className="font-mono text-primary">{multisig.wallet.slice(0,6)}...{multisig.wallet.slice(-4)}</code>
                 <button onClick={() => handleCopy(multisig.wallet, 'wallet')} className="hover:text-primary transition-colors">
                    {copied === 'wallet' ? <Check className="h-3.5 w-3.5 text-emerald-500"/> : <Copy className="h-3.5 w-3.5"/>}
                 </button>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => setIsBatchModalOpen(true)} className="h-10">
                <Layers className="h-4 w-4 mr-2" />
                Batch Confirm
             </Button>
             <Button onClick={() => setIsSubmitModalOpen(true)} className="h-10 shadow-md shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
             </Button>
          </div>
        </div>

        {/* Main Tabs Content */}
        <MultisigTabs multisig={multisig} />
      </div>

      {/* Modals */}
      <SubmitTransactionModal 
         isOpen={isSubmitModalOpen} 
         onClose={() => setIsSubmitModalOpen(false)} 
         controllerAddress={multisig.controller}
         defaultTab="transfer"
      />
      
      <BatchConfirmModal 
         isOpen={isBatchModalOpen} 
         onClose={() => setIsBatchModalOpen(false)} 
         multisig={multisig}
      />
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSig } from '@/hooks/use-factory'; 
import { Copy, Eye, Send, Users, Check, ArrowUpRight, Wallet, Clock } from 'lucide-react';
import { ethers } from 'ethers';
import { SubmitTransactionModal } from '@/components/modals/submit-transaction-modal';
import { formatAmount } from '@/lib/format';

interface OverviewTabProps {
  multisig: MultiSig;
}

export function OverviewTab({ multisig }: OverviewTabProps) {
  const [copied, setCopied] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingTxs = multisig.transactions.filter(tx => !tx.executed).length;
  
  // Find next unlock
  const activeTimelocks = multisig.transactions
    .filter(tx => !tx.executed && Number(tx.timelockEnd) > Date.now() / 1000)
    .sort((a, b) => Number(a.timelockEnd) - Number(b.timelockEnd));

  const nextUnlockTime = activeTimelocks.length > 0 
    ? new Date(Number(activeTimelocks[0].timelockEnd) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    : null;

  const recentTransactions = [...multisig.transactions].slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Card 1: Balance */}
        <Card className="md:col-span-2 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Treasury Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{parseFloat(multisig.balance).toFixed(4)}</span>
              <span className="text-xl font-medium text-muted-foreground">ETH</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg w-fit">
               <span className="opacity-70">Wallet:</span>
               <code className="font-mono">{multisig.wallet}</code>
               <button onClick={() => handleCopy(multisig.wallet)} className="hover:text-primary ml-1">
                 {copied ? <Check className="h-3 w-3 text-emerald-500"/> : <Copy className="h-3 w-3"/>}
               </button>
               <button onClick={() => window.open(`https://sepolia.basescan.org/address/${multisig.wallet}`, '_blank')} className="hover:text-primary ml-1">
                 <ExternalLink className="h-3 w-3"/>
               </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Status */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{pendingTxs}</div>
              <p className="text-xs text-muted-foreground">Transactions awaiting approval</p>
            </div>
            <div className="pt-4 border-t">
               <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Timelock:</span>
                  <span className="font-mono">{(Number(multisig.config.timelockPeriod) / 3600).toFixed(1)}h</span>
               </div>
               {nextUnlockTime && (
                 <div className="flex justify-between text-sm text-orange-500 font-medium">
                    <span>Next Unlock:</span>
                    <span>{nextUnlockTime}</span>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Button 
            variant="default" 
            size="lg" 
            className="h-auto py-6 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-all"
            onClick={() => setIsSubmitModalOpen(true)}
         >
            <Send className="h-6 w-6" />
            <span className="font-semibold">Send Funds</span>
         </Button>
         <Button 
            variant="outline" 
            size="lg" 
            className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all"
            // Note: This would ideally scroll to owners tab or be a link
            onClick={() => document.getElementById('tab-owners')?.click()}
         >
            <Users className="h-6 w-6" />
            <span className="font-semibold">Manage Owners</span>
         </Button>
      </div>

      {/* Recent Activity */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent transactions found.
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {recentTransactions.map((tx) => {
                 const percent = (Number(tx.confirmationCount) / multisig.owners.length) * 100;
                 return (
                  <div key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                       <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.executed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {tx.executed ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}
                       </div>
                       <div>
                          <p className="text-sm font-medium">Transaction #{tx.id}</p>
                          <p className="text-xs text-muted-foreground font-mono">{tx.to.slice(0,6)}...{tx.to.slice(-4)}</p>
                       </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatAmount(tx.value)} ETH</p>
                      <div className="text-xs mt-1 flex items-center justify-end gap-1.5">
                        <span className="text-muted-foreground">{tx.confirmationCount}/{multisig.owners.length}</span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${tx.executed ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{width: `${percent}%`}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SubmitTransactionModal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)}
        controllerAddress={multisig.controller}
      />
    </div>
  );
}

function ExternalLink({ className }: { className?: string }) {
    return <ArrowUpRight className={className} />
}
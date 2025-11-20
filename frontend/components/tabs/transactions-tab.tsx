'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSig, Transaction } from '@/hooks/use-factory';
import { confirmTransaction, revokeConfirmation, executeTransactionManual, getTransaction } from '@/lib/web3';
import { Play, Loader2, Check, X, RefreshCw, FileSearch, ArrowRight, Clock } from 'lucide-react';
import { ethers } from 'ethers';
import { TransactionDetailModal } from '@/components/modals/transaction-detail-modal';
import { formatAmount } from '@/lib/format';

interface TransactionsTabProps {
  multisig: MultiSig;
}

export function TransactionsTab({ multisig }: TransactionsTabProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>(multisig.transactions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [processingTxId, setProcessingTxId] = useState<number | null>(null);
  
  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const fetchedTxs: Transaction[] = [];
    try {
      for (let i = 0; i < 20; i++) {
        try {
          const tx = await getTransaction(multisig.controller, i);
          if (tx.initiator === ethers.ZeroAddress) break; 
          fetchedTxs.push({ id: i, ...tx });
        } catch (e) { break; }
      }
      setTransactions(fetchedTxs.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Error fetching txs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length === 0) fetchTransactions();
  }, [multisig.controller]);

  const handleAction = async (action: 'confirm' | 'revoke' | 'execute', txId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail modal
    setProcessingTxId(txId);
    try {
      if (action === 'confirm') await confirmTransaction(multisig.controller, txId);
      if (action === 'revoke') await revokeConfirmation(multisig.controller, txId);
      if (action === 'execute') await executeTransactionManual(multisig.controller, txId);
      await fetchTransactions();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingTxId(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
     if (statusFilter === 'all') return true;
     if (statusFilter === 'executed') return tx.executed;
     if (statusFilter === 'pending') return !tx.executed;
     return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-card p-2 rounded-lg border">
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-none shadow-none bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchTransactions} disabled={isLoading}>
             <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 && !isLoading && (
           <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
              <FileSearch className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No transactions found matching filters.</p>
           </div>
        )}

        {filteredTransactions.map((tx) => {
          const percent = (Number(tx.confirmationCount) / multisig.owners.length) * 100;
          const isTimelockActive = !tx.executed && Number(tx.timelockEnd) > Date.now()/1000;
          const remainingTime = Math.max(0, Number(tx.timelockEnd) - Date.now()/1000);
          const isProcessing = processingTxId === tx.id;
          const required = (multisig.config.requiredPercentage / 100) * multisig.owners.length;
          const isReady = Number(tx.confirmationCount) >= required;

          return (
            <Card 
               key={tx.id} 
               className="border-border bg-card hover:border-primary/40 transition-colors cursor-pointer group"
               onClick={() => setSelectedTx(tx)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold bg-muted px-2 py-1 rounded">#{tx.id}</span>
                      <Badge variant={tx.executed ? 'default' : 'secondary'} className={tx.executed ? 'bg-emerald-500' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'}>
                        {tx.executed ? 'Executed' : isReady ? 'Ready to Execute' : 'Pending'}
                      </Badge>
                      {isTimelockActive && (
                         <Badge variant="outline" className="text-orange-500 border-orange-500 text-[10px] gap-1">
                            <Clock className="h-3 w-3" /> {Math.ceil(remainingTime/3600)}h lock
                         </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                       <span className="text-muted-foreground w-12">To:</span>
                       <code className="bg-muted/50 px-1 rounded text-xs">{tx.to}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                       <span className="text-muted-foreground w-12">Value:</span>
  <p className="text-sm font-semibold">{formatAmount(tx.value)} ETH</p>                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-6">
                    
                    {/* Progress */}
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-muted-foreground mb-1">Approvals</div>
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-sm">{tx.confirmationCount}/{multisig.owners.length}</span>
                         <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${tx.executed ? 'bg-emerald-500' : 'bg-primary'}`} style={{width: `${percent}%`}}/>
                         </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    {!tx.executed && (
                       <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={(e) => handleAction('confirm', tx.id, e)} disabled={isProcessing}>
                             {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-1"/>} Confirm
                          </Button>
                          
                          {isReady ? (
                             <Button size="sm" onClick={(e) => handleAction('execute', tx.id, e)} disabled={isProcessing || isTimelockActive}>
                                <Play className="h-4 w-4 mr-1"/> Execute
                             </Button>
                          ) : (
                             <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleAction('revoke', tx.id, e)} disabled={isProcessing || Number(tx.confirmationCount) === 0}>
                                <X className="h-4 w-4"/>
                             </Button>
                          )}
                       </div>
                    )}
                    
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Modal */}
      <TransactionDetailModal 
         isOpen={!!selectedTx}
         transaction={selectedTx!}
         controllerAddress={multisig.controller}
         onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
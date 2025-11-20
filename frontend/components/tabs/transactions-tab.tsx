'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSig, Transaction } from '@/hooks/use-factory';
import { confirmTransaction, revokeConfirmation, executeTransactionManual, getTransaction } from '@/lib/web3';
import { Play, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

interface TransactionsTabProps {
  multisig: MultiSig;
}

export function TransactionsTab({ multisig }: TransactionsTabProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>(multisig.transactions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [processingTxId, setProcessingTxId] = useState<number | null>(null);

  // If the multisig prop didn't include transactions (optimization), fetch them here
  const fetchTransactions = async () => {
    setIsLoading(true);
    const fetchedTxs: Transaction[] = [];
    // Naive fetch: try fetching IDs 0 to 10 (or calculate a sensible range if possible)
    // In production, you'd use an event indexer or track 'transactionCount' in contract
    try {
      for (let i = 0; i < 20; i++) {
        try {
          const tx = await getTransaction(multisig.controller, i);
          // If initiator is zero address, it likely doesn't exist (EVM storage default)
          if (tx.initiator === ethers.ZeroAddress) break; 
          fetchedTxs.push({ id: i, ...tx });
        } catch (e) {
          break; // Stop when we hit a non-existent ID
        }
      }
      // Sort desc
      setTransactions(fetchedTxs.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Error fetching txs", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount if empty
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions();
    }
  }, [multisig.controller]);

  const handleAction = async (action: 'confirm' | 'revoke' | 'execute', txId: number) => {
    setProcessingTxId(txId);
    try {
      if (action === 'confirm') await confirmTransaction(multisig.controller, txId);
      if (action === 'revoke') await revokeConfirmation(multisig.controller, txId);
      if (action === 'execute') await executeTransactionManual(multisig.controller, txId);
      
      alert(`Transaction ${action} submitted successfully!`);
      // Refresh data after action
      await fetchTransactions();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingTxId(null);
    }
  };

  const getStatusColor = (tx: Transaction) => {
    if (tx.executed) return 'emerald';
    // Check if confirmations met
    const required = (multisig.config.requiredPercentage / 100) * multisig.owners.length;
    if (Number(tx.confirmationCount) >= required) return 'amber';
    return 'blue';
  };

  const getStatusLabel = (tx: Transaction) => {
    if (tx.executed) return 'Executed';
    const required = (multisig.config.requiredPercentage / 100) * multisig.owners.length;
    if (Number(tx.confirmationCount) >= required) return 'Ready to Execute';
    return 'Pending';
  };

  // Filter logic
  const filteredTransactions = transactions.filter(tx => {
     if (statusFilter === 'all') return true;
     if (statusFilter === 'executed') return tx.executed;
     if (statusFilter === 'pending') return !tx.executed;
     return true;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTransactions} disabled={isLoading}>
             <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 && !isLoading && (
           <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
        )}

        {filteredTransactions.map((tx) => {
          const statusColor = getStatusColor(tx);
          const statusLabel = getStatusLabel(tx);
          const isProcessing = processingTxId === tx.id;
          const percent = (Number(tx.confirmationCount) / multisig.owners.length) * 100;
          const isTimelockActive = !tx.executed && Number(tx.timelockEnd) > Date.now()/1000;
          const remainingTime = Math.max(0, Number(tx.timelockEnd) - Date.now()/1000);

          return (
            <Card key={tx.id} className="border-border bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Transaction #{tx.id}</span>
                      <Badge
                        variant={statusColor === 'emerald' ? 'default' : 'secondary'}
                        className={statusColor === 'amber' ? 'bg-amber-500 text-white' : ''}
                      >
                        {statusLabel}
                      </Badge>
                      {isTimelockActive && (
                         <Badge variant="outline" className="text-orange-500 border-orange-500">
                            Locked: {(remainingTime/3600).toFixed(1)}h
                         </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>To: {tx.to}</p>
                      {tx.isTokenTransfer && <p>Type: ERC20 Transfer</p>}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="font-semibold">{ethers.formatEther(tx.value)} ETH</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.confirmationCount}/{multisig.owners.length} Confirmations
                    </p>
                  </div>
                </div>

                {/* Confirmation Progress */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${tx.executed ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                {!tx.executed && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleAction('confirm', tx.id)}
                      disabled={isProcessing}
                    >
                       {isProcessing && <Loader2 className="mr-2 h-3 w-3 animate-spin"/>}
                       <Check className="mr-2 h-3 w-3"/> Confirm
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleAction('revoke', tx.id)}
                      disabled={Number(tx.confirmationCount) === 0 || isProcessing}
                    >
                      <X className="mr-2 h-3 w-3"/> Revoke
                    </Button>

                    {statusLabel === 'Ready to Execute' && (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAction('execute', tx.id)}
                        disabled={isTimelockActive || isProcessing}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Play className="mr-2 h-3 w-3" />}
                        Execute
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
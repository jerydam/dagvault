'use client';

import { useState } from 'react';
import { X, Copy, ExternalLink, CheckCircle, Clock, Loader2, Play, XCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/hooks/use-factory'; 
import { confirmTransaction, revokeConfirmation, executeTransactionManual } from '@/lib/web3';
import { ethers } from 'ethers';
import { formatAmount } from '@/lib/format';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction?: Transaction;
  controllerAddress: string;
  onClose: () => void;
}

export function TransactionDetailModal({
  isOpen,
  transaction,
  controllerAddress,
  onClose,
}: TransactionDetailModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopy = (text: string) => {
     navigator.clipboard.writeText(text);
     setCopied(true);
     setTimeout(() => setCopied(false), 1000);
  };

  const handleAction = async (action: 'confirm' | 'revoke' | 'execute') => {
    setIsPending(true);
    try {
      if (action === 'confirm') await confirmTransaction(controllerAddress, transaction.id);
      if (action === 'revoke') await revokeConfirmation(controllerAddress, transaction.id);
      if (action === 'execute') await executeTransactionManual(controllerAddress, transaction.id);
      
      onClose();
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-border bg-card max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
             <h2 className="text-xl font-bold">Transaction #{transaction.id}</h2>
             <p className="text-xs text-muted-foreground">{new Date(Number(transaction.timestamp) * 1000).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground bg-muted p-1 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            {transaction.executed ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 px-4 py-1 text-base">
                 <CheckCircle className="h-4 w-4 mr-2"/> Executed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-1 text-base">
                 <Clock className="h-4 w-4 mr-2"/> Pending Execution
              </Badge>
            )}
          </div>

          {/* Data Table */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            
            {/* Type */}
            <div>
               <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Operation Type</p>
               <p className="font-medium text-sm flex items-center gap-2">
                  {transaction.isTokenTransfer ? 'ERC20 Token Transfer' : transaction.data !== '0x' ? 'Contract Interaction' : 'Native ETH Transfer'}
               </p>
            </div>

            {/* From */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Initiated By</p>
              <div className="flex items-center gap-2 group">
                <code className="text-xs font-mono break-all">{transaction.initiator}</code>
                <button onClick={() => handleCopy(transaction.initiator)} className="opacity-50 group-hover:opacity-100">
                   {copied ? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3"/>}
                </button>
              </div>
            </div>

            {/* To */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Address</p>
              <div className="flex items-center gap-2 group">
                <code className="text-xs font-mono break-all">{transaction.to}</code>
                <button onClick={() => handleCopy(transaction.to)} className="opacity-50 group-hover:opacity-100">
                   <Copy className="h-3 w-3"/>
                </button>
              </div>
            </div>

            {/* Value */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Value</p>
              <p className="text-xl font-bold">
                {formatAmount(transaction.value)} <span className="text-sm font-normal text-muted-foreground">ETH</span>
              </p>
            </div>

            {/* Data */}
            {transaction.data !== '0x' && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Calldata</p>
                <div className="bg-muted p-2 rounded max-h-24 overflow-y-auto border">
                  <code className="text-[10px] break-all font-mono">{transaction.data}</code>
                </div>
              </div>
            )}
          </div>

          {/* Confirmations */}
          <div>
              <div className="flex justify-between mb-2">
                 <span className="text-sm font-medium">Confirmations</span>
                 <span className="text-sm text-muted-foreground">{transaction.confirmationCount} Collected</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${transaction.executed ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, (Number(transaction.confirmationCount) * 20))}%` }} />
              </div>
          </div>

          {/* Actions */}
          {!transaction.executed && (
            <div className="grid grid-cols-2 gap-3 pt-2">
               <Button variant="outline" onClick={() => handleAction('confirm')} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2"/>} 
                  Confirm
               </Button>
               
               <Button onClick={() => handleAction('execute')} disabled={isPending}>
                  <Play className="h-4 w-4 mr-2"/> Execute
               </Button>

               <Button variant="ghost" className="col-span-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => handleAction('revoke')} disabled={isPending || Number(transaction.confirmationCount) === 0}>
                  Revoke my confirmation
               </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
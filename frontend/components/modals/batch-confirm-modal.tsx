'use client';

import { useState } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSig } from '@/hooks/use-factory';
import { confirmTransactionsBatch } from '@/lib/web3';
import { ethers } from 'ethers';
import { formatAmount } from '@/lib/format';

interface BatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  multisig: MultiSig;
}

export function BatchConfirmModal({ isOpen, onClose, multisig }: BatchConfirmModalProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter only transactions that are NOT executed
  const pendingTransactions = multisig.transactions.filter(tx => !tx.executed);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === pendingTransactions.length ? [] : pendingTransactions.map((t) => t.id));
  };

  const handleBatchConfirm = async () => {
    setError(null);
    setIsPending(true);
    try {
      await confirmTransactionsBatch(multisig.controller, selected);
      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Batch confirm failed');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-border bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Batch Confirm</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {pendingTransactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No pending transactions to confirm.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Checkbox
                  checked={selected.length === pendingTransactions.length && pendingTransactions.length > 0}
                  onCheckedChange={toggleAll}
                />
                <label className="text-sm font-medium flex-1">
                  Select All ({selected.length}/{pendingTransactions.length})
                </label>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Checkbox
                      checked={selected.includes(tx.id)}
                      onCheckedChange={() => toggleSelect(tx.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Tx #{tx.id}</p>
                      <p className="text-xs text-muted-foreground truncate">To: {tx.to}</p>
                    </div>
                    <div className="text-right">
  <p className="text-sm font-semibold">{formatAmount(tx.value)} ETH</p>                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-500 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={selected.length === 0 || isPending} onClick={handleBatchConfirm}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirm ({selected.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
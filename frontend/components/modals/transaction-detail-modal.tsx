'use client';

import { X, Copy, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/lib/types';
import { formatAddress } from '@/lib/format';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction?: Transaction;
  onClose: () => void;
}

export function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  if (!isOpen || !transaction) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-border bg-card max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-xl font-bold">Transaction #{transaction.id}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            {transaction.executed ? (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <Badge variant="default" className="bg-emerald-600">
                  Executed
                </Badge>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-orange-500" />
                <Badge variant="secondary" className="bg-orange-600">
                  Pending
                </Badge>
              </>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Initiator</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">{formatAddress(transaction.initiator, 6)}</code>
                <button
                  onClick={() => handleCopy(transaction.initiator)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">To Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">{formatAddress(transaction.to, 6)}</code>
                <button
                  onClick={() => handleCopy(transaction.to)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Value</p>
              <p className="text-lg font-semibold">
                {(Number(transaction.value) / 1e18).toFixed(4)} DAG
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Confirmations</p>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(transaction.confirmationCount / 5) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-medium">
                  {transaction.confirmationCount}/5 confirmations
                </p>
              </div>
            </div>

            {!transaction.executed && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Confirmed By</p>
                <div className="space-y-1">
                  {transaction.confirmations.map((addr, idx) => (
                    <p key={idx} className="text-xs text-foreground">
                      {formatAddress(addr)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!transaction.executed && (
            <div className="flex gap-2 pt-4 border-t border-border flex-col sm:flex-row">
              <Button variant="outline" className="flex-1" size="sm">
                Confirm
              </Button>
              {transaction.confirmationCount > 0 && (
                <Button variant="ghost" className="flex-1 text-destructive" size="sm">
                  Revoke
                </Button>
              )}
            </div>
          )}

          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

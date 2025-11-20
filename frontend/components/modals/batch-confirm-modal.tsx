'use client';

import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface BatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const pendingTransactions = [
  { id: 15, to: '0xabc...def', value: '10 DAG', status: 'Pending' },
  { id: 14, to: '0x123...456', value: '5 DAG', status: 'Pending' },
  { id: 13, to: '0x789...abc', value: '2.5 DAG', status: 'Pending' },
];

export function BatchConfirmModal({ isOpen, onClose }: BatchConfirmModalProps) {
  const [selected, setSelected] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === pendingTransactions.length ? [] : pendingTransactions.map((t) => t.id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-border bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Batch Confirm Transactions</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Select All */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Checkbox
              checked={selected.length === pendingTransactions.length}
              onCheckedChange={toggleAll}
            />
            <label className="text-sm font-medium flex-1">
              Select All ({selected.length}/{pendingTransactions.length})
            </label>
          </div>

          {/* Transaction List */}
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
                  <p className="text-sm font-medium">#{tx.id}</p>
                  <p className="text-xs text-muted-foreground truncate">{tx.to}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{tx.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={selected.length === 0}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm ({selected.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

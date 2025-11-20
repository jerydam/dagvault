'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface SubmitTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitTransactionModal({ isOpen, onClose }: SubmitTransactionModalProps) {
  const [txType, setTxType] = useState<'eth' | 'token' | 'contract'>('eth');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-border bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Submit Transaction</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          <Tabs value={txType} onValueChange={(v) => setTxType(v as 'eth' | 'token' | 'contract')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="eth">ETH Transfer</TabsTrigger>
              <TabsTrigger value="token">Token Transfer</TabsTrigger>
              <TabsTrigger value="contract">Contract Call</TabsTrigger>
            </TabsList>

            {/* ETH Transfer */}
            <TabsContent value="eth" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="eth-to" className="text-sm">
                  To Address
                </Label>
                <Input
                  id="eth-to"
                  placeholder="0x... or ENS name"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="eth-amount" className="text-sm">
                  Amount (DAG)
                </Label>
                <Input
                  id="eth-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="eth-note" className="text-sm">
                  Note (optional)
                </Label>
                <Input
                  id="eth-note"
                  placeholder="e.g., Payment for services"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Token Transfer */}
            <TabsContent value="token" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="token-select" className="text-sm">
                  Select Token
                </Label>
                <Select value={token} onValueChange={setToken}>
                  <SelectTrigger id="token-select" className="mt-1">
                    <SelectValue placeholder="Choose a token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="dai">DAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="token-to" className="text-sm">
                  To Address
                </Label>
                <Input
                  id="token-to"
                  placeholder="0x..."
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="token-amount" className="text-sm">
                  Amount
                </Label>
                <Input
                  id="token-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Contract Call */}
            <TabsContent value="contract" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="contract-address" className="text-sm">
                  Contract Address
                </Label>
                <Input
                  id="contract-address"
                  placeholder="0x..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="function" className="text-sm">
                  Function
                </Label>
                <Input
                  id="function"
                  placeholder="Select function"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="parameters" className="text-sm">
                  Parameters
                </Label>
                <Input
                  id="parameters"
                  placeholder="Encoded parameters"
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {to && amount && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground">Transaction Preview</p>
              <div className="text-sm space-y-1">
                <p>To: {to}</p>
                <p>Amount: {amount} {txType === 'token' ? token : 'DAG'}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={onClose}>
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

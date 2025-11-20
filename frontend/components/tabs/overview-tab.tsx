'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSig } from '@/hooks/use-factory'; // Updated import path
import { Copy, Eye, Send, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

interface OverviewTabProps {
  multisig: MultiSig;
}

export function OverviewTab({ multisig }: OverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate real stats
  const pendingTxs = multisig.transactions.filter(tx => !tx.executed).length;
  
  // Find the earliest active timelock
  const activeTimelocks = multisig.transactions
    .filter(tx => !tx.executed && Number(tx.timelockEnd) > Date.now() / 1000)
    .sort((a, b) => Number(a.timelockEnd) - Number(b.timelockEnd));

  const nextUnlockTime = activeTimelocks.length > 0 
    ? new Date(Number(activeTimelocks[0].timelockEnd) * 1000).toLocaleString() 
    : null;

  // Get recent 3 transactions
  const recentTransactions = [...multisig.transactions]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Wallet Summary */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Wallet Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Wallet */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Company Wallet Address</label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono truncate">{multisig.wallet}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(multisig.wallet)}
                className="hover:text-foreground transition-colors"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.open(`https://etherscan.io/address/${multisig.wallet}`, '_blank')}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            {copied && <p className="text-xs text-emerald-500 text-right">Copied to clipboard!</p>}
          </div>

          {/* Balance */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
              <p className="text-2xl font-bold">{multisig.balance} <span className="text-sm font-normal text-muted-foreground">ETH</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pending Transactions</p>
              <p className="text-2xl font-bold">{pendingTxs}</p>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </div>
          </div>

          {/* Timelock Status */}
          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timelock Status</p>
              {nextUnlockTime ? (
                 <p className="text-sm font-semibold text-orange-500">Next unlock: {nextUnlockTime}</p>
              ) : (
                 <p className="text-sm font-semibold text-muted-foreground">No active locks</p>
              )}
            </div>
            <div className="text-right">
               <p className="text-xs text-muted-foreground">Configured Period</p>
               <p className="text-sm font-mono">{Number(multisig.config.timelockPeriod) / 3600} Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1">
            <Send className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
          <Button variant="outline" className="flex-1">
            View All Owners
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest activity from this multisig</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No transactions found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                 const percent = (Number(tx.confirmationCount) / multisig.owners.length) * 100;
                 return (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium">TX #{tx.id}</p>
                      <p className="text-xs text-muted-foreground truncate">To: {tx.to}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{ethers.formatEther(tx.value)} ETH</p>
                      <p className={`text-xs ${tx.executed ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {tx.executed ? 'Executed' : `Pending (${percent.toFixed(0)}%)`}
                      </p>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
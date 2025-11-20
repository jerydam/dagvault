'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MultiSig } from '@/hooks/use-factory'; // Ensure we use the shared type
import { Copy, Play, Pause, Wallet } from 'lucide-react';
import Link from 'next/link';

interface MultisigCardProps {
  multisig: MultiSig;
}

export function MultisigCard({ multisig }: MultisigCardProps) {
  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.preventDefault(); // Prevent link navigation
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="border-border bg-card hover:shadow-lg transition-shadow flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-2">
            {/* REAL NAME FROM CONTRACT */}
            <h3 className="font-bold text-lg truncate" title={multisig.name}>
              {multisig.name || 'Unnamed Treasury'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="truncate max-w-[100px]">
                {multisig.controller.slice(0, 6)}...{multisig.controller.slice(-4)}
              </span>
              <button
                onClick={(e) => handleCopy(e, multisig.controller)}
                className="hover:text-primary transition-colors p-1"
                title="Copy Controller Address"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <Badge variant={multisig.config.paused ? 'destructive' : 'outline'} className={multisig.config.paused ? '' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}>
            {multisig.config.paused ? 'Paused' : 'Active'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Wallet Balance */}
        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
           <div className="bg-background p-2 rounded-md">
              <Wallet className="h-4 w-4 text-primary" />
           </div>
           <div>
             <p className="text-xs text-muted-foreground">Wallet Balance</p>
             <p className="text-xl font-bold truncate" title={`${multisig.balance} ETH`}>
               {parseFloat(multisig.balance).toFixed(4)} <span className="text-xs font-normal text-muted-foreground">ETH</span>
             </p>
           </div>
        </div>

        {/* Owners & Requirements */}
        <div className="grid grid-cols-2 gap-3 py-2 border-t border-border mt-auto">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Owners</p>
            <p className="font-semibold">{multisig.owners.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Threshold</p>
            <p className="font-semibold">{multisig.config.requiredPercentage}%</p>
          </div>
        </div>

        {/* Owner Percentage Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
             <span>Distribution</span>
             <span>100%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex w-full">
            {multisig.owners.map((owner, idx) => (
              <div
                key={`${multisig.controller}-owner-${idx}`}
                style={{
                  width: `${owner.percentage}%`,
                  backgroundColor: [
                    '#3B82F6', // Blue
                    '#8B5CF6', // Purple
                    '#EC4899', // Pink
                    '#F59E0B', // Amber
                    '#10B981', // Emerald
                  ][idx % 5],
                }}
                className="h-full border-r border-background/20 last:border-0"
                title={`${owner.name}: ${owner.percentage}%`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 mt-2">
          <Link href={`/multisigs/${multisig.controller}`} className="flex-1">
            <Button size="sm" className="w-full font-semibold" variant="default">
              Manage Wallet
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
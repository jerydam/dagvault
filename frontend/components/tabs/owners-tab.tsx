'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultiSig } from '@/hooks/use-factory';
import { Plus, Trash2, User, ShieldCheck } from 'lucide-react';
import { SubmitTransactionModal } from '@/components/modals/submit-transaction-modal';

interface OwnersTabProps {
  multisig: MultiSig;
}

export function OwnersTab({ multisig }: OwnersTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPercentage = multisig.owners.reduce((acc, owner) => acc + Number(owner.percentage), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
         <Card className="bg-muted/30 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
               <div className="bg-primary/10 p-2 rounded-full"><User className="h-5 w-5 text-primary"/></div>
               <div>
                  <p className="text-2xl font-bold">{multisig.owners.length}</p>
                  <p className="text-xs text-muted-foreground">Active Owners</p>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-muted/30 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
               <div className="bg-primary/10 p-2 rounded-full"><ShieldCheck className="h-5 w-5 text-primary"/></div>
               <div>
                  <p className="text-2xl font-bold">{totalPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Total Equity Distributed</p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
             <CardTitle>Owner List</CardTitle>
             <CardDescription className="mt-1">Manage signers and their voting power</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {multisig.owners.map((owner, idx) => (
              <div
                key={`${owner.address}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border rounded-lg hover:border-primary/20 transition-colors gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                     {owner.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{owner.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px] sm:max-w-xs bg-muted/50 px-1 rounded">
                      {owner.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pl-13 sm:pl-0">
                  <div className="text-right">
                    <p className="font-bold text-lg">{owner.percentage}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Power</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {!owner.removable && (
                        <Badge variant="secondary" className="text-[10px] h-6 bg-muted text-muted-foreground hover:bg-muted">
                           Immutable
                        </Badge>
                     )}
                     {owner.removable && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          title="Remove Owner (Requires Proposal)"
                          onClick={() => alert("To remove this owner, please create a Custom Proposal with 'removeOwner' data.")}
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SubmitTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        controllerAddress={multisig.controller}
        defaultTab="owner"
      />
    </div>
  );
}
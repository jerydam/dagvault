'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultiSig } from '@/hooks/use-factory';
import { Plus, Trash2, User } from 'lucide-react';

interface OwnersTabProps {
  multisig: MultiSig;
}

export function OwnersTab({ multisig }: OwnersTabProps) {
  
  // Calculate total ownership percentage to display visually if needed
  const totalPercentage = multisig.owners.reduce((acc, owner) => acc + Number(owner.percentage), 0);

  const handleAddOwner = () => {
    // In a real app, this would open a Modal with inputs for Address, Name, %, Removable
    // Then call submitAddOwner(controllerAddress, ...)
    alert("To add an owner, you must submit a 'submitAddOwner' transaction via the Contract Interaction interface.");
  };

  return (
    <div className="space-y-6">
      {/* Current Owners */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Current Owners</CardTitle>
          <CardDescription>
             {multisig.owners.length} owners managing this multisig (Total Equity: {totalPercentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {multisig.owners.map((owner, idx) => (
              <div
                key={`${owner.address}-${idx}`}
                className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{owner.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px] md:max-w-md">
                      {owner.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-4">
                  <div className="text-right">
                    <p className="font-semibold text-sm">{owner.percentage}%</p>
                    <p className="text-[10px] text-muted-foreground">Voting Power</p>
                  </div>
                  
                  <div className="w-[100px] flex justify-end">
                     {!owner.removable ? (
                        <Badge variant="secondary" className="text-xs">
                           Immutable
                        </Badge>
                     ) : (
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
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

      {/* Add Owner */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Manage Owners</CardTitle>
          <CardDescription>Submit a proposal to add a new owner to the multisig.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleAddOwner}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Add Owner Proposal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2, AlertCircle, Clock, Users, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  submitChangeRequiredPct, 
  submitChangeTimelock, 
  submitChangeExpiry, 
  submitChangeMinOwners 
} from '@/lib/web3';

export type GovernanceType = 'percentage' | 'timelock' | 'expiry' | 'minOwners' | null;

interface GovernanceProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: GovernanceType;
  controllerAddress: string;
  currentValue?: string | number;
}

const TIME_UNITS = [
  { label: 'Minutes', value: 60 },
  { label: 'Hours', value: 3600 },
  { label: 'Days', value: 86400 },
];

export function GovernanceProposalModal({ 
  isOpen, 
  onClose, 
  type, 
  controllerAddress,
  currentValue 
}: GovernanceProposalModalProps) {
  const [value, setValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('3600'); // Default Hours
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError(null);
    }
  }, [isOpen, type]);

  if (!isOpen || !type) return null;

  const getTitle = () => {
    switch (type) {
      case 'percentage': return 'Change Approval Threshold';
      case 'timelock': return 'Change Timelock Period';
      case 'expiry': return 'Change Proposal Expiry';
      case 'minOwners': return 'Change Minimum Owners';
      default: return 'Governance Proposal';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'percentage': return 'Propose a new percentage of total voting power required to execute transactions.';
      case 'timelock': return 'Propose a new delay period between approval and execution.';
      case 'expiry': return 'Propose the duration a transaction remains valid before expiring.';
      case 'minOwners': return 'Propose the absolute minimum number of signatures required.';
      default: return '';
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsPending(true);

    try {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) throw new Error("Invalid number");

      if (type === 'percentage') {
        if (numValue > 100) throw new Error("Percentage cannot exceed 100");
        await submitChangeRequiredPct(controllerAddress, numValue);
      } 
      else if (type === 'minOwners') {
        if (numValue < 1) throw new Error("Minimum owners must be at least 1");
        await submitChangeMinOwners(controllerAddress, numValue);
      } 
      else if (type === 'timelock') {
        const totalSeconds = numValue * Number(timeUnit);
        await submitChangeTimelock(controllerAddress, totalSeconds);
      } 
      else if (type === 'expiry') {
        const totalSeconds = numValue * Number(timeUnit);
        await submitChangeExpiry(controllerAddress, totalSeconds);
      }

      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Transaction failed');
    } finally {
      setIsPending(false);
    }
  };

  const isTimeBased = type === 'timelock' || type === 'expiry';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-border bg-card shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
          <h2 className="text-lg font-bold">{getTitle()}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="bg-primary/5 p-3 rounded border border-primary/10">
             <p className="text-sm text-primary/80">{getDescription()}</p>
          </div>
          
          {currentValue !== undefined && (
             <div className="flex justify-between items-center text-sm px-1">
                <span className="text-muted-foreground">Current Setting:</span>
                <span className="font-mono font-bold">{currentValue}</span>
             </div>
          )}

          <div className="space-y-3">
            <Label>New Value</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input 
                  type="number" 
                  placeholder="Enter value..." 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)}
                  className={type === 'percentage' ? 'pr-8' : ''}
                />
                {type === 'percentage' && <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />}
                {type === 'minOwners' && <Users className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />}
                {isTimeBased && <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />}
              </div>

              {isTimeBased && (
                <Select value={timeUnit} onValueChange={setTimeUnit}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value.toString()}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isPending || !value}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Submit Proposal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
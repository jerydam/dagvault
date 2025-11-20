'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSig } from '@/hooks/use-factory';
import { ChevronRight, Loader2, PauseCircle, PlayCircle, Settings, ShieldAlert, Clock } from 'lucide-react';
import { pauseMultisig, unpauseMultisig } from '@/lib/web3';
import { GovernanceProposalModal, GovernanceType } from '@/components/modals/governance-proposal-modal';

interface SettingsTabProps {
  multisig: MultiSig;
}

export function SettingsTab({ multisig }: SettingsTabProps) {
  const [isPausePending, setIsPausePending] = useState(false);
  const [modalType, setModalType] = useState<GovernanceType>(null);
  const [modalCurrentValue, setModalCurrentValue] = useState<string | number>('');

  const formatDuration = (seconds: number) => {
    const hours = seconds / 3600;
    if (hours >= 24) return `${(hours / 24).toFixed(1)} Days`;
    return `${hours.toFixed(1)} Hours`;
  };

  const handlePauseToggle = async () => {
    setIsPausePending(true);
    try {
      if (multisig.config.paused) {
        await unpauseMultisig(multisig.controller);
      } else {
        await pauseMultisig(multisig.controller);
      }
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.message || 'Failed to toggle pause state'));
    } finally {
      setIsPausePending(false);
    }
  };

  const openModal = (type: GovernanceType, currentVal: string | number) => {
    setModalType(type);
    setModalCurrentValue(currentVal);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Governance Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/> Governance Parameters</CardTitle>
           <CardDescription>Configure how this multisig operates. Changes require a proposal.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/50">
           {/* Percentage */}
           <div className="flex items-center justify-between py-4 first:pt-0">
              <div>
                 <p className="font-medium text-sm">Required Approval</p>
                 <p className="text-xs text-muted-foreground">Percentage of total voting power needed.</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="font-mono font-bold">{multisig.config.requiredPercentage}%</span>
                 <Button variant="outline" size="sm" onClick={() => openModal('percentage', multisig.config.requiredPercentage)}>Change</Button>
              </div>
           </div>

           {/* Timelock */}
           <div className="flex items-center justify-between py-4">
              <div>
                 <p className="font-medium text-sm">Timelock Period</p>
                 <p className="text-xs text-muted-foreground">Delay between approval and execution.</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="font-mono font-bold">{formatDuration(multisig.config.timelockPeriod)}</span>
                 <Button variant="outline" size="sm" onClick={() => openModal('timelock', formatDuration(multisig.config.timelockPeriod))}>Change</Button>
              </div>
           </div>

           {/* Expiry */}
           <div className="flex items-center justify-between py-4">
              <div>
                 <p className="font-medium text-sm">Proposal Expiry</p>
                 <p className="text-xs text-muted-foreground">How long a proposal remains valid.</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="font-mono font-bold">{formatDuration(multisig.config.expiryPeriod)}</span>
                 <Button variant="outline" size="sm" onClick={() => openModal('expiry', formatDuration(multisig.config.expiryPeriod))}>Change</Button>
              </div>
           </div>

           {/* Min Owners */}
           <div className="flex items-center justify-between py-4 last:pb-0">
              <div>
                 <p className="font-medium text-sm">Minimum Signers</p>
                 <p className="text-xs text-muted-foreground">Absolute minimum number of owners required.</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="font-mono font-bold">{multisig.config.minOwners}</span>
                 <Button variant="outline" size="sm" onClick={() => openModal('minOwners', multisig.config.minOwners)}>Change</Button>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Emergency Zone */}
      <Card className={`border-2 ${multisig.config.paused ? 'border-emerald-500 bg-emerald-500/5' : 'border-destructive/50 bg-destructive/5'}`}>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldAlert className={`h-5 w-5 ${multisig.config.paused ? 'text-emerald-600' : 'text-destructive'}`} /> 
              Emergency Controls
           </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between">
              <div>
                 <p className="font-medium text-sm">Contract Status: <span className="uppercase font-bold">{multisig.config.paused ? 'Paused' : 'Active'}</span></p>
                 <p className="text-xs text-muted-foreground max-w-md mt-1">
                    {multisig.config.paused 
                      ? 'Contract is currently paused. Owners can unpause to resume operations.' 
                      : 'Pausing the contract prevents any new transactions from being executed. Use in emergencies.'}
                 </p>
              </div>
              <Button 
                 variant={multisig.config.paused ? 'default' : 'destructive'} 
                 onClick={handlePauseToggle}
                 disabled={isPausePending}
              >
                 {isPausePending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                       {multisig.config.paused ? <PlayCircle className="h-4 w-4 mr-2"/> : <PauseCircle className="h-4 w-4 mr-2"/>}
                       {multisig.config.paused ? 'Unpause Contract' : 'Pause Contract'}
                    </>
                 )}
              </Button>
           </div>
        </CardContent>
      </Card>

      <GovernanceProposalModal 
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        type={modalType}
        controllerAddress={multisig.controller}
        currentValue={modalCurrentValue}
      />
    </div>
  );
}
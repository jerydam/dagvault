'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSig } from '@/hooks/use-factory';
import { ChevronRight, Loader2, PauseCircle, PlayCircle } from 'lucide-react';
import { pauseMultisig, unpauseMultisig } from '@/lib/web3';

interface SettingsTabProps {
  multisig: MultiSig;
}

export function SettingsTab({ multisig }: SettingsTabProps) {
  const [isPending, setIsPending] = useState(false);

  // Helper to format seconds to readable duration
  const formatDuration = (seconds: number) => {
    const hours = seconds / 3600;
    if (hours >= 24) return `${(hours / 24).toFixed(1)} Days`;
    return `${hours.toFixed(1)} Hours`;
  };

  const handlePauseToggle = async () => {
    setIsPending(true);
    try {
      if (multisig.config.paused) {
        await unpauseMultisig(multisig.controller);
      } else {
        await pauseMultisig(multisig.controller);
      }
      // In a real app, trigger a refetch here
      alert(`Transaction submitted to ${multisig.config.paused ? 'unpause' : 'pause'} contract.`);
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.message || 'Failed to toggle pause state'));
    } finally {
      setIsPending(false);
    }
  };

  const settingsList = [
    {
      label: 'Required Approval Percentage',
      value: `${multisig.config.requiredPercentage}%`,
      action: 'Change',
      handler: () => alert("Please use the 'Submit Transaction' form with 'submitChangeRequiredPct'")
    },
    {
      label: 'Timelock Period',
      value: formatDuration(multisig.config.timelockPeriod),
      action: 'Change',
      handler: () => alert("Please use the 'Submit Transaction' form with 'submitChangeTimelock'")
    },
    {
      label: 'Expiry Period',
      value: formatDuration(multisig.config.expiryPeriod),
      action: 'Change',
      handler: () => alert("Please use the 'Submit Transaction' form with 'submitChangeExpiry'")
    },
    {
      label: 'Minimum Owners',
      value: multisig.config.minOwners.toString(),
      action: 'Change',
      handler: () => alert("Please use the 'Submit Transaction' form with 'submitChangeMinOwners'")
    },
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Cards */}
      <div className="space-y-3">
        {settingsList.map((setting, idx) => (
          <Card key={idx} className="border-border bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{setting.label}</p>
                <p className="font-semibold text-lg">{setting.value}</p>
              </div>
              <Button variant="outline" size="sm" onClick={setting.handler}>
                {setting.action}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="border-t border-border pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Actions that affect the entire multisig controller
          </p>
        </div>

        <Card className={`${multisig.config.paused ? 'border-emerald-500 bg-emerald-500/10' : 'border-destructive bg-destructive/10'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {multisig.config.paused ? 'Unpause Contract' : 'Pause Contract'}
              </p>
              <p className="text-sm text-muted-foreground">
                {multisig.config.paused 
                  ? 'Resume normal operations and allow transactions.' 
                  : 'Prevent all transactions (emergency only).'}
              </p>
            </div>
            <Button 
               variant={multisig.config.paused ? 'default' : 'destructive'} 
               size="sm"
               onClick={handlePauseToggle}
               disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {multisig.config.paused ? <PlayCircle className="h-4 w-4 mr-2"/> : <PauseCircle className="h-4 w-4 mr-2"/>}
                  {multisig.config.paused ? 'Unpause' : 'Pause'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
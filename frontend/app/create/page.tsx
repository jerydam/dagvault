'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { createMultiSig, initializeProvider, MULTISIG_FACTORY_ADDRESS } from '@/lib/web3';

interface Owner {
  address: string;
  name: string;
  percentage: number;
  removable: boolean;
}

// Helper for time calculation
const TIME_UNITS = [
  { label: 'Minutes', value: 60 },
  { label: 'Hours', value: 3600 },
  { label: 'Days', value: 86400 },
  { label: 'Weeks', value: 604800 },
];

export default function CreateMultisigPage() {
  const [step, setStep] = useState(1);
  const [userAddress, setUserAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // New State: Multisig Name (Required by new ABI)
  const [multisigName, setMultisigName] = useState('');

  const [owners, setOwners] = useState<Owner[]>([
    { address: '', name: '', percentage: 60, removable: false },
    { address: '', name: '', percentage: 40, removable: true },
  ]);

  const [requiredPercentage, setRequiredPercentage] = useState(66);
  const [minOwners, setMinOwners] = useState(2);

  // Configurable Time States
  const [timelockVal, setTimelockVal] = useState(24);
  const [timelockUnit, setTimelockUnit] = useState(3600); // Default Hours

  const [expiryVal, setExpiryVal] = useState(7);
  const [expiryUnit, setExpiryUnit] = useState(86400); // Default Days

  // Initialize provider and get user address (just for validation)
  useEffect(() => {
    const init = async () => {
      try {
        setIsConnecting(true);
        const { signer } = await initializeProvider();
        const address = await signer.getAddress();
        setUserAddress(address);
        // Note: We no longer auto-add the user to the owners list
      } catch (err: any) {
        setError(err.message || 'Failed to connect wallet');
      } finally {
        setIsConnecting(false);
      }
    };

    init();
  }, []);

  const totalPercentage = owners.reduce((sum, o) => sum + o.percentage, 0);

  const ownersWithValidFields = owners.filter(
    (o) =>
      o.address &&
      o.address.startsWith('0x') &&
      o.address.length === 42 &&
      o.name.trim() !== ''
  );

  // Validation: Creator cannot be owner
  const isCreatorInOwners = owners.some(o => o.address.toLowerCase() === userAddress.toLowerCase());

  const isStep1Valid =
    multisigName.trim().length > 0 &&
    owners.length >= 2 &&
    ownersWithValidFields.length === owners.length &&
    totalPercentage <= 100 &&
    totalPercentage > 0 &&
    !isCreatorInOwners; // Enforce restriction

  const addOwner = () => {
    const remaining = 100 - totalPercentage;
    const defaultPct = remaining >= 10 ? 10 : remaining > 0 ? remaining : 0;
    setOwners([...owners, { address: '', name: '', percentage: defaultPct, removable: true }]);
  };

  const removeOwner = (index: number) => {
    if (owners.length <= 2) return;
    setOwners(owners.filter((_, i) => i !== index));
  };

  const updateOwner = (index: number, field: keyof Owner, value: any) => {
    const updated = [...owners];
    if (field === 'percentage') {
      let num = Number(value) || 0;
      num = Math.min(100, Math.max(0, num));
      const othersTotal = totalPercentage - owners[index].percentage;
      if (othersTotal + num > 100) {
        num = 100 - othersTotal;
      }
      updated[index].percentage = num;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOwners(updated);
  };

  const deployMultisig = async () => {
    if (!isStep1Valid) return;

    setError(null);
    setIsPending(true);

    // Calculate total seconds
    const finalTimelock = timelockVal * timelockUnit;
    const finalExpiry = expiryVal * expiryUnit;

    try {
      const receipt = await createMultiSig(
        MULTISIG_FACTORY_ADDRESS,
        multisigName, // New ABI Argument
        owners.map((o) => o.address),
        owners.map((o) => o.name),
        owners.map((o) => o.percentage),
        owners.map((o) => o.removable),
        requiredPercentage,
        finalTimelock,
        finalExpiry,
        minOwners
      );

      setTxHash(receipt.hash);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to deploy multisig');
    } finally {
      setIsPending(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Connecting wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Create Company Multisig</h1>
          <p className="text-muted-foreground">Weighted voting • Custom Governance • Secure</p>
        </div>

        <div className="mb-10">
          <div className="flex justify-between text-sm mb-3">
            <span className={step >= 1 ? 'text-primary font-medium' : ''}>1. Structure</span>
            <span className={step >= 2 ? 'text-primary font-medium' : ''}>2. Governance</span>
            <span className={step >= 3 ? 'text-primary font-medium' : ''}>3. Deploy</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        {error && (
          <Card className="border-red-500/30 bg-red-500/5 mb-6">
            <CardContent className="py-4">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Details & Owners</CardTitle>
              <CardDescription>
                Define the name and equity distribution. 
                <span className="text-orange-500 block mt-1">Note: As the creator ({userAddress.slice(0,6)}...), you cannot be an owner.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Multisig Name Input */}
              <div className="p-4 border rounded-xl bg-muted/10">
                 <Label className="mb-2 block text-base">Company / Multisig Name</Label>
                 <Input 
                    placeholder="e.g. ACME Corp Treasury" 
                    value={multisigName}
                    onChange={(e) => setMultisigName(e.target.value)}
                    className="text-lg h-12"
                 />
              </div>

              <div className="space-y-4">
                <Label>Owners List</Label>
                {owners.map((owner, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-muted/20 relative">
                     {/* Creator Check Warning inside card */}
                     {owner.address.toLowerCase() === userAddress.toLowerCase() && owner.address !== '' && (
                        <div className="absolute -top-3 right-4 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full border border-red-200 flex items-center">
                           <AlertCircle className="w-3 h-3 mr-1"/> Creator cannot be owner
                        </div>
                     )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <Label className="text-xs text-muted-foreground mb-1 block">Wallet Address</Label>
                        <Input
                          placeholder="0x..."
                          value={owner.address}
                          onChange={(e) => updateOwner(idx, 'address', e.target.value)}
                          className={`${
                             owner.address.toLowerCase() === userAddress.toLowerCase() 
                             ? 'border-red-500 focus-visible:ring-red-500' 
                             : !owner.address.startsWith('0x') && owner.address.length > 0 
                                ? 'border-orange-500' 
                                : ''
                          }`}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label className="text-xs text-muted-foreground mb-1 block">Role / Name</Label>
                        <Input
                          placeholder="Name"
                          value={owner.name}
                          onChange={(e) => updateOwner(idx, 'name', e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                         <Label className="text-xs text-muted-foreground mb-1 block">Power (%)</Label>
                         <div className="relative">
                          <Input
                            type="number"
                            value={owner.percentage}
                            onChange={(e) => updateOwner(idx, 'percentage', e.target.value)}
                            className="pr-8"
                          />
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>

                      <div className="md:col-span-2 flex flex-col justify-end gap-2">
                        <div className="flex items-center gap-2 h-10">
                          <Checkbox
                            checked={owner.removable}
                            onCheckedChange={(c) => updateOwner(idx, 'removable', !!c)}
                            id={`removable-${idx}`}
                          />
                          <Label htmlFor={`removable-${idx}`} className="text-xs cursor-pointer">Removable</Label>
                        </div>
                      </div>
                    </div>
                    {owners.length > 2 && (
                        <Button 
                           size="icon" 
                           variant="ghost" 
                           onClick={() => removeOwner(idx)} 
                           className="absolute -right-2 -top-2 h-6 w-6 bg-background border shadow-sm rounded-full text-destructive hover:bg-destructive hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                  </div>
                ))}
              </div>

              <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-xl text-center">
                <p className="text-lg font-semibold mb-2">Total Equity Allocation</p>
                <p className={`text-4xl font-bold tabular-nums ${totalPercentage > 100 ? 'text-red-600' : 'text-primary'}`}>
                  {totalPercentage}%
                </p>
              </div>

              {totalPercentage <= 100 && (
                <Button onClick={addOwner} variant="outline" className="w-full" disabled={totalPercentage >= 100}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Owner {totalPercentage >= 100 && '(limit reached)'}
                </Button>
              )}

              {(!isStep1Valid && owners.length >= 2) && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                  <div className="text-sm">
                    {!multisigName && <p>• Company name is required</p>}
                    {isCreatorInOwners && <p className="text-red-600 font-medium">• You (the creator) cannot be in the owner list</p>}
                    {totalPercentage > 100 && <p>• Total allocation cannot exceed 100%</p>}
                    {ownersWithValidFields.length !== owners.length && <p>• Please fill all addresses and names correctly</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Governance Rules</CardTitle>
              <CardDescription>Set the timing and approval thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Required Percentage */}
              <div className="text-center py-6 border-b">
                <p className="text-sm text-muted-foreground mb-2">Approval Threshold</p>
                <p className="text-6xl font-bold text-primary">{requiredPercentage}%</p>
                <p className="text-xs text-muted-foreground mt-2">of total voting power required to pass a proposal</p>
                <Slider
                  value={[requiredPercentage]}
                  onValueChange={([v]) => setRequiredPercentage(v)}
                  min={1}
                  max={100}
                  step={1}
                  className="max-w-md mx-auto mt-6"
                />
              </div>

              {/* Custom Time Configurations */}
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Timelock */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                     <Clock className="w-4 h-4"/> Timelock Period
                  </Label>
                  <div className="text-xs text-muted-foreground">
                     Time between approval and execution.
                  </div>
                  <div className="flex gap-2">
                     <Input 
                        type="number" 
                        min="0"
                        value={timelockVal}
                        onChange={(e) => setTimelockVal(Math.max(0, Number(e.target.value)))}
                        className="w-24 text-center"
                     />
                     <Select 
                        value={timelockUnit.toString()} 
                        onValueChange={(v) => setTimelockUnit(Number(v))}
                     >
                        <SelectTrigger className="flex-1">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {TIME_UNITS.map((u) => (
                              <SelectItem key={u.label} value={u.value.toString()}>{u.label}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <p className="text-xs text-right text-muted-foreground">
                     Total: {(timelockVal * timelockUnit) / 60} mins
                  </p>
                </div>

                {/* Expiry */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                     <AlertCircle className="w-4 h-4"/> Expiry Period
                  </Label>
                  <div className="text-xs text-muted-foreground">
                     Time before a pending proposal expires.
                  </div>
                  <div className="flex gap-2">
                     <Input 
                        type="number" 
                        min="1"
                        value={expiryVal}
                        onChange={(e) => setExpiryVal(Math.max(1, Number(e.target.value)))}
                        className="w-24 text-center"
                     />
                     <Select 
                        value={expiryUnit.toString()} 
                        onValueChange={(v) => setExpiryUnit(Number(v))}
                     >
                        <SelectTrigger className="flex-1">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {TIME_UNITS.map((u) => (
                              <SelectItem key={u.label} value={u.value.toString()}>{u.label}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                   <p className="text-xs text-right text-muted-foreground">
                     Total: {(expiryVal * expiryUnit) / 3600} hours
                  </p>
                </div>

              </div>

              {/* Min Owners */}
              <div className="pt-4 border-t">
                  <Label>Minimum Owners Required</Label>
                  <div className="flex items-center gap-4 mt-2">
                     <Input
                     type="number"
                     value={minOwners}
                     onChange={(e) => setMinOwners(Math.max(1, Number(e.target.value) || 1))}
                     min="1"
                     max={owners.length}
                     className="w-24"
                     />
                     <span className="text-sm text-muted-foreground">
                        Must confirm regardless of percentage.
                     </span>
                  </div>
                </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Deploy</CardTitle>
              <CardDescription>Review your configuration before creating the contract.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {isSuccess ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold">Multisig Created!</h2>
                  <p className="text-xl mt-2">{multisigName}</p>
                  <p className="text-muted-foreground mt-4 bg-muted p-3 rounded-md font-mono text-sm break-all">
                    Tx: {txHash}
                  </p>
                  <Button className="mt-6" onClick={() => window.location.reload()}>
                     Create Another
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Structure</h3>
                        <div>
                           <span className="text-sm text-muted-foreground">Name:</span>
                           <p className="font-medium">{multisigName}</p>
                        </div>
                        <div>
                           <span className="text-sm text-muted-foreground">Owners:</span>
                           <p className="font-medium">{owners.length} owners</p>
                        </div>
                        <div>
                           <span className="text-sm text-muted-foreground">Total Equity:</span>
                           <p className="font-medium">{totalPercentage}%</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Governance</h3>
                        <div>
                           <span className="text-sm text-muted-foreground">Threshold:</span>
                           <p className="font-medium">{requiredPercentage}%</p>
                        </div>
                        <div>
                           <span className="text-sm text-muted-foreground">Timelock:</span>
                           <p className="font-medium">{timelockVal} {TIME_UNITS.find(u => u.value === timelockUnit)?.label}</p>
                        </div>
                        <div>
                           <span className="text-sm text-muted-foreground">Expiry:</span>
                           <p className="font-medium">{expiryVal} {TIME_UNITS.find(u => u.value === expiryUnit)?.label}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                     <h4 className="text-sm font-semibold mb-3">Owner Distribution</h4>
                     {owners.map((o, i) => (
                        <div key={i} className="flex justify-between text-sm mb-1 last:mb-0">
                           <span>{o.name} <span className="text-muted-foreground text-xs">({o.address.slice(0,6)}...)</span></span>
                           <span className="font-mono">{o.percentage}%</span>
                        </div>
                     ))}
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 text-lg"
                    onClick={deployMultisig}
                    disabled={isPending || !isStep1Valid}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deploying Contract...
                      </>
                    ) : (
                      'Deploy Multisig Wallet'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!isSuccess && (
           <div className="flex gap-4 mt-12">
            <Button
               variant="outline"
               onClick={() => setStep(Math.max(1, step - 1))}
               disabled={step === 1}
               className="flex-1"
            >
               <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            {step < 3 && (
               <Button
               onClick={() => setStep(step + 1)}
               disabled={step === 1 && !isStep1Valid}
               className="flex-1"
               >
               Continue <ChevronRight className="h-4 w-4 ml-2" />
               </Button>
            )}
           </div>
        )}
      </div>
    </div>
  );
}
// Contract and app data types
export interface Owner {
  address: string;
  name: string;
  percentage: number;
  removable: boolean;
}

export interface Transaction {
  id: number;
  initiator: string;
  to: string;
  value: string;
  isTokenTransfer: boolean;
  tokenAddress?: string;
  data: string;
  executed: boolean;
  confirmationCount: number;
  timestamp: number;
  timelockEnd: number;
  confirmations: string[];
}

export interface MultisigConfig {
  requiredPercentage: number;
  timelockPeriod: number;
  expiryPeriod: number;
  minOwners: number;
  paused: boolean;
}

export interface MultiSig {
  controller: string;
  wallet: string;
  owners: Owner[];
  config: MultisigConfig;
  balance: string;
  deployed: number;
}

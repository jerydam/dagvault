import { ethers, BrowserProvider, Contract } from 'ethers';
import {
  MULTISIG_CONTROLLER_ABI,
  COMPANY_WALLET_ABI,
  MULTISIG_FACTORY_ABI,
} from '@/lib/abi';

// Initialize provider and signer
let provider: BrowserProvider;
let signer: ethers.Signer;





export async function initializeProvider() {
  if (typeof window === 'undefined') return;
  
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  provider = new BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  return { provider, signer };
}

export const MULTISIG_FACTORY_ADDRESS = '0xc645B1C83A122672477fa9921Ef74d62e6035eb7' as const;

export function getProvider() {
  if (!provider) throw new Error('Provider not initialized');
  return provider;
}

export function getSigner() {
  if (!signer) throw new Error('Signer not initialized');
  return signer;
}



const getSignedContract = async (contractAddress: string) => {
  if (!window.ethereum) throw new Error("No crypto wallet found");
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  // CRITICAL FIX: Must use a signer to send transactions
  const signer = await provider.getSigner();
  
  return new ethers.Contract(contractAddress, MULTISIG_CONTROLLER_ABI, signer);
};

/**
 * 1. Submit Single Transaction
 */
export const submitTransaction = async (
  controllerAddress: string,
  to: string,
  value: string, // "1.5" ETH
  isToken: boolean,
  tokenAddress: string,
  data: string
) => {
  try {
    const contract = await getSignedContract(controllerAddress);
    
    // Convert string "1.5" to Wei BigInt
    const valueWei = ethers.parseEther(value || '0');
    
    // Ensure data is formatted correctly
    const hexData = data.startsWith('0x') ? data : `0x${data}`;
    const targetToken = ethers.isAddress(tokenAddress) ? tokenAddress : ethers.ZeroAddress;

    const tx = await contract.submitTransaction(
      to,
      valueWei,
      isToken,
      targetToken,
      hexData
    );

    return await tx.wait();
  } catch (error) {
    console.error("submitTransaction Error:", error);
    throw error;
  }
};

/**
 * 2. Submit Batch Transfer (Equal Amounts)
 */
export const submitBatchTransferEqual = async (
  controllerAddress: string,
  token: string,
  recipients: string[],
  amountPer: string // "1.5"
) => {
  try {
    const contract = await getSignedContract(controllerAddress);

    const amountWei = ethers.parseEther(amountPer || '0');
    const targetToken = ethers.isAddress(token) ? token : ethers.ZeroAddress;

    const tx = await contract.submitBatchTransferEqual(
      targetToken,
      recipients,
      amountWei
    );

    return await tx.wait();
  } catch (error) {
    console.error("submitBatchTransferEqual Error:", error);
    throw error;
  }
};

/**
 * 3. Submit Batch Transfer (Different Amounts)
 */
export const submitBatchTransferDifferent = async (
  controllerAddress: string,
  token: string,
  recipients: string[],
  amounts: string[] // ["1.5", "2.0"]
) => {
  try {
    const contract = await getSignedContract(controllerAddress);

    // Convert array of strings to array of BigInts
    const amountsWei = amounts.map((amt) => ethers.parseEther(amt || '0'));
    const targetToken = ethers.isAddress(token) ? token : ethers.ZeroAddress;

    const tx = await contract.submitBatchTransferDifferent(
      targetToken,
      recipients,
      amountsWei
    );

    return await tx.wait();
  } catch (error) {
    console.error("submitBatchTransferDifferent Error:", error);
    throw error;
  }
};

/**
 * 4. Submit Add Owner
 */
export const submitAddOwner = async (
  controllerAddress: string,
  newOwner: string,
  ownerName: string,
  pct: number,
  removable: boolean
) => {
  try {
    const contract = await getSignedContract(controllerAddress);
    
    // Ensure percentage is BigInt (assuming contract uses basis points or integer percentage)
    // If your contract expects 20% as "20", pass 20. 
    // If it expects basis points (2000 for 20%), adjust accordingly. 
    // Based on your ABI type "uint256", simple casting is safe here.
    const pctBigInt = BigInt(pct); 

    const tx = await contract.submitAddOwner(
      newOwner,
      ownerName,
      pctBigInt,
      removable
    );

    return await tx.wait();
  } catch (error) {
    console.error("submitAddOwner Error:", error);
    throw error;
  }
};




export async function getConnectedWalletAddress(controllerAddress: string) {
  try {
    const controller = new Contract(
      controllerAddress,
      MULTISIG_CONTROLLER_ABI,
      getProvider()
    );
    const walletAddress = await controller.companyWallet();
    return walletAddress;
  } catch (err) {
    console.error(`Error fetching wallet for controller ${controllerAddress}:`, err);
    return controllerAddress; 
  }
}

export async function getWalletBalance(walletAddress: string) {
  try {
    const wallet = new Contract(walletAddress, COMPANY_WALLET_ABI, getProvider());
    const balance = await wallet.getBalance();
    return ethers.formatEther(balance);
  } catch (err) {
    const provider = getProvider();
    const balance = await provider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  }
}

// ============================================================================
// MULTISIG FACTORY FUNCTIONS
// ============================================================================

export async function createMultiSig(
  factoryAddress: string,
  name: string, // <--- NEW PARAMETER
  initialOwners: string[],
  initialNames: string[],
  initialPercentages: number[],
  initialRemovable: boolean[],
  requiredPercentage: number,
  timelockPeriod: number,
  expiryPeriod: number,
  minOwners: number
) {
  const factory = new Contract(
    factoryAddress,
    MULTISIG_FACTORY_ABI,
    signer
  );

  const tx = await factory.createMultiSig(
    name, // Passed as first argument
    initialOwners,
    initialNames,
    initialPercentages,
    initialRemovable,
    requiredPercentage,
    timelockPeriod,
    expiryPeriod,
    minOwners
  );

  const receipt = await tx.wait();
  return receipt;
}

export async function getAllControllers(factoryAddress: string) {
  try {
    if (!factoryAddress || factoryAddress.length !== 42) return [];
    const factory = new Contract(factoryAddress, MULTISIG_FACTORY_ABI, provider);
    const controllers = await factory.getAllControllers();
    return controllers || [];
  } catch (err) {
    console.warn('Error fetching controllers:', err);
    return [];
  }
}

export async function getDeploymentCount(factoryAddress: string) {
  const factory = new Contract(factoryAddress, MULTISIG_FACTORY_ABI, provider);
  const { controllers, wallets } = await factory.getDeploymentCount();
  return { controllers, wallets };
}

// NEW: Helper to get name and wallet address in one call from Factory
export async function getMultiSigInfo(factoryAddress: string, controllerAddress: string) {
  const factory = new Contract(factoryAddress, MULTISIG_FACTORY_ABI, provider);
  const info = await factory.getMultiSigInfo(controllerAddress);
  return {
    name: info.name,
    wallet: info.wallet,
    exists: info.exists
  };
}

// ============================================================================
// MULTISIG CONTROLLER FUNCTIONS (CORE)
// ============================================================================


export async function confirmTransaction(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.confirmTransaction(transactionId);
  return await tx.wait();
}

export async function executeTransactionManual(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.executeTransactionManual(transactionId);
  return await tx.wait();
}

export async function revokeConfirmation(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.revokeConfirmation(transactionId);
  return await tx.wait();
}

// ============================================================================
// MULTISIG GOVERNANCE FUNCTIONS (NEW)
// ============================================================================



export async function submitChangeName(controllerAddress: string, newName: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeName(newName);
  return await tx.wait();
}

export async function submitChangeRequiredPct(controllerAddress: string, newPercentage: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeRequiredPct(newPercentage);
  return await tx.wait();
}

export async function submitChangeTimelock(controllerAddress: string, newPeriod: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeTimelock(newPeriod);
  return await tx.wait();
}

export async function submitChangeExpiry(controllerAddress: string, newPeriod: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeExpiry(newPeriod);
  return await tx.wait();
}

export async function submitChangeMinOwners(controllerAddress: string, newMinOwners: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeMinOwners(newMinOwners);
  return await tx.wait();
}

export async function pauseMultisig(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.pause();
  return await tx.wait();
}

export async function unpauseMultisig(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.unpause();
  return await tx.wait();
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

export async function getTransaction(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  const transaction = await controller.transactions(transactionId); // Accessed via public mapping

  return {
    initiator: transaction.initiator,
    to: transaction.to,
    value: ethers.formatEther(transaction.value),
    data: transaction.data,
    isTokenTransfer: transaction.isTokenTransfer,
    tokenAddress: transaction.tokenAddress,
    executed: transaction.executed,
    confirmationCount: transaction.confirmationCount.toString(),
    timestamp: transaction.timestamp.toString(),
    timelockEnd: transaction.timelockEnd.toString(),
  };
}

export async function getMultisigOwners(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  const { addrs, ownerName, percentages, removable } = await controller.getOwners();

  return {
    addresses: addrs,
    names: ownerName,
    percentages: percentages.map((p: any) => p.toString()),
    removables: removable,
  };
}

export async function getMultisigConfig(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  
  const [requiredPercentage, paused, name, timelock, expiry, minOwners] = await Promise.all([
    controller.requiredPercentage(),
    controller.paused(),
    controller.name(),
    controller.timelockPeriod(),
    controller.expiryPeriod(),
    controller.minOwners()
  ]);

  return {
    requiredPercentage: Number(requiredPercentage),
    paused,
    name,
    timelockPeriod: Number(timelock),
    expiryPeriod: Number(expiry),
    minOwners: Number(minOwners)
  };
}

export async function isMultisigPaused(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  return await controller.paused();
}

// ============================================================================
// COMPANY WALLET FUNCTIONS
// ============================================================================

export async function executeWalletTransaction(
  walletAddress: string,
  to: string,
  value: string,
  isTokenTransfer: boolean,
  tokenAddress: string,
  data: string = '0x'
) {
  const wallet = new Contract(walletAddress, COMPANY_WALLET_ABI, signer);
  const tx = await wallet.executeTransaction(
    to,
    ethers.parseEther(value),
    isTokenTransfer,
    tokenAddress,
    data
  );
  return await tx.wait();
}
export async function confirmTransactionsBatch(
  controllerAddress: string,
  transactionIds: number[]
) {
  const controller = new Contract(
    controllerAddress,
    MULTISIG_CONTROLLER_ABI,
    getSigner()
  );

  // WARNING: This requires your Smart Contract to have a confirmTransactionsBatch function.
  // If your contract does not support batching, this line will fail at runtime.
  const tx = await controller.confirmTransactionsBatch(transactionIds);
  return await tx.wait();
}
export async function getTokenBalance(walletAddress: string, tokenAddress: string) {
  const wallet = new Contract(walletAddress, COMPANY_WALLET_ABI, provider);
  const balance = await wallet.getTokenBalance(tokenAddress);
  return balance.toString();
}
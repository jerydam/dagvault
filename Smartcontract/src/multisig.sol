// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IWallet.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MultiSigWalletController is ReentrancyGuard {
    // ============ STRUCTS ============
    struct Owner {
        string name;
        uint256 percentage;   // 1 - 100
        bool exists;
        bool removable;
    }

    struct OwnerConfig {
        address[] owners;
        string[] names;
        uint256[] percentages;
        bool[] removable;
    }

    struct TransactionRecord {
        address initiator;
        address to;
        uint256 value;
        bytes data;
        bool isTokenTransfer;
        address tokenAddress;
        bool executed;
        mapping(address => bool) confirmations;
        uint256 confirmationCount;
        uint256 timestamp;
        uint256 timelockEnd;
    }

    // ============ STATE ============
    address constant ETH_ADDRESS = address(0);

    mapping(address => Owner) public owners;
    address[] public ownerList;
    uint256 public totalPercentage;

    uint256 public requiredPercentage;
    uint256 public timelockPeriod;
    uint256 public expiryPeriod;
    uint256 public minOwners;

    address public immutable deployer;
    ICompanyWallet public immutable companyWallet;

    bool public paused;
    TransactionRecord[] public transactions;

    // ============ EVENTS ============
    event OwnerAdded(address indexed owner, string name, uint256 percentage);
    event OwnerRemoved(address indexed owner, uint256 returnedPercentage);
    event OwnerPercentageChanged(address indexed owner, uint256 oldPct, uint256 newPct);
    event RequiredPercentageChanged(uint256 oldVal, uint256 newVal);
    event TimelockPeriodChanged(uint256 oldVal, uint256 newVal);
    event ExpiryPeriodChanged(uint256 oldVal, uint256 newVal);
    event MinOwnersChanged(uint256 oldVal, uint256 newVal);
    event TransactionSubmitted(uint256 indexed txId, address initiator, address to, uint256 value, bool isToken);
    event TransactionConfirmed(uint256 indexed txId, address owner, uint256 percentage);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionRevoked(uint256 indexed txId, address owner);
    event BatchTransferExecuted(uint256 indexed txId, uint256 successful, uint256 totalSent);
    event ContractPaused();
    event ContractUnpaused();
    event TransferFailed(address indexed recipient, uint256 amount);

    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(owners[msg.sender].exists, "Not owner");
        require(msg.sender != deployer, "Deployer blocked");
        _;
    }
    modifier onlyDeployer() { require(msg.sender == deployer, "Only deployer"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier validPercentage(uint256 p) { require(p > 0 && p <= 100, "Invalid %"); _; }
    modifier notExpired(uint256 txId) {
        require(txId < transactions.length, "Invalid tx");
        require(block.timestamp <= transactions[txId].timestamp + expiryPeriod, "Expired");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _companyWallet,
        OwnerConfig memory config,
        uint256 _requiredPercentage,
        uint256 _timelockPeriod,
        uint256 _expiryPeriod,
        uint256 _minOwners
    ) {
        require(_companyWallet != address(0), "Invalid wallet");
        require(config.owners.length >= 2, "Min 2 owners");
        require(
            config.owners.length == config.names.length &&
            config.owners.length == config.percentages.length &&
            config.owners.length == config.removable.length,
            "Array mismatch"
        );

        deployer = msg.sender;
        companyWallet = ICompanyWallet(_companyWallet);

        require(_requiredPercentage > 0 && _requiredPercentage <= 100, "Invalid req%");
        require(_minOwners >= 2, "minOwners >= 2");
        require(_expiryPeriod > 0, "expiry > 0");

        requiredPercentage = _requiredPercentage;
        timelockPeriod     = _timelockPeriod;
        expiryPeriod       = _expiryPeriod;
        minOwners          = _minOwners;

        for (uint256 i = 0; i < config.owners.length; i++) {
            address ownerAddr = config.owners[i];
            require(ownerAddr != address(0) && ownerAddr != deployer, "Invalid owner");
            require(!owners[ownerAddr].exists, "Duplicate");
            require(bytes(config.names[i]).length > 0, "Empty name");
            uint256 pct = config.percentages[i];
            require(pct > 0 && pct <= 100, "Invalid %");

            totalPercentage += pct;
            owners[ownerAddr] = Owner(config.names[i], pct, true, config.removable[i]);
            ownerList.push(ownerAddr);
            emit OwnerAdded(ownerAddr, config.names[i], pct);
        }
        require(totalPercentage <= 100, "Total > 100");
    }

    // ============ BATCH TRANSFER: EQUAL AMOUNTS ============
    function submitBatchTransferEqual(
        address token,
        address[] calldata recipients,
        uint256 amountPer
    ) external payable onlyOwner whenNotPaused returns (uint256 txId) {
        require(recipients.length > 0, "No recipients");
        require(amountPer > 0, "Amount > 0");

        bytes memory data = abi.encodeWithSelector(
            this.executeBatchEqual.selector,
            token, recipients, amountPer
        );
        uint256 value = token == ETH_ADDRESS ? msg.value : 0;
        return _submit(address(this), value, false, address(0), data);
    }

    function executeBatchEqual(
        address token,
        address[] calldata recipients,
        uint256 amountPer
    ) external payable {
        require(msg.sender == address(this), "Only self");
        uint256 total = amountPer * recipients.length;
        uint256 successCount = 0;

        if (token == ETH_ADDRESS) {
            require(msg.value >= total, "Low ETH");
            for (uint256 i = 0; i < recipients.length; i++) {
                if (recipients[i] != address(0)) {
                    (bool sent, ) = payable(recipients[i]).call{value: amountPer}("");
                    if (sent) successCount++;
                    else emit TransferFailed(recipients[i], amountPer);
                }
            }
            uint256 excess = msg.value - total;
            if (excess > 0) {
                (bool refund, ) = payable(tx.origin).call{value: excess}("");
                require(refund, "Refund failed");
            }
        } else {
            IERC20 erc20 = IERC20(token);
            require(erc20.balanceOf(address(this)) >= total, "Low token");
            for (uint256 i = 0; i < recipients.length; i++) {
                if (recipients[i] != address(0)) {
                    bool sent = erc20.transfer(recipients[i], amountPer);
                    if (sent) successCount++;
                    else emit TransferFailed(recipients[i], amountPer);
                }
            }
        }
        emit BatchTransferExecuted(0, successCount, amountPer * successCount);
    }

    // ============ BATCH TRANSFER: DIFFERENT AMOUNTS ============
    function submitBatchTransferDifferent(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable onlyOwner whenNotPaused returns (uint256 txId) {
        require(recipients.length == amounts.length, "Mismatch");
        require(recipients.length > 0, "Empty");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount > 0");
            total += amounts[i];
        }

        bytes memory data = abi.encodeWithSelector(
            this.executeBatchDifferent.selector,
            token, recipients, amounts
        );
        uint256 value = token == ETH_ADDRESS ? msg.value : 0;
        return _submit(address(this), value, false, address(0), data);
    }

    function executeBatchDifferent(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        require(msg.sender == address(this), "Only self");
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) total += amounts[i];
        uint256 successCount = 0;
        uint256 totalSent = 0;

        if (token == ETH_ADDRESS) {
            require(msg.value >= total, "Low ETH");
            for (uint256 i = 0; i < recipients.length; i++) {
                if (recipients[i] != address(0) && amounts[i] > 0) {
                    (bool sent, ) = payable(recipients[i]).call{value: amounts[i]}("");
                    if (sent) {
                        successCount++;
                        totalSent += amounts[i];
                    } else {
                        emit TransferFailed(recipients[i], amounts[i]);
                    }
                }
            }
            uint256 excess = msg.value - total;
            if (excess > 0) {
                (bool refund, ) = payable(tx.origin).call{value: excess}("");
                require(refund, "Refund failed");
            }
        } else {
            IERC20 erc20 = IERC20(token);
            require(erc20.balanceOf(address(this)) >= total, "Low token");
            for (uint256 i = 0; i < recipients.length; i++) {
                if (recipients[i] != address(0) && amounts[i] > 0) {
                    bool sent = erc20.transfer(recipients[i], amounts[i]);
                    if (sent) {
                        successCount++;
                        totalSent += amounts[i];
                    } else {
                        emit TransferFailed(recipients[i], amounts[i]);
                    }
                }
            }
        }
        emit BatchTransferExecuted(0, successCount, totalSent);
    }

    // ============ CORE MULTISIG LOGIC ============
    function _submit(
        address to, uint256 value, bool isToken, address tokenAddr, bytes memory data
    ) internal returns (uint256 txId) {
        txId = transactions.length;
        transactions.push();
        TransactionRecord storage txn = transactions[txId];

        txn.initiator = msg.sender;
        txn.to = to;
        txn.value = value;
        txn.data = data;
        txn.isTokenTransfer = isToken;
        txn.tokenAddress = tokenAddr;
        txn.executed = false;
        txn.timestamp = block.timestamp;
        txn.confirmations[msg.sender] = true;
        txn.confirmationCount = owners[msg.sender].percentage;

        emit TransactionSubmitted(txId, msg.sender, to, value, isToken);

        if (isConfirmed(txId)) {
            txn.timelockEnd = block.timestamp + timelockPeriod;
            if (timelockPeriod == 0) _execute(txId);
        }
    }

    function confirmTransaction(uint256 txId)
        external onlyOwner whenNotPaused notExpired(txId) nonReentrant {
        TransactionRecord storage txn = transactions[txId];
        require(!txn.executed, "Executed");
        require(!txn.confirmations[msg.sender], "Confirmed");
        txn.confirmations[msg.sender] = true;
        txn.confirmationCount += owners[msg.sender].percentage;
        emit TransactionConfirmed(txId, msg.sender, owners[msg.sender].percentage);
        if (isConfirmed(txId) && txn.timelockEnd == 0) {
            txn.timelockEnd = block.timestamp + timelockPeriod;
            if (timelockPeriod == 0) _execute(txId);
        }
    }

    function executeTransactionManual(uint256 txId)
        external onlyOwner whenNotPaused notExpired(txId) nonReentrant {
        TransactionRecord storage txn = transactions[txId];
        require(!txn.executed, "Executed");
        require(isConfirmed(txId), "Not confirmed");
        require(block.timestamp >= txn.timelockEnd, "Timelock");
        _execute(txId);
    }

    function _execute(uint256 txId) internal {
        TransactionRecord storage txn = transactions[txId];
        txn.executed = true;

        (bool ok, ) = txn.to.call{value: txn.value}(txn.data);
        require(ok, "Call failed");

        emit TransactionExecuted(txId);
    }

    function isConfirmed(uint256 txId) public view returns (bool) {
        return transactions[txId].confirmationCount >= requiredPercentage;
    }

    // ============ ADMIN FUNCTIONS (via proposal) ============
    function changeRequiredPercentageInternal(uint256 v) external whenNotPaused validPercentage(v) {
        require(msg.sender == address(this), "Only self");
        emit RequiredPercentageChanged(requiredPercentage, v);
        requiredPercentage = v;
    }

    function changeTimelockPeriodInternal(uint256 v) external whenNotPaused {
        require(msg.sender == address(this), "Only self");
        emit TimelockPeriodChanged(timelockPeriod, v);
        timelockPeriod = v;
    }

    function changeExpiryPeriodInternal(uint256 v) external whenNotPaused {
        require(v > 0, "expiry > 0");
        require(msg.sender == address(this), "Only self");
        emit ExpiryPeriodChanged(expiryPeriod, v);
        expiryPeriod = v;
    }

    function changeMinOwnersInternal(uint256 v) external whenNotPaused {
        require(v >= 2, "min >= 2");
        require(msg.sender == address(this), "Only self");
        emit MinOwnersChanged(minOwners, v);
        minOwners = v;
    }

    // ============ PROPOSAL STARTERS ============
    function submitChangeRequiredPct(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeRequiredPercentageInternal.selector, v));
    }

    function submitChangeTimelock(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeTimelockPeriodInternal.selector, v));
    }

    function submitChangeExpiry(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeExpiryPeriodInternal.selector, v));
    }

    function submitChangeMinOwners(uint256 v) external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.changeMinOwnersInternal.selector, v));
    }

    // ============ OWNER MANAGEMENT ============
    function _addOwnerInternal(address addr, string memory name, uint256 pct, bool removable) internal {
        require(!owners[addr].exists, "Exists");
        require(totalPercentage + pct <= 100, "Sum > 100");
        owners[addr] = Owner(name, pct, true, removable);
        ownerList.push(addr);
        totalPercentage += pct;
        emit OwnerAdded(addr, name, pct);
    }

    function addOwnerInternal(address newOwner, string calldata name, uint256 percentage, bool removable)
        external whenNotPaused {
        require(msg.sender == address(this), "Only self");
        _addOwnerInternal(newOwner, name, percentage, removable);
    }

    function submitAddOwner(address newOwner, string calldata name, uint256 pct, bool removable)
        external onlyOwner returns (uint256) {
        return _submit(address(this), 0, false, address(0),
            abi.encodeWithSelector(this.addOwnerInternal.selector, newOwner, name, pct, removable));
    }

    // ============ VIEW FUNCTIONS ============
    function getOwners()
        external view returns (
            address[] memory addrs,
            string[] memory names,
            uint256[] memory percentages,
            bool[] memory removable
        ) {
        uint256 len = ownerList.length;
        addrs = new address[](len);
        names = new string[](len);
        percentages = new uint256[](len);
        removable = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            address a = ownerList[i];
            Owner memory o = owners[a];
            addrs[i] = a;
            names[i] = o.name;
            percentages[i] = o.percentage;
            removable[i] = o.removable;
        }
    }

    // ============ EMERGENCY ============
    function pause() external onlyDeployer { paused = true; emit ContractPaused(); }
    function unpause() external onlyDeployer { paused = false; emit ContractUnpaused(); }

    receive() external payable {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./multisig.sol";
import "./wallet.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MultiSigFactory {
    struct OwnerConfig {
        address[] owners;
        string[] names;
        uint256[] percentages;
        bool[] removable;
    }

    event MultiSigCreated(
        address indexed controller,
        address indexed companyWallet,
        address indexed deployer
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    address public owner;
    address[] public allControllers;
    address[] public allWallets;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function createMultiSig(
        OwnerConfig calldata config,
        uint256 _requiredPercentage,
        uint256 _timelockPeriod,
        uint256 _expiryPeriod,
        uint256 _minOwners
    ) external onlyOwner returns (address controller, address companyWallet) {
        require(config.owners.length >= 2, "Min 2 owners");
        require(
            config.owners.length == config.names.length &&
            config.owners.length == config.percentages.length &&
            config.owners.length == config.removable.length,
            "Array length mismatch"
        );
        require(_requiredPercentage > 0 && _requiredPercentage <= 100, "Invalid req%");
        require(_minOwners >= 2, "minOwners >= 2");
        require(_expiryPeriod > 0, "expiry > 0");

        CompanyWallet wallet = new CompanyWallet(address(this));
        companyWallet = address(wallet);
        allWallets.push(companyWallet);

        MultiSigWalletController ctrl = new MultiSigWalletController(
            companyWallet,
            config,
            _requiredPercentage,
            _timelockPeriod,
            _expiryPeriod,
            _minOwners
        );
        controller = address(ctrl);
        allControllers.push(controller);

        wallet.setController(controller);

        emit MultiSigCreated(controller, companyWallet, msg.sender);

        return (controller, companyWallet);
    }

    function getAllControllers() external view returns (address[] memory) {
        return allControllers;
    }

    function getAllWallets() external view returns (address[] memory) {
        return allWallets;
    }

    function getDeploymentCount() external view returns (uint256, uint256) {
        return (allControllers.length, allWallets.length);
    }

    function rescueETH(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }

    function rescueToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    receive() external payable {}
}
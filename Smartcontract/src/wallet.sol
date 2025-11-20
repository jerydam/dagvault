// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IWallet.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";


contract CompanyWallet is ICompanyWallet {
    address public owner;
    address public controller;

    event ControllerChanged(address indexed oldController, address indexed newController);
    event TransactionExecuted(address indexed to, uint256 value, bool isTokenTransfer, address tokenAddress, bool success);
    event TokensReceived(address indexed token, address indexed from, uint256 amount);
    event OwnershipRenounced(address indexed oldOwner);

    modifier onlyController() {
        require(msg.sender == controller, "Only controller");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Invalid owner");
        owner = initialOwner;
    }

    function setController(address _controller) external onlyOwner {
        require(controller == address(0), "Already set");
        require(_controller != address(0), "Invalid controller");
        address old = controller;
        controller = _controller;
        emit ControllerChanged(old, _controller);
    }

    function renounceOwnership() external onlyOwner {
        emit OwnershipRenounced(owner);
        owner = address(0);
    }

    function executeTransaction(
        address to,
        uint256 value,
        bool isTokenTransfer,
        address tokenAddress,
        bytes calldata data
    ) external override onlyController returns (bool) {
        require(to != address(0), "Invalid recipient");
        bool success;

        if (isTokenTransfer) {
            require(tokenAddress != address(0), "Invalid token");
            require(IERC20(tokenAddress).balanceOf(address(this)) >= value, "Low token balance");
            success = IERC20(tokenAddress).transfer(to, value);
        } else {
            require(address(this).balance >= value, "Low ETH balance");
            (success, ) = to.call{value: value}(data);
        }

        emit TransactionExecuted(to, value, isTokenTransfer, tokenAddress, success);
        return success;
    }

    function receiveTokens(address token, uint256 amount) external {
        require(token != address(0) && amount > 0, "Invalid input");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TokensReceived(token, msg.sender, amount);
    }

    function getBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance(address token) external view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    receive() external payable {}
    fallback() external payable {}
}
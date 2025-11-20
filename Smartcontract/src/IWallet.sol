// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICompanyWallet {
    function executeTransaction(
        address to,
        uint256 value,
        bool isTokenTransfer,
        address tokenAddress,
        bytes calldata data
    ) external returns (bool);

    function getBalance() external view returns (uint256);
    function getTokenBalance(address token) external view returns (uint256);
}
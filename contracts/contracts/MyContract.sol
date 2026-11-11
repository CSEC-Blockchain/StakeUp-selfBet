// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyContract {
    address public immutable owner;
    uint256 public value;

    event ValueChanged(address indexed by, uint256 newValue);

    error ZeroValue();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 initialValue) {
        owner = msg.sender;
        value = initialValue;
    }

    function setValue(uint256 newValue) external {
        if (newValue == 0) revert ZeroValue();
        value = newValue;
        emit ValueChanged(msg.sender, newValue);
    }
}


// SPDX-License-Identifier: MIT
pragma solidity >0.7.0 <0.8.0;

contract BlockParameter {
    uint256 public hello;
    uint256 public lastTimestamp;
    uint256 public lastBlockNumber;

    constructor() public {
        hello = 1;
    }

    function setHello() public {
        hello = hello + 1;
        lastTimestamp = block.timestamp;
        lastBlockNumber = block.number;
    }

    function currentTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function currentBlockNumber() public view returns (uint256) {
        return block.number;
    }
}

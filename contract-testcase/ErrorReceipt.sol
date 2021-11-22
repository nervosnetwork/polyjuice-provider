pragma solidity >=0.4.0 <=0.8.0;

contract ErrorReceipt {
    function getRevertMsg(uint256 value) public view returns (uint256) {
        require(value != 444, "you trigger death value!");
        require(value != 555, "you trigger crying value!");
        return value;
    }
}

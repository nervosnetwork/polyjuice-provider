pragma solidity >=0.4.0 <=0.8.0;

contract DeployArgs {
    uint256 value;
    address[] addressList;

    constructor(uint256 _value, address[] memory _addressList) {
        value = _value;
        addressList = _addressList;
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function getAddressList() public view returns (address[] memory) {
        return addressList;
    }
}

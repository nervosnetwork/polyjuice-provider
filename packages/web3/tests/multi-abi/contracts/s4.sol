
pragma solidity >=0.4.0 <0.7.0;

//Declares a new contract
contract s4 {
    //Storage. Persists in between transactions
    address x;

    //Allows the address stored to be changed
    function set(address newValue, uint8 value) public {
        require(value != 0, "value can't be 0");
        x = newValue;
    }

    
    //Returns the currently stored address
    function get() public view returns (address) {
        return x;
    }
}
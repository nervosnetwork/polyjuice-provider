
pragma solidity >=0.4.0 <0.7.0;

//Declares a new contract
contract s2 {
    //Storage. Persists in between transactions
    bytes20 x;

    //Allows the address stored to be changed
    function set(bytes20 newValue) public {
        x = newValue;
    }
    
    //Returns the currently stored address
    function get() public view returns (bytes20) {
        return x;
    }
}
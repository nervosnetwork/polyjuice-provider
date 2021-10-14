
pragma solidity >=0.4.0 <0.7.0;

//Declares a new contract
contract s3 {
    //Storage. Persists in between transactions
    address x;

    //Allows the address stored to be changed
    function set(address newValue) public {
        x = newValue;
    }
    
    //Returns the currently stored address
    function get() public view returns (address) {
        return x;
    }
}
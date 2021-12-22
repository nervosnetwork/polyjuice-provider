# Known Caveats(things you should be careful about)

polyjuice can run your solidity contract code compatible with EVM, but in order to achieve max interoperability with more than just Ethereum, it use polyjuice address, which is different from ethereum address.

the polyjuice-provider convert the two different address type automatically for your Dapp. we aims to provide 100% compatibility, but there are still some limits as this library developing.

## short version

- ~~you need to take care of the address converting by yourself when deploying contract with constructor arguments which contains address type.~~ For web3.js and ethers, we provide one helper function to convert deployment arguments to save some works for you, checkout [how to use it](docs/get-started.md#example-deploy-contract).
  
- do not use polyjuice-provider with contract address which has not been created on-chain.
  
- do not use polyjuice-provider to transfer ether.

## long version and why

- ~~currently we do **NOT** support address-converting [for contract deployment arguments](packages/ethers/tests/deployArgs.test.ts#L77), that is to say, when you use ethers/web3.js/truffle to deploy contract with address as constructor arguments, you should take care of the address converting by yourself to pass the right polyjuiceAddress instead of ethAddress. however, this limits might be removed in the future for new release version. please stay alert.~~ For web3.js and ethers, Converting address for deployment arguments are supported now, you need to [call this function](docs/get-started.md#example-deploy-contract) to convert it explicitly before deploy your contract.
  
- currently we do NOT support passing contract-address which has not been created yet on chain as address parameter in tx's data field to interact with smart-contract. noticed that, this doesn't mean we do not support create2. you can use create2 whenever you want. but if it has not been created on chain, you can not use this address as parameter to feed other contracts. the address-converting will go wrong. as soon as the contract been created, there is no limit.
  
- currently we are NOT supporting transfer ether to another EOA address directly via provider for safety reason, so if you are sending a transfer transaction through polyjuice-provider, it won't work. however, you can still construct a transaction which interact with ERC20-contract and tell the contract to transfer token for you.

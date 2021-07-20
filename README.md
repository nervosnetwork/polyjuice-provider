# Polyjuice Provider

godwoken-polyjuice compatible providers for ethereum library like [ethers](https://github.com/ethers-io/ethers.js) and [web3js](https://github.com/ChainSafe/web3.js).

now you can call your smart-contract on godwoken-polyjuice with metamask and eth address.

- Web3 compatible provider: `/packages/web3`
- ethers compatible provider: `/packages/ethers`
- truffle compatible HdWalletProvider: `/packages/truffle`
- ...more providers coming

```sh
yarn add @polyjuice-provider/web3
yarn add @polyjuice-provider/ethers
yarn add @polyjuice-provider/truffle
```

A simple react example to use `@polyjuice-provider` module can [be found here](https://github.com/RetricSu/polyjuice-provider-example).

`note: this project is still under development, some APIs might be changed in the future.`

## How It Works?

there are three main differences between Godwoken-Polyjuice and Ethereum:

1. due to different data structure for underlying CKB blockchain and Ethereum blockchain, when you send an ethereum transaction to Godwoken-Polyjuice, the data structure of this very transaction needs to be converting to right type.
2. signing method for transaction is also different. godwoken use ethereum's compatible personal-sign method. so when you are signing a Godwoken-Polyjuice tx, it will looks like you are requesting to signing a message using ethereum presonal-sign method.
3. the address type using in Godwoken and Ethereum is also different. when you pass address-type parameter to call smart-contract, the converting must be done in order to feed the right address type for Godwoken-Polyjuice. vice versa for the return address value.

provider are designed to got these 3 things done for you and your dapp, mainly by:

1. convert Ethereum transaction to Godwoken L2 transaction.
2. generate signing message from Godwoken L2 transaction and call Metamask for signing (or use privateKey in non-browser env).
3. do address type converting according to your contract's Abi. that's why you need to pass AbiItems to provider constructor.

## Known Caveats Of polyjuice-provider

- currently we do not support not-created-yet contract-address passing as address type parameter to interact with smart-contract. noticed that, this dosen't mean we do not supprot `create2`. you can use create2 whenever you want. but if it has not been created on chain, you can not use this address as parameters to feed other contracts. the address type converting will go wrong. as soon as the contract been created, there is no limit.

## How To Develop This Project

```sh
yarn
yarn build
```

## Test

start a devnet via [Godwoken-Kicker](https://github.com/RetricSu/godwoken-kicker) on your local environment.

run

```sh
yarn env
```

to generate .env file accross all workspace. the terminal will ask you to enter some polyjuice config.

default web3 rpc url is `localhost:8024`, if you want to use that default value, just press enter directly.

then you can run all tests

```sh
yarn test
```

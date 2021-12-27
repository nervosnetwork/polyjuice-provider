# Polyjuice Provider

godwoken-polyjuice compatible providers for ethereum library like [ethers](https://github.com/ethers-io/ethers.js) and [web3js](https://github.com/ChainSafe/web3.js).

## <u>Please Read [Known-Caveats](https://github.com/nervosnetwork/polyjuice-provider#known-caveatsthings-you-should-be-careful-about-) Carefully Before Using This Library</u>

## Important Notes

- new version [v0.1.2](https://github.com/nervosnetwork/polyjuice-provider/releases/tag/v0.1.2) has been release which [support contract deployment arguments address converting](docs/get-started.md#example-deploy-contract), please upgrade to latest version. (2021.12.27)

- new version [v0.1.0](https://github.com/nervosnetwork/polyjuice-provider/releases/tag/v0.1.0) has been release including some bug fixed, please upgrade to latest version. (2021.11.18)

- since [Godwoken](https://github.com/nervosnetwork/godwoken) had some changed for instant-finality, please upgrade your Polyjuice-Provider over [0.0.1-rc14](https://github.com/nervosnetwork/polyjuice-provider/releases/tag/v0.0.1-rc10) version or above. otherwise you might not be able to fetch tx-receipt as fast as possible. (2021.11.15)

- since [Godwoken-web3](https://github.com/nervosnetwork/godwoken-web3) will have some APIs deprecated in the future, it is recommend to upgrade your Polyjuice-Provider over [0.0.1-rc10](https://github.com/nervosnetwork/polyjuice-provider/releases/tag/v0.0.1-rc10) version or above. as early as possible. (2021.09.15)

## Install

```sh
yarn add @polyjuice-provider/web3
yarn add @polyjuice-provider/ethers
yarn add @polyjuice-provider/truffle
```

## Usage

[simple React example](https://github.com/RetricSu/polyjuice-provider-example)

## Docs

- [Getting-Started](docs/get-started.md)
- [APIs](docs/api.md)

`note: this project is still under development, some APIs might be changed in the future.`

## Known Caveats(things you should be careful about !!)

polyjuice can run your solidity contract code compatible with EVM, but in order to achieve max interoperability with more than just Ethereum, it use polyjuice address, which is different from ethereum address.

the polyjuice-provider convert the two different address type automatically for your Dapp. we aims to provide 100% compatibility, but there are still some limits as this library developing. 

short version:

- ~~you need to take care of the address converting by yourself when deploying contract with constructor arguments which contains address type.~~ For web3.js and ethers, we provide one helper function to convert deployment arguments to save some works for you, checkout [how to use it](docs/get-started.md#example-deploy-contract).
- do not use polyjuice-provider with contract address which has not been created on-chain.
- do not use polyjuice-provider to transfer ether.

long version and why:

- ~~currently we do **NOT** support address-converting [for contract deployment arguments](packages/ethers/tests/deployArgs.test.ts#L77), that is to say, when you use ethers/web3.js/truffle to deploy contract with address as constructor arguments, you should take care of the address converting by yourself to pass the right polyjuiceAddress instead of ethAddress. however, this limits might be removed in the future for new release version. please stay alert.~~ For web3.js and ethers, Converting address for deployment arguments are supported now, you need to [call this function](docs/get-started.md#example-deploy-contract) to convert it explicitly before deploy your contract.
- currently we do **NOT** support passing contract-address which has not been created yet on chain as address parameter in tx's [data field](https://ethereum.org/en/developers/docs/transactions/) to interact with smart-contract. noticed that, this doesn't mean we do not support `create2`. you can use create2 whenever you want. but if it has not been created on chain, you can not use this address as parameter to feed other contracts. the address-converting will go wrong. as soon as the contract been created, there is no limit.
- currently we are **NOT** supporting transfer ether to another EOA address directly via provider for safety reason, so if you are sending a transfer transaction through polyjuice-provider, it won't work. however, you can still construct a transaction which interact with ERC20-contract and tell the contract to transfer token for you.

you can learn more by reading how it works below.

## How It Works?

there are three main differences between Godwoken-Polyjuice and Ethereum:

1. Different Transaction Structure: when you send an ethereum transaction to Godwoken-Polyjuice, the data structure of this very transaction needs to be converting to godwoken transaction type.
2. Different Signing Message: when you are signing a Godwoken-Polyjuice tx, it will looks like you are requesting to signing a message using ethereum personal-sign method.
3. Different Address Type: polyjuice address is different from ethereum address. when you pass some address-type parameters to call smart-contract, the address converting must be done in order to feed the right polyjuice address for Godwoken-Polyjuice. vice versa for the return address value.

provider are designed to got these 3 things done for you and your dapp, mainly by:

1. convert Ethereum transaction to Godwoken L2 transaction.
2. generate signing message from Godwoken L2 transaction and call Metamask for signing (or use privateKey in non-browser env).
3. do address type converting according to your contract's Abi. that's why you need to pass AbiItems to provider constructor. you can pass [multiple smart-contracts ABIs to provider](docs/get-started.md#L91) if needed.

## Need another provider?

right now we have 3 compatible providers:

- Web3 compatible provider: `/packages/web3`
- ethers compatible provider: `/packages/ethers`
- truffle compatible HdWalletProvider: `/packages/truffle`

if you need another compatible provider, you can request via opening an issue or even create an pull request by yourself :) we hope community can takes part in and build more useful tools together for godwoken-polyjuice.

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

to generate .env file across all workspace. the terminal will ask you to enter some polyjuice config.

default web3 rpc url is `localhost:8024`(and ws rpc is `localhost:8024/ws`), if you want to use that default value, just press enter directly. the rollup type hash and eth account lock hash are optional parameters too, you can skip those as well.

finally, you can run all tests with

```sh
yarn test
```

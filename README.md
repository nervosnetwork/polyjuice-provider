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

## How to develop this project

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

# @polyjuice-provider/ethers

this is a sub-module of @polyjuice-provider.

## Install

```sh
yarn add @polyjuice-provider/ethers 
```

or

```sh
npm install --save @polyjuice-provider/ethers
```

## Usage

once you install this module, then you got two main tools to run with `ethers` for compatibility:

- PolyjuiceJsonRpcProvider (compatible version of [JsonRpcProvider](https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts))
- PolyjuiceWallet (compatible version of [Wallet](https://github.com/ethers-io/ethers.js/tree/master/packages/wallet))

replacement:

```ts
new providers.JsonRpcProvider(..) ---> new PolyjuiceJsonRpcProvider(...)
new Wallet(..) --> new PolyjuiceWallet(...)
```

### Example: Deploy contract

```ts
import { ContractFactory } from "ethers";
import { PolyjuiceWallet, PolyjuiceConfig, PolyjuiceJsonRpcProvider } from "@polyjuice-provider/ethers";

const polyjuice_config: PolyjuiceConfig = {
  rollupTypeHash: 'godwoken rollup type hash', // you can find this value by opening your browser to access http://localhost:6101/get_rollup_type_hash after starting kicker
  ethAccountLockCodeHash: 'godwoken eth account lock code hash', // you can find this value by opening your browser to access http://localhost:6101/get_eth_account_lock after starting kicker  
  abiItems: ['your abi items array'] // this is optional
  web3Url: 'godwoken web3 rpc url', // normally it is http://localhost:8024 in devnet
};
const rpc = new PolyjuiceJsonRpcProvider(polyjuice_config, PolyjuiceConfig.web3Url); 
const deployer = new PolyjuiceWallet('<your deployer private key>', polyjuice_config, rpc);
const implementationFactory = new ContractFactory(
  contract.abi,
  contract.bytecode,
  deployer,
);
const tx = implementationFactory.getDeployTransaction();
tx.gasPrice = 0;
tx.gasLimit = 1_000_000;
deployer.sendTransaction(tx);
```

a more complete and real example can be found [here](https://github.com/RetricSu/godwoken-polyjuice-compatibility-examples/commit/90ccce0288cc44f0c5ba3d338c142922518867d2#diff-86f1dc0bf3c5524626be0d195ed3872e309c3175c4cd71305b7ffcc7c1444164)

## Migrate dap

to be completed. pr is appreciated.

## How to develop this module

build:

```sh
yarn build
```

before you can run test, you should run [godwoken-kicker](https://github.com/RetricSu/godwoken-kicker) and create an .test.env file with some godwoken-polyjuice config.

```sh
cat > ./.test.env <<EOF
WEB3_JSON_RPC=<godwoken web3 rpc>
ROLLUP_TYPE_HASH=<godwoken rollup type hash>
ETH_ACCOUNT_LOCK_CODE_HASH=<eth account lock code hash>
PRIVATE_KEY=<your eth test private key, do not use in production>
ETH_ADDRESS=<your eth test address, match with private_key above>
EOF
```

## test

```sh
    yarn test
```

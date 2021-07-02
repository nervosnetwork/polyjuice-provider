Usage
===

note: right now this project is still under development, `ethers` and `web3js` lib are stick together in one module, later we will spilt to different iso packages, please get back to check again.

to use polyjuice-provider, we assume you already running a godwoken-polyjuice devnet chain using [Godwoken-Kicker](https://github.com/RetricSu/godwoken-kicker) in your local environment.

## if you are using `web3.js`

first, install the packages:

```sh
yarn add @polyjuice-provider/core
```

### deploy contract

```js
const Web3 = require("web3");
const PolyjuiceHttpProvider = require("@polyjuice-provider/core/lib/cli");

// init provider and web3
const godwoken_rpc_url = 'godwoken web3 rpc url'; // normally it is http://localhost:8024
const provider_config = {
  godwoken: {
    rollup_type_hash: 'godwoken rollup type hash', // you can find this value by opening your browser to access http://localhost:6101/get_rollup_type_hash
    eth_account_lock: {
      code_hash: 'godwoken eth lock code hash', //  you can find this value by opening your browser to access http://localhost:6101/get_eth_acccount_lock
      hash_type: "type",
    },
  },
};
provider = new PolyjuiceHttpProvider(
  godwoken_rpc_url,
  provider_config,
  ['your contract abi array'],
  'your deployer private_key'
);

const web3 = new Web3(provider);
const txResponse = await web3.eth.sendTransaction({
  from: 'deployer eth address',
  to: `0x${Array(40).fill(0).join("")}`,
  value: "0x00",
  data: "your contract compiled bytecode with 0x prefix",
  gas: "0x30d40", // some gas
  gasPrice: "0x00", // you can set gasPrice as 0
});
const txReceipt = await web3.eth.getTransactionReceipt(txResponse.transactionHash);
const contract_deployed_address = txReceipt.contractAddress;
```

note: later we will support using `web3.accounts` to sign transaction and deploy contract.

## if you are using hardhat

first, install the packages:

```sh
yarn add @polyjuice-provider/core
```

### deploy contractd

because hardhat use `ethers`, so you will need to make the replacement below:

replace

```ts
import { Wallet } from "ethers";
```

with

```ts
import PolyjuiceWallet from "@polyjuice-provider/core/lib/hardhat/wallet-signer";
```

and use `PolyjuiceWallet` instead of `Wallet` in your code. 

replace 

```sh
import { providers } from "ethers";
providers.JsonRpcProvider
```

with

```sh
import { PolyjuiceJsonRpcProvider } from "@polyjuice-provider/core/lib/hardhat/providers";
```

and use `PolyjuiceJsonRpcProvider` instead of `JsonRpcProvider` in your code.

example:

```ts
import { ContractFactory } from "ethers";
import PolyjuiceWallet, { PolyjuiceConfig } from "@polyjuice-provider/core/lib/hardhat/wallet-signer";
import { PolyjuiceJsonRpcProvider } from "@polyjuice-provider/core/lib/hardhat/providers";

const polyjuice_config: PolyjuiceConfig = {
  godwokerOption: {
    godwoken: {
      rollup_type_hash: 'godwoken rollup type hash', // you can find this value by opening your browser to access http://localhost:6101/get_rollup_type_hash,
      eth_account_lock: {
        code_hash: 'godwoken eth lock code hash', //  you can find this value by opening your browser to access http://localhost:6101/get_eth_acccount_lock
        hash_type: "type",
      },
    },
  },
  web3RpcUrl: process.env.RPC_URL!, // normally it is http://localhost:8024;
  abiItems: ['your contract abi array']
};

const rpc = new PolyjuiceJsonRpcProvider(polyjuice_config.godwokerOption, polyjuice_config.abiItems, 'godwoken web3 rpc url'); // normally it is http://localhost:8024;
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

## try to make your dapp work with godwoken-polyjuice?

if you are using `web3.js` and `metamask`, you can simply change your dapp like following:

### init web3

Before:

```js
import Web3 from 'web3';

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8024'));
```

Now:

```js
import Web3 from 'web3';
import PolyjuiceHttpProvider from '@polyjuice-provider/core';

var web3 = new Web3(new PolyjuiceHttpProvider('http://localhost:8024', GodwokenOption, ['your abi items array']));
```

for ```GodwokenOption```: see [here](/src/util.ts#L38-L49).

### init contract instance

Before:

```js
import Web3 from 'web3';

var provider = new Web3.providers.HttpProvider('http://localhost:8024');
var web3 = new Web3(provider);

var contract = web3.eth.Contract(abi, contract_address);
```

Now:

```js
import Web3 from 'web3';
import PolyjuiceHttpProvider from '@polyjuice-provider/core';

var provider = new PolyjuiceHttpProvider('http://localhost:8024', GodwokenOption, ['your abi items array']);
var web3 = new Web3(provider);

var contract = web3.eth.Contract(abi, contract_address);
```

if you are using `ethers`, the usage in dapp is mostly the same with deploying contract above.

lastly, we will introduce more polyjuice compatible lib with ETH in the future.

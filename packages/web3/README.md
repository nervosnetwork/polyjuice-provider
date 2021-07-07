# @polyjuice-provider/web3

## Install

```sh
yarn add @polyjuice-provider/web3 
```

## Deploy contract

```js
const Web3 = require("web3");
const { PolyjuiceHttpProviderCli } = require("@polyjuice-provider/web3");

// init provider and web3
const polyjuice_config: PolyjuiceConfig = {
  rollupTypeHash: 'godwoken rollup type hash', // you can find this value by opening your browser to access http://localhost:6101/get_rollup_type_hash after starting kicker
  ethAccountLockCodeHash: 'godwoken eth account lock code hash', // you can find this value by opening your browser to access http://localhost:6101/get_eth_account_lock after starting kicker  
  abiItems: ['your abi items array'] // this is optional
  web3Url: 'godwoken web3 rpc url', // normally it is http://localhost:8024 in devnet
};
provider = new PolyjuiceHttpProviderCli(
  godwoken_rpc_url,
  provider_config,
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

note: later we will support using `web3.accounts` to sign transaction and deploy contract in nodejs.

## Migrate dapp

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
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';

var web3 = new Web3(new PolyjuiceHttpProvider('http://localhost:8024', polyjuiceConfig));
```

for ```polyjuiceConfig```: see above.

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
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';

var provider = new PolyjuiceHttpProvider('http://localhost:8024', polyjuiceConfig);
var web3 = new Web3(provider);

var contract = web3.eth.Contract(abi, contract_address);
```

## How to develop

before you can run test and an minimal example, create an .test.env file with some godwoken-polyjuice config.

```sh
cat > ./.test.env <<EOF
WEB3_JSON_RPC=<godwoken web3 rpc>
ROLLUP_TYPE_HASH=<godwoken rollup type hash>
ETH_ACCOUNT_LOCK_CODE_HASH=<eth account lock code hash>
EXAMPLE_CONTRACT_ADDRESS=<an example test contract deployed address>
PRIVATE_KEY=<your eth test private key, do not use in production>
ETH_ADDRESS=<your eth test address, match with private_key above>
EOF
```

## test

```sh
    yarn test
```

## start a minimal dapp example

```sh
    yarn example
```

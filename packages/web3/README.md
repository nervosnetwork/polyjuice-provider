# @polyjuice-provider/web3

this is a sub-module of @polyjuice-provider.

## Install

```sh
yarn add @polyjuice-provider/web3 
```

or

```sh
npm install --save @polyjuice-provider/web3 
```

## Usage

once you install this module, then you got three main tools to run with `web3.js` for compatibility:

- PolyjuiceHttpProvider (compatible version of [web3-providers-http](https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http))
- PolyjuiceAccounts (compatible version of [web3.eth.accounts](https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-eth-accounts))
- PolyjuiceHttpProviderCli (old version solution for signing tx with web3.js in nodejs environment, now recommend use PolyjuiceAccounts instead of this module)

replacement:

```sh
new Web3HttpProvider(..) --> new PolyjuiceHttpProvider(...)
new Web3EthAccounts(..) ---> new PolyjuiceAccounts(...)
```

### Example: Deploy contract

```js
const Web3 = require("web3");
const { PolyjuiceHttpProvider, PolyjuiceAccounts } = require("@polyjuice-provider/web3");

const polyjuice_config: PolyjuiceConfig = {
  rollupTypeHash: 'godwoken rollup type hash', // you can find this value by opening your browser to access http://localhost:6101/get_rollup_type_hash after starting kicker
  ethAccountLockCodeHash: 'godwoken eth account lock code hash', // you can find this value by opening your browser to access http://localhost:6101/get_eth_account_lock after starting kicker  
  abiItems: ['your abi items array'] // this is optional, you can pass [] if you want
  web3Url: 'godwoken web3 rpc url', // normally it is http://localhost:8024 in devnet
};

provider = new PolyjuiceHttpProvider(
  godwoken_rpc_url,
  provider_config,
);
polyjuiceAccounts = new PolyjuiceAccounts(polyjuice_config);

const web3 = new Web3(provider);
web3.eth.accounts = polyjuiceAccounts;
web3.eth.Contract._accounts = web3.eth.accounts;
web3.eth.accounts.wallet.add(`your private key`);

const myContract = await web3.eth.Contract(`your contract's abi`);
const contractInstance = myContract
    .deploy({
      data: `contract bin`,
      arguments: [],
    })
    .send({
      gas: "0x30d40", 
      gasPrice: "0x00"
    });
const contract_deployed_address = contractInstance._address;
```

## Migrate dapp

if your dapp are using `web3.js` and `metamask`, you can simply change it like following:

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

## How to develop this module

build:

```sh
yarn build
```

before you can run test and an minimal example, you should run [godwoken-kicker](https://github.com/RetricSu/godwoken-kicker) and create an .test.env file with some godwoken-polyjuice config.

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

in order to get `EXAMPLE_CONTRACT_ADDRESS`, you should deploy [this test contract](https://github.com/RetricSu/simple-storage-v2) in godwoken-kicker.

## test

```sh
    yarn test
```

## start a minimal dapp example

```sh
    yarn example
```

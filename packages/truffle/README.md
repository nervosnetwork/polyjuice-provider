# @polyjuice-provider/truffle

this is a sub-module of @polyjuice-provider.

## Install

```sh
yarn add @polyjuice-provider/truffle 
```

or

```sh
npm install --save @polyjuice-provider/truffle 
```

## Usage

once you install this module, then you got the following tool to run inside truffle project for compatibility:

- PolyjuiceHDWalletProvider (compatible version of [@truffle/hdwallet-provider](https://github.com/trufflesuite/truffle/tree/develop/packages/hdwallet-provider))

replacement:

```sh
new HDWalletProvider(..) --> new PolyjuiceHDWalletProvider(...)
```

### Deploy contract With Truffle

use `PolyjuiceHDWalletProvider` in truffle-config.js for your truffle project.

```sh
const { PolyjuiceHDWalletProvider } = require("@polyjuice-provider/truffle");
const { PolyjuiceHttpProvider } = require("@polyjuice-provider/web3");

const root = require("path").join.bind(this, __dirname, ".");
require("dotenv").config({ path: root(".env") });

const rpc_url = new URL(process.env.WEB3_JSON_RPC);

const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
const polyjuice_config = {
  rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
  ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
  web3Url: godwoken_rpc_url,
};

const polyjuiceHttpProvider = new PolyjuiceHttpProvider(
  polyjuice_config.web3Url,
  polyjuice_config
);
const polyjuiceTruffleProvider = new PolyjuiceHDWalletProvider(
  [
    {
      privateKeys: [process.env.PRIVATE_KEY],
      providerOrUrl: polyjuiceHttpProvider,
    },
  ],
  polyjuice_config
);

module.exports = {
  networks: {
    development: {
      host: rpc_url.hostname, // Localhost (default: none)
      port: rpc_url.port, // Standard Ethereum port (default: none)
      gasPrice: "0", // important for dryRun mode. 0 must be string type.
      network_id: "*", // Any network (default: none)
      provider: () => polyjuiceTruffleProvider,
    }
};
```

checkout this [example](https://github.com/RetricSu/simple-storage-v2).

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

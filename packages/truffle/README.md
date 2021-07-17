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

see this [example](https://github.com/RetricSu/polyjuice-provider/tree/add-truffle-deploy-example/packages/simple-storage-v2).

or this [stand-alone one](https://github.com/RetricSu/simple-storage-v2/tree/support-deploy).

## How to develop this module

build:

```sh
yarn build
```

before you can run test, you should run [godwoken-kicker](https://github.com/RetricSu/godwoken-kicker) and create an .test.env file with some godwoken-polyjuice config.

```sh
cat > ./.test.env <<EOF
truffle_JSON_RPC=<godwoken truffle rpc>
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

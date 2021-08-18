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

read [docs here](../../docs/get-started.md#web3)

## How to develop this module

build:

```sh
yarn build
```

before you can run test and an minimal example, you should run [godwoken-kicker](https://github.com/RetricSu/godwoken-kicker) and create an .test.env file with some godwoken-polyjuice config.

```sh
cat > ./.test.env <<EOF
WEB3_JSON_RPC=<godwoken-web3 rpc>
WEB3_WS_JSON_RPC=<godwoken-web3 websocket rpc>
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

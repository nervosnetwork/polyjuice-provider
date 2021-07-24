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

read [docs here](../../docs/get-started.md#truffle)

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

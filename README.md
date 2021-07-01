# (THIS BRANCH IS ONLY FOR TEST!) Polyjuice Http Provider

a godwoken-compatible http provider for web3.js.

now you can call your smart-contract on godwoken with metamask and eth address.

[docs](docs/usage.md)

## getting started

```sh
    git clone https://github.com/RetricSu/polyjuice-providers-http.git
    cd polyjuice-providers-http
    yarn 
```

build:

```sh
    yarn build
```

usage:

```js
const PolyjuiceHttpProvider = require('./PolyjuiceHttpProvider');
```

typescript supported:

```ts
import PolyjuiceHttpProvider from './PolyjuiceHttpProvider';
```

browser version lies in:

```sh
    /build/browser/PolyjuiceHttpProvider.js
```

usage:

```html
<script src="/path/to/PolyjuiceHttpProvider.js"></script>
```

### hardhat

hardhat is using `ethers` instead of `web3.js`, you can find ethers-compatibale `JsonRpcProvider` and `WalletSigner` in `/lib/hardhat/providers`

usage:

```js
const { PolyjuiceJsonRpcProvider } = require('PolyjuiceHttpProvider/lib/hardhat/providers');
const PolyjuiceWallet = require('PolyjuiceHttpProvider/lib/hardhat/wallet-signer');
```


---

before you can run test and an minimal example, create an .test.env file with some godwoken-polyjuice config.

```sh
cat > ./test.env <<EOF
WEB3_JSON_RPC=<godwoken web3 rpc>
ROLLUP_TYPE_HASH=<godwoken rollup type hash>
ETH_ACCOUNT_LOCK_CODE_HASH=<eth account lock code hash>
EXAMPLE_CONTRACT_ADDRESS=<an example test contract deployed address>
PRIVATE_KEY=<your eth test private key, do not use in production>
ETH_ADDRESS=<your eth test address, match with private_key above>
```

## test

```sh
    yarn test
```

## start a minimal dapp example

```sh
    yarn example
```

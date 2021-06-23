# (THIS BRANCH IS ONLY FOR TEST!) Polyjuice Http Provider

a godwoken-compatible http provider for web3.js.

now you can call your smart-contract on godwoken with metamask and eth address.

## init web3

Before:

```js
import Web3 from 'web3';

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8024'));
```

Now:

```js
import Web3 from 'web3';
import PolyjuiceHttpProvider from './PolyjuiceHttpProvider';

var web3 = new Web3(new PolyjuiceHttpProvider('http://localhost:8024', GodwokenOption, ['your abi items array']));
```

for ```GodwokenOption```: see [here](/src/util.ts#L38-L49).

## init contract instance

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
import PolyjuiceHttpProvider from './PolyjuiceHttpProvider';

var provider = new PolyjuiceHttpProvider('http://localhost:8024', GodwokenOption, ['your abi items array']);
var web3 = new Web3(provider);

var contract = web3.eth.Contract(abi, contract_address);
```

basically, PolyjuiceHttpProvider is just a extended class of [[web3-providers-http](https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http)]

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

node version:

```sh
    /lib/index.node.js
```

usage:

```js
const PolyjuiceHttpProvider = require('./PolyjuiceHttpProvider');
```

web version:

```sh
    /lib/index.js
```

useage:

```js
import PolyjuiceHttpProvider from './PolyjuiceHttpProvider';
```

browser version:

```sh
    /build/browser/PolyjuiceHttpProvider.js
```

usage:

```html
<script src="/path/to/PolyjuiceHttpProvider.js"></script>
```

---

before you can run test and an minimal example, create an .test.env file with some godwoken-polyjuice config.

```sh
cat > ./test.env <<EOF
WEB3_JSON_RPC=<godwoken web3 rpc>
ROLLUP_TYPE_HASH=<godwoken rollup type hash>
ETH_ACCOUNT_LOCK_CODE_HASH=<eth account lock code hash>
EXAMPLE_CONTRACT_ADDRESS=<an example test contract deployed address>
```

## test

```sh
    yarn test
```

## start a minimal dapp example

```sh
    yarn example
```

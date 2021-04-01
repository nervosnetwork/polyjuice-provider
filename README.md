# Polyjuice Http Provider

a godwoken-compatible http provider for web3.js.

now you can call your smart-contract on godwoken with metamask and eth address.

## init web3

Before:

```js
import Web3 from 'web3';

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
```

Now:

```js
import Web3 from 'web3';
import PolyjuiceHttpProvider from './PolyjuiceHttpProvider';

var web3 = new Web3(new PolyjuiceHttpProvider('http://localhost:8545', GodwokenOption));
```

## init contract instance

Before:

```js
import Web3 from 'web3';

var provider = new Web3.providers.HttpProvider('http://localhost:8545');
var web3 = new Web3(provider);

var contract = web3.eth.Contract(abi, contract_address);
```

Now:

```js
import Web3 from 'web3';
import PolyjuiceHttpProvider from './PolyjuiceHttpProvider';

var provider = new PolyjuiceHttpProvider('http://localhost:8545', GodwokenOption);
var web3 = new Web3(provider);

var contract = web3.eth.Contract(abi, contract_address);
```

for ```GodwokenOption```: see [here](/src/util.ts#L30-L36).

basically, PolyjuiceHttpProvider is just a extended class of [[web3-providers-http](https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http)]

## getting started

```sh
    git clone https://github.com/RetricSu/polyjuice-providers-http.git
    cd polyjuice-providers-http
    yarn 
```

build browser version:

```sh
    yarn build
```

build node version:

```sh
    yarn build:node
```

test:

```sh
    yarn test
```

## start a minimal dapp example

```sh
    yarn example
```

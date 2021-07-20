# @polyjuice-provider/ethers

this is a sub-module of @polyjuice-provider.

## Install

```sh
yarn add @polyjuice-provider/ethers 
```

or

```sh
npm install --save @polyjuice-provider/ethers
```

## Usage

once you install this module, then you got two main tools to run with `ethers` for compatibility:

- PolyjuiceJsonRpcProvider (compatible version of [JsonRpcProvider](https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts))
- PolyjuiceWallet (compatible version of [Wallet](https://github.com/ethers-io/ethers.js/tree/master/packages/wallet))

replacement:

```ts
new providers.JsonRpcProvider(..) ---> new PolyjuiceJsonRpcProvider(...)
new Wallet(..) --> new PolyjuiceWallet(...)
```

### Example: Deploy contract

```ts
import { ContractFactory } from "ethers";
import { PolyjuiceWallet, PolyjuiceConfig, PolyjuiceJsonRpcProvider } from "@polyjuice-provider/ethers";

const polyjuice_config: PolyjuiceConfig = {
  rollupTypeHash: 'godwoken rollup type hash', 
  ethAccountLockCodeHash: 'godwoken eth account lock code hash', 
  abiItems: ['your abi items array'], // this is optional
  web3Url: 'godwoken web3 rpc url', 
};
const rpc = new PolyjuiceJsonRpcProvider(polyjuice_config, PolyjuiceConfig.web3Url); 
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

## Migrate dapp

if your dapp are using `ethers` and `metamask`, you can simply change it like following:

```ts
import { providers, ContractFactory, Signer } from "ethers";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";

const polyjuiceConfig: PolyjuiceConfig = {
  rollupTypeHash: 'godwoken rollup type hash', 
  ethAccountLockCodeHash: 'godwoken eth account lock code hash', 
  abiItems: ['your abi items array'], // this is optional
  web3Url: 'godwoken web3 rpc url', 
};

export async function createEthersSignerWithMetamask(): Promise<
  Signer | undefined
> {
  if ((window as any).ethereum) {
    const provider = new providers.Web3Provider(
      new PolyjuiceHttpProvider(polyjuiceConfig.web3Url!, polyjuiceConfig)
    );
    let signer;

    try {
      await (window as any).ethereum.enable();
      signer = provider.getSigner((window as any).ethereum.selectedAddress);
    } catch (error) {
      // User denied account access...
      throw error;
    }

    return signer;
  }

  console.error(
    "Non-Ethereum browser detected. You should consider trying MetaMask!"
  );
  return undefined;
}

const signer = await createEthersSignerWithMetamask();
const contract = new ethers.Contract(
  'your contract address',
  'your contract abi',
  signer
);
let overrides = {
  gasLimit: 0x54d30,
  gasPrice: 0x0,
  value: 0x0,
};
const txResponse = await contract.METHOD_NAME(..args, overrides);
console.log(txResponse);
```

known issue:

if you want to use `Metamask` and `ethers.Contract` to deploy contract, then do not use the contract.address as your deployed contract address:

```ts
const deployContractWithEtherContractFactory = async () => {
  const signer = await createEthersSignerWithMetamask();
  
  const contractDeployer = new ContractFactory(
    'your contract abi',
    'your contract compiled bytecode',
    signer
  );
  let overrides = {
    gasLimit: 0x54d30,
    gasPrice: 0x0,
    value: 0x0,
  };
  const contract = await contractDeployer.deploy(overrides);
  await contract.deployed();
  // ! please do not use `contract.address` as contractAddress here. 
  // due to an known issue, it is wrong eth address in polyjuice. 
  // instead, you should get address through txReceipt.
  const txReceipt = await rpc.eth_getTransactionReceipt(contract.deployTransaction.hash);
  console.log(`contract address: ${txReceipt.contractAddress)}`);
}
```

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

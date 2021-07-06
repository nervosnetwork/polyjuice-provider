# @polyjuice-provider/ethers

you will need to make the replacement below:

replace

```ts
import { Wallet } from "ethers";
```

with

```ts
import { PolyjuiceWallet } from "@polyjuice-provider/ethers";
```

and use `PolyjuiceWallet` instead of `Wallet` in your code.

replace

```sh
import { providers } from "ethers";
providers.JsonRpcProvider
```

with

```sh
import { PolyjuiceJsonRpcProvider } from "@polyjuice-provider/ethers";
```

and use `PolyjuiceJsonRpcProvider` instead of `JsonRpcProvider` in your code.

example:

```ts
import { ContractFactory } from "ethers";
import { PolyjuiceWallet, PolyjuiceConfig, PolyjuiceJsonRpcProvider } from "@polyjuice-provider/ethers";

export const rpc = new PolyjuiceJsonRpcProvider('godwoken web3 rpc url'); // normally it is http://localhost:8024;
const polyjuice_config: PolyjuiceConfig = {
  godwokerOption: {
    godwoken: {
      rollup_type_hash: 'godwoken rollup type hash', // you can find this value by opening your browser to access http://localhost:6101/get_rollup_type_hash,
      eth_account_lock: {
        code_hash: 'godwoken eth lock code hash', //  you can find this value by opening your browser to access http://localhost:6101/get_eth_acccount_lock
        hash_type: "type",
      },
    },
  },
  web3RpcUrl: process.env.RPC_URL!, // normally it is http://localhost:8024;
};

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

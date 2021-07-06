import test from "ava";
import Web3 from "web3";
import { PolyjuiceConfig, PolyjuiceHttpProvider } from "../lib/index";
import { AbiItems } from "@polyjuice-provider/base";
import { PolyjuiceAccounts } from "../lib/accounts";

const ETH_ADDRESS = "0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A";
const PRIVATE_KEY =
  "0xcd277d1a87ffc737b01f6f079a721fe34910b673755130399ea379200a6ef9f2";
const EXAMPLE_CONTRACT = {
  contractName: "SimpleStorageV2",
  abi: [
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "newValue",
          type: "address",
        },
      ],
      name: "set",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "get",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address[]",
          name: "newValue",
          type: "address[]",
        },
      ],
      name: "setArray",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "getArray",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ],
};

var web3: Web3;
var polyjuiceAccounts: PolyjuiceAccounts;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config: PolyjuiceConfig  = {
    rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
    abiItems: EXAMPLE_CONTRACT.abi as AbiItems,
    web3Url: godwoken_rpc_url 
  };
  const provider = new PolyjuiceHttpProvider(
    godwoken_rpc_url,
    provider_config
  );
  polyjuiceAccounts = new PolyjuiceAccounts(provider_config);
  web3 = new Web3(provider);
  web3.eth.accounts.wallet.add(polyjuiceAccounts.privateKeyToAccount(PRIVATE_KEY));
});

test.serial("account-sign-tx", async (t) => {
  const simplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS
  );
  const txRes = await simplestorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});
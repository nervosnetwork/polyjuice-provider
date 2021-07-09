const test = require("ava");
import Web3 from "web3";
import { PolyjuiceConfig, PolyjuiceHttpProviderCli } from "../lib/index";
import { GodwokerOption, AbiItems } from "@polyjuice-provider/base";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

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
var provider;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config: PolyjuiceConfig  = {
    rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
    abiItems: EXAMPLE_CONTRACT.abi as AbiItems,
    web3Url: godwoken_rpc_url 
  };
  provider = new PolyjuiceHttpProviderCli(
    godwoken_rpc_url,
    provider_config,
    PRIVATE_KEY
  );
});

test.serial("sign message method", (t) => {
  const message =
    "0x61c0994ff56d3cc888e41ee4a45080a431ffa84979ccf936b3ecc4887d7e9324";
  const sig = provider.signer.sign_with_private_key(message, ETH_ADDRESS);
  t.is(
    sig,
    "0x7de886aaeb6c6df85a6c5a7603bdfe1dab36da558f9460f8f2fe201b1053ed111aaec1cf024eada7393f0dec80587398ec5d83f8976eaa0662c3b8b4ad9ee9601c"
  );
});

test.serial("proxy rpc: send_transaction", async (t) => {
  if (process.env.MODE === "browser") {
    // skip test, the last test in node env might not be done, will cause duplicated-tx
    return t.pass();
  }

  const web3 = new Web3(provider);
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

test.serial("proxy rpc: call_transaction", async (t) => {
  const web3 = new Web3(provider);
  const simplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS
  );
  const result = await simplestorageV2.methods
    .get()
    .call({ from: ETH_ADDRESS });
  console.log(result);
  t.is(result.slice(0, 2), "0x");
  t.is(result.length, 42);
});

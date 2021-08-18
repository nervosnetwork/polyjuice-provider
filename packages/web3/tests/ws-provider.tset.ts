import test from "ava";
import Web3 from "web3";
import { PolyjuiceWebsocketProvider } from "../lib/ws-providers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceAccounts } from "../lib/accounts";

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
var web3;
var polyjuiceAccounts: PolyjuiceAccounts;

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const web3WsRpc = process.env.WEB3_WS_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: EXAMPLE_CONTRACT.abi as AbiItems,
    web3Url: web3Rpc,
  };
  provider = new PolyjuiceWebsocketProvider(web3WsRpc, polyjuiceConfig);
  web3 = new Web3(provider);
  polyjuiceAccounts = new PolyjuiceAccounts(polyjuiceConfig, provider);
});

test.serial("test-ws-provider-with-account", async (t) => {
  web3.eth.accounts = polyjuiceAccounts;
  web3.eth.Contract._ethAccounts = web3.eth.accounts;
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);

  const simpleStorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS!
  );

  const id = await web3.eth.net.getId();
  const txRes = await simpleStorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });

  t.is(id, 1024777);
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

import test from "ava";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceAccounts, PolyjuiceHttpProvider } from "../lib/index";
import blockParameterArtifact from "../../../contract-testcase/BlockParameter.json";
import Web3 from "web3";
const Contract = require("web3-eth-contract");

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

let web3;
let provider: PolyjuiceHttpProvider;
let polyjuiceAccounts: PolyjuiceAccounts;

const ethAddressFromPrivateKey = process.env.ETH_ADDRESS;

let contractAddress;
let deployBlockNumber;

test.before(() => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: blockParameterArtifact.abi as AbiItems,
    web3Url: web3Rpc,
  };
  provider = new PolyjuiceHttpProvider(web3Rpc, polyjuiceConfig);
  polyjuiceAccounts = new PolyjuiceAccounts(polyjuiceConfig);
  polyjuiceAccounts.setAbi(blockParameterArtifact.abi as AbiItems);
  web3 = new Web3(provider);
  web3.eth.accounts = polyjuiceAccounts;
  web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);
});

test.serial("deploy_test_contract", async (t) => {
  const deployTx = new Contract(blockParameterArtifact.abi as AbiItems)
    .deploy({
      data: blockParameterArtifact.bytecode,
      arguments: [],
    })
    .send({
      from: ethAddressFromPrivateKey,
      gasPrice: "0x00",
    });
  const contract = await deployTx;
  t.is(contract.options.address.slice(0, 2), "0x");
  contractAddress = contract.options.address;
  deployBlockNumber = await web3.eth.getBlockNumber();
});

test.serial("call getBlockNumber without blockTag", async (t) => {
  const contract = new Contract(blockParameterArtifact.abi, contractAddress);
  const latestBlockNumber = await web3.eth.getBlockNumber();
  const expectPendingBlockNumber = latestBlockNumber + 1;
  // default BlockTag should use "latest",
  // which is the same with "pending" in godwoken
  const pendingBlockNumber = await contract.methods.currentBlockNumber().call();
  t.is(expectPendingBlockNumber.toString(), pendingBlockNumber.toString());
});

test.serial("call getBlockNumber at latest", async (t) => {
  const contract = new Contract(blockParameterArtifact.abi, contractAddress);
  const latestBlockNumber = await web3.eth.getBlockNumber();
  const expectPendingBlockNumber = latestBlockNumber + 1;
  // "latest" is the same with "pending" in godwoken
  const pendingBlockNumber = await contract.methods
    .currentBlockNumber()
    .call({}, "latest");
  t.is(expectPendingBlockNumber.toString(), pendingBlockNumber.toString());
});

test.serial("call getBlockNumber at pending", async (t) => {
  const contract = new Contract(blockParameterArtifact.abi, contractAddress);
  const latestBlockNumber = await web3.eth.getBlockNumber();
  const expectPendingBlockNumber = latestBlockNumber + 1;
  const pendingBlockNumber = await contract.methods
    .currentBlockNumber()
    .call({}, "pending");
  t.is(expectPendingBlockNumber.toString(), pendingBlockNumber.toString());
});

test.serial("call getBlockNumber at second latest block", async (t) => {
  // wait some blocks for contract deployment confirm,
  // otherwise the last test might call a block where contract is not deployed yet
  while (true) {
    const currentBlockNumber = await web3.eth.getBlockNumber();
    if (currentBlockNumber < deployBlockNumber + 3) {
      await asyncSleep(20000);
      continue;
    } else {
      break;
    }
  }
  const contract = new Contract(blockParameterArtifact.abi, contractAddress);
  let secondLatestBlockNumber = (await web3.eth.getBlockNumber()) - 1;
  secondLatestBlockNumber =
    secondLatestBlockNumber > 0 ? secondLatestBlockNumber : 0;
  const hexBlockTag = "0x" + secondLatestBlockNumber.toString(16);
  const blockNumber = await contract.methods
    .currentBlockNumber()
    .call({}, hexBlockTag);
  t.is(secondLatestBlockNumber.toString(), blockNumber.toString());
});

function asyncSleep(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
}

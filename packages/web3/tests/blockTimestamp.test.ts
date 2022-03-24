import test from "ava";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceAccounts, PolyjuiceHttpProvider } from "../lib/index";
import blockTimestampArtifact from "../../../contract-testcase/BlockTimestamp.json";
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
    abiItems: blockTimestampArtifact.abi as AbiItems,
    web3Url: web3Rpc,
  };
  provider = new PolyjuiceHttpProvider(web3Rpc, polyjuiceConfig);
  polyjuiceAccounts = new PolyjuiceAccounts(polyjuiceConfig);
  polyjuiceAccounts.setAbi(blockTimestampArtifact.abi as AbiItems);
  web3 = new Web3(provider);
  web3.eth.accounts = polyjuiceAccounts;
  web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);
});

test.serial("deploy_test_contract", async (t) => {
  const deployTx = new Contract(blockTimestampArtifact.abi as AbiItems)
    .deploy({
      data: blockTimestampArtifact.bytecode,
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

test.serial("submit tx to setBlockTimestamp", async (t) => {
  const contract = new Contract(blockTimestampArtifact.abi, contractAddress);
  const txRes = await contract.methods
    .setHello()
    .send({ from: ethAddressFromPrivateKey, gas: "0x30d40", gasPrice: "0x00" });
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

test.serial(
  "call getDiffTime at latest blockTag, result should >= 0",
  async (t) => {
    const contract = new Contract(blockTimestampArtifact.abi, contractAddress);
    const diff = await contract.methods.getDiffTime().call({}, "latest");
    t.true(diff >= 0n);
  }
);

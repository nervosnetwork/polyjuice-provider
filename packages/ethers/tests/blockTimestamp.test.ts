import test from "ava";
import { Contract, ContractFactory } from "ethers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceWallet, PolyjuiceJsonRpcProvider } from "../lib/index";
import blockTimestampArtifact from "../../../contract-testcase/BlockTimestamp.json";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

let provider: PolyjuiceJsonRpcProvider;
let deployer: PolyjuiceWallet;

let contractAddress;

test.before(() => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: blockTimestampArtifact.abi as AbiItems,
    web3Url: web3Rpc,
  };
  provider = new PolyjuiceJsonRpcProvider(polyjuiceConfig, web3Rpc);
  deployer = new PolyjuiceWallet(
    process.env.PRIVATE_KEY,
    polyjuiceConfig,
    provider
  );
});

test.serial("deploy_test_contract", async (t) => {
  const implementationFactory = new ContractFactory(
    blockTimestampArtifact.abi,
    blockTimestampArtifact.bytecode,
    deployer
  );
  const tx = implementationFactory.getDeployTransaction();
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  const txReceipt = await res.wait();
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  contractAddress = txReceipt.contractAddress;
});

test.serial("submit tx to setBlockTimestamp", async (t) => {
  const contract = new Contract(
    contractAddress,
    blockTimestampArtifact.abi,
    deployer
  );
  const res = await contract.setHello();
  t.is(typeof res.wait, "function");
  const txReceipt = await res.wait();
  t.not(txReceipt, undefined);
});

test.serial(
  "call getDiffTime at latest blockTag, result should >= 0",
  async (t) => {
    const contract = new Contract(
      contractAddress,
      blockTimestampArtifact.abi,
      deployer
    );
    const diff = await contract.getDiffTime({
      blockTag: "latest",
    });
    t.true(diff >= 0n);
  }
);

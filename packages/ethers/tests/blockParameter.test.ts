import test from "ava";
import { Contract, ContractFactory } from "ethers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceWallet, PolyjuiceJsonRpcProvider } from "../lib/index";
import blockParameterArtifact from "../../../contract-testcase/BlockParameter.json";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

let provider: PolyjuiceJsonRpcProvider;
let deployer: PolyjuiceWallet;

let contractAddress;

test.before(() => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: blockParameterArtifact.abi as AbiItems,
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
    blockParameterArtifact.abi,
    blockParameterArtifact.bytecode,
    deployer
  );
  const tx = implementationFactory.getDeployTransaction();
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  // wait 2 blocks for confirm,
  // otherwise the last test might call a block where contract is not deployed yet
  const txReceipt = await res.wait(2);
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  contractAddress = txReceipt.contractAddress;
});

test.serial("call getBlockNumber without blockTag", async (t) => {
  const contract = new Contract(
    contractAddress,
    blockParameterArtifact.abi,
    deployer
  );
  const latestBlockNumber = await contract.provider.getBlockNumber();
  const expectPendingBlockNumber = latestBlockNumber + 1;
  // default BlockTag should use "latest",
  // which is the same with "pending" in godwoken
  const pendingBlockNumber = await contract.currentBlockNumber();
  t.is(expectPendingBlockNumber.toString(), pendingBlockNumber.toString());
});

test.serial("call getBlockNumber at latest", async (t) => {
  const contract = new Contract(
    contractAddress,
    blockParameterArtifact.abi,
    deployer
  );
  const latestBlockNumber = await contract.provider.getBlockNumber();
  const expectPendingBlockNumber = latestBlockNumber + 1;
  // "latest" is the same with "pending" in godwoken
  const pendingBlockNumber = await contract.currentBlockNumber({
    blockTag: "latest",
  });
  t.is(expectPendingBlockNumber.toString(), pendingBlockNumber.toString());
});

test.serial("call getBlockNumber at pending", async (t) => {
  const contract = new Contract(
    contractAddress,
    blockParameterArtifact.abi,
    deployer
  );
  const latestBlockNumber = await contract.provider.getBlockNumber();
  const expectPendingBlockNumber = latestBlockNumber + 1;
  const pendingBlockNumber = await contract.currentBlockNumber({
    blockTag: "pending",
  });
  t.is(expectPendingBlockNumber.toString(), pendingBlockNumber.toString());
});

test.serial("call getBlockNumber at second latest block", async (t) => {
  const contract = new Contract(
    contractAddress,
    blockParameterArtifact.abi,
    deployer
  );
  let secondLatestBlockNumber = (await contract.provider.getBlockNumber()) - 1;
  secondLatestBlockNumber =
    secondLatestBlockNumber > 0 ? secondLatestBlockNumber : 0;
  const hexBlockTag = "0x" + secondLatestBlockNumber.toString(16);
  const blockNumber = await contract.currentBlockNumber({
    blockTag: hexBlockTag,
  });
  t.is(secondLatestBlockNumber.toString(), blockNumber.toString());
});

test.serial(
  "compare getBlockTimestamp at pending and second latest block",
  async (t) => {
    const contract = new Contract(
      contractAddress,
      blockParameterArtifact.abi,
      deployer
    );
    const latestBlockNumber = await contract.provider.getBlockNumber();
    const secondLatestBlockNumber = latestBlockNumber - 1;
    const pendingBlockTimestamp = await contract.currentTimestamp({
      blockTag: "pending",
    });
    const secondLatestBlockTimestamp = await contract.currentTimestamp({
      blockTag: "0x" + secondLatestBlockNumber.toString(16),
    });
    t.true(pendingBlockTimestamp - secondLatestBlockTimestamp > 0);
  }
);

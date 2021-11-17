import test from "ava";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import {
  PolyjuiceWallet,
  PolyjuiceJsonRpcProvider,
  PolyjuiceWebsocketProvider,
} from "../lib/index";
import crypto from "crypto";
import Web3 from "web3";
import erc20TestContract from "../../../contract-testcase/erc20.json";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const ABI = erc20TestContract.abi;
const BYTECODE = erc20TestContract.bytecode;

let provider: PolyjuiceJsonRpcProvider;
let wsProvider: PolyjuiceWebsocketProvider;
let deployer: PolyjuiceWallet;
let wsDeployer: PolyjuiceWallet;
let contractAddress: string;

let ethAddressFromPrivateKey = process.env.ETH_ADDRESS;
let testAddressArray = [
  genNewEthAddress(),
  "0x0000000000000000000000000000000000000000",
  ethAddressFromPrivateKey,
];

const ERC20_NAME = "test";
const ERC20_SYMBOL = "tt";
const ERC20_TOTAL_SUPPLY = "160000000000000000000000000000";
const ERC20_SUDT_ID = 1;

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const web3WsRpc = process.env.WEB3_WS_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: ABI as AbiItems,
    web3Url: web3Rpc,
  };
  provider = new PolyjuiceJsonRpcProvider(polyjuiceConfig, web3Rpc);
  deployer = new PolyjuiceWallet(
    process.env.PRIVATE_KEY,
    polyjuiceConfig,
    provider
  );
  wsProvider = new PolyjuiceWebsocketProvider(polyjuiceConfig, web3WsRpc);
  wsDeployer = new PolyjuiceWallet(
    process.env.PRIVATE_KEY,
    polyjuiceConfig,
    wsProvider
  );
});

test.serial("deploy_example_contract", async (t) => {
  const implementationFactory = new ContractFactory(ABI, BYTECODE, deployer);

  const tx = implementationFactory.getDeployTransaction(
    ERC20_NAME,
    ERC20_SYMBOL,
    ERC20_TOTAL_SUPPLY,
    ERC20_SUDT_ID
  );
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  const txReceipt = await res.wait();
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  contractAddress = txReceipt.contractAddress;
  testAddressArray.push(contractAddress);
});

test.serial("call erc20 info", async (t) => {
  const contract = new Contract(contractAddress, ABI, deployer);
  const totalSupply: BigNumber = await contract.callStatic.totalSupply();
  const sudtId: BigNumber = await contract.callStatic.sudtId();
  const name = await contract.callStatic.name();
  const symbol = await contract.callStatic.symbol();
  const decimals: BigNumber = await contract.callStatic.decimals();
  const notExistAddressBalance: BigNumber = await contract.callStatic.balanceOf(
    testAddressArray[0]
  );
  const zeroAddressBalance: BigNumber = await contract.callStatic.balanceOf(
    testAddressArray[1]
  );
  const realAddressBalance: BigNumber = await contract.callStatic.balanceOf(
    testAddressArray[2]
  );
  const contractAddressBalance: BigNumber = await contract.callStatic.balanceOf(
    testAddressArray[3]
  );

  t.is(totalSupply.toString(), ERC20_TOTAL_SUPPLY);
  t.is(sudtId.toString(), ERC20_SUDT_ID.toString());
  t.is(name, ERC20_NAME);
  t.is(symbol, ERC20_SYMBOL);
  t.is(decimals.toString(), "18");

  t.is(notExistAddressBalance.toString(), "0");
  t.is(zeroAddressBalance.toString(), "0");
  t.not(realAddressBalance.toString(), "0");
  t.is(contractAddressBalance.toString(), "0");
});

test.serial("call erc20 for transfer", async (t) => {
  const contract = new Contract(contractAddress, ABI, deployer);

  const amount = "1000000000";
  const to = testAddressArray[0];
  const beforeBalance: BigNumber = await contract.callStatic.balanceOf(to);

  const res = await contract.transfer(to, amount);
  t.is(typeof res.wait, "function");
  const txReceipt = await res.wait();
  t.not(txReceipt, undefined);

  const afterBalance: BigNumber = await contract.callStatic.balanceOf(to);
  t.deepEqual(beforeBalance.add(amount), afterBalance);
});

function genNewEthAddress() {
  return Web3.utils.toChecksumAddress(crypto.randomBytes(20).toString("hex"));
}

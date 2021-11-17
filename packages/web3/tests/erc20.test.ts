import test from "ava";
import Web3 from "web3";
import crypto from "crypto";
import {
  PolyjuiceHttpProvider,
  PolyjuiceAccounts,
  PolyjuiceHttpProviderCli,
  PolyjuiceWebsocketProvider,
} from "../lib/index";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import erc20TestContract from "../../../contract-testcase/erc20.json";

const Contract = require("web3-eth-contract");

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const ABI = erc20TestContract.abi;
const BYTECODE = erc20TestContract.bytecode;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

let ethAddressFromPrivateKey = process.env.ethAddressFromPrivateKey;
let testAddressArray = [
  genNewEthAddress(),
  "0x0000000000000000000000000000000000000000",
  ethAddressFromPrivateKey,
];

const ERC20_NAME = "test";
const ERC20_SYMBOL = "tt";
const ERC20_TOTAL_SUPPLY = "160000000000000000000000000000";
const ERC20_SUDT_ID = 1;

let provider: PolyjuiceHttpProvider,
  cliProvider: PolyjuiceHttpProviderCli,
  wsProvider: PolyjuiceWebsocketProvider,
  polyjuiceAccounts: PolyjuiceAccounts,
  wsPolyjuiceAccounts: PolyjuiceAccounts;
let web3, cliWeb3: Web3, wsWeb3;
let contractAddress: string;

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const web3WsRpc = process.env.WEB3_WS_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: ABI as AbiItems,
    web3Url: web3Rpc,
  };

  provider = new PolyjuiceHttpProvider(web3Rpc, polyjuiceConfig);
  cliProvider = new PolyjuiceHttpProviderCli(
    web3Rpc,
    polyjuiceConfig,
    PRIVATE_KEY
  );
  wsProvider = new PolyjuiceWebsocketProvider(web3WsRpc, polyjuiceConfig);

  polyjuiceAccounts = new PolyjuiceAccounts(polyjuiceConfig);
  wsPolyjuiceAccounts = new PolyjuiceAccounts(polyjuiceConfig);

  web3 = new Web3(provider);
  cliWeb3 = new Web3(cliProvider);
  wsWeb3 = new Web3(wsProvider as any);
});

//# account test
test.serial("deploy example contract", async (t) => {
  web3.eth.accounts = polyjuiceAccounts;
  web3.eth.Contract._accounts = web3.eth.accounts;
  web3.eth.accounts.wallet.add(PRIVATE_KEY);

  const myContract = await web3.eth.Contract(ABI);
  const contractInstance = myContract
    .deploy({
      data: BYTECODE,
      arguments: [ERC20_NAME, ERC20_SYMBOL, ERC20_TOTAL_SUPPLY, ERC20_SUDT_ID],
    })
    .send({
      gas: "0x30d40",
      gasPrice: "0x00",
    });
  t.is(contractInstance._address.slice(0, 2), "0x");
  contractAddress = contractInstance._address;
});

test.serial("call erc20 info", async (t) => {
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);

  const contract = new Contract(ABI as AbiItems, contractAddress);

  const totalSupply = await contract.methods.totalSupply().call();
  const sudtId = await contract.methods.sudtId().call();
  const name = await contract.methods.name().call();
  const symbol = await contract.methods.symbol().call();
  const decimals = await contract.methods.decimals().call();
  const notExistAddressBalance = await contract.methods
    .balanceOf(testAddressArray[0])
    .call();
  const zeroAddressBalance = await contract.methods
    .balanceOf(testAddressArray[1])
    .call();
  const realAddressBalance = await contract.methods
    .balanceOf(testAddressArray[2])
    .call();
  const contractAddressBalance = await contract.methods
    .balanceOf(testAddressArray[3])
    .call();

  t.is(totalSupply, ERC20_TOTAL_SUPPLY);
  t.is(sudtId, ERC20_SUDT_ID);
  t.is(name, ERC20_NAME);
  t.is(symbol, ERC20_SYMBOL);
  t.is(decimals, 18);

  t.is(notExistAddressBalance, 0);
  t.is(zeroAddressBalance, 0);
  t.not(realAddressBalance, 0);
  t.is(contractAddressBalance, 0);
});

test.serial("call erc20 info", async (t) => {
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);

  const contract = new Contract(ABI as AbiItems, contractAddress);

  const amount = 10_0000_0000;
  const to = testAddressArray[0];
  const beforeBalance = await contract.methods.balanceOf(to).call();

  const txRes = await contract.methods
    .transfer(ethAddressFromPrivateKey)
    .send({ from: ethAddressFromPrivateKey, gas: "0x30d40", gasPrice: "0x00" });

  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);

  const afterBalance = await contract.methods.balanceOf(to).call();
  t.is(amount, afterBalance - beforeBalance);
});

function genNewEthAddress() {
  return Web3.utils.toChecksumAddress(crypto.randomBytes(20).toString("hex"));
}

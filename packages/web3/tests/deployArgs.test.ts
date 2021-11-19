import test from "ava";
import Web3 from "web3";
import { PolyjuiceHttpProvider, PolyjuiceAccounts } from "../lib/index";
import { Abi, AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import anotherContractAsAddressTester from "../../../contract-testcase/ErrorReceipt.json";
import deployArgsTestContract from "../../../contract-testcase/DeployArgs.json";
import { genNewEthAddress } from "../../../contract-testcase/helper";
const Contract = require("web3-eth-contract");

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const ABI = deployArgsTestContract.abi as AbiItems;
const BYTECODE = deployArgsTestContract.bytecode;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

let ethAddressFromPrivateKey = process.env.ETH_ADDRESS;
let testAddressArray = [
  genNewEthAddress(),
  "0x0000000000000000000000000000000000000000",
  ethAddressFromPrivateKey,
];

let contractAddress: string;
let contractDeployArgs: any[];

let provider: PolyjuiceHttpProvider, polyjuiceAccounts: PolyjuiceAccounts;
let web3: Web3;

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: ABI as AbiItems,
    web3Url: web3Rpc,
  };

  provider = new PolyjuiceHttpProvider(web3Rpc, polyjuiceConfig);
  polyjuiceAccounts = new PolyjuiceAccounts(polyjuiceConfig);
  web3 = new Web3(provider);
  web3.eth.accounts = polyjuiceAccounts;
  web3.eth.accounts.wallet.add(PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);
});

test.serial("deploy address-tester-contract", async (t) => {
  const deployTx = new Contract(anotherContractAsAddressTester.abi as AbiItems)
    .deploy({
      data: anotherContractAsAddressTester.bytecode,
      arguments: [],
    })
    .send({
      from: ethAddressFromPrivateKey,
      gasPrice: "0x00",
    });
  const contract = await deployTx;

  t.is(contract.options.address.slice(0, 2), "0x");
  contractAddress = contract.options.address;
  testAddressArray.push(contractAddress);
});

test.serial("deploy example contract", async (t) => {
  const constructorArgs = [1, testAddressArray];
  contractDeployArgs = constructorArgs;
  const deployTx = new Contract(ABI)
    .deploy({
      data: BYTECODE,
      arguments: constructorArgs,
    })
    .send({
      from: ethAddressFromPrivateKey,
      gasPrice: "0x00",
    });
  const contract = await deployTx;

  t.is(contract.options.address.slice(0, 2), "0x");
  contractAddress = contract.options.address;
});

test.serial(
  "call example contract to show deploy arguments is not supporting automatically address-converting",
  async (t) => {
    const contract = new web3.eth.Contract(ABI as AbiItems, contractAddress);
    const value: string = await contract.methods.getValue().call();
    t.is(value, contractDeployArgs[0].toString());

    // the return addressList should be the same with the contract constructor arguments
    // since the address converting for deployment arguments
    // are not supported in providers for now.
    // therefor, when you call contract method to return addressList,
    // the address-type converting from polyjuiceAddress to ethAddress will go wrong,
    // thus throw error is expected
    const callRevert = async () => {
      try {
        await contract.methods.getAddressList().call();
      } catch (error) {
        throw new Error(error.message);
      }
    };
    const callRevertRunResult = await t.throwsAsync(callRevert);
    t.true(
      callRevertRunResult.message.includes(
        "result from jsonRPC poly_getEthAddressByGodwokenShortAddress is null or undefined. unable to fetch eth address from"
      )
    );
    const errorAddress = callRevertRunResult.message.slice(
      callRevertRunResult.message.length - 42,
      callRevertRunResult.message.length
    );
    t.true(testAddressArray.includes(errorAddress));
  }
);

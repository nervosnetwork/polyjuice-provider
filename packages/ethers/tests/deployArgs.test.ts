import test from "ava";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceWallet, PolyjuiceJsonRpcProvider } from "../lib/index";
import anotherContractAsAddressTester from "../../../contract-testcase/ErrorReceipt.json";
import deployArgsTestContract from "../../../contract-testcase/DeployArgs.json";
import { genNewEthAddress } from "../../../contract-testcase/helper";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const ABI = deployArgsTestContract.abi;
const BYTECODE = deployArgsTestContract.bytecode;

let provider: PolyjuiceJsonRpcProvider;
let deployer: PolyjuiceWallet;
let contractAddressFromBadDeployment: string;
let contractAddressFromGoodDeployment: string;
let contractDeployArgs: any[];

let ethAddressFromPrivateKey = process.env.ETH_ADDRESS;
let testAddressArray = [
  genNewEthAddress(),
  "0x0000000000000000000000000000000000000000",
  ethAddressFromPrivateKey,
];

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
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
});

test.serial("prepare one contract address by deploying", async (t) => {
  const implementationFactory = new ContractFactory(
    anotherContractAsAddressTester.abi,
    anotherContractAsAddressTester.bytecode,
    deployer
  );
  const tx = implementationFactory.getDeployTransaction();
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  const txReceipt = await res.wait();
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  testAddressArray.push(txReceipt.contractAddress);
});

test.serial("deploy example contract without converting address", async (t) => {
  const constructorArgs = [1, testAddressArray];
  contractDeployArgs = constructorArgs;
  const implementationFactory = new ContractFactory(ABI, BYTECODE, deployer);
  const tx = implementationFactory.getDeployTransaction(...constructorArgs);
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  const txReceipt = await res.wait();
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  contractAddressFromBadDeployment = txReceipt.contractAddress;
});

test.serial(
  "call example contract to show deploy arguments is not supporting automatically address-converting",
  async (t) => {
    const contract = new Contract(
      contractAddressFromBadDeployment,
      ABI,
      deployer
    );
    const value: BigNumber = await contract.callStatic.getValue();
    t.is(value.toString(), contractDeployArgs[0].toString());

    // the return addressList should be the same with the contract constructor arguments
    // since the address converting for deployment arguments
    // are not supported in providers for now.
    // therefor, when you call contract method to return addressList,
    // the address-type converting from polyjuiceAddress to ethAddress will go wrong,
    // thus throw error is expected
    const callRevert = async () => {
      try {
        await contract.callStatic.getAddressList();
      } catch (error) {
        throw new Error(error.message);
      }
    };
    const callRevertRunResult = await t.throwsAsync(callRevert);
    t.true(
      callRevertRunResult.message.includes(
        "result from jsonRPC poly_getEthAddressByGodwokenShortAddress is null or undefined. "
      )
    );
    const errorAddress = callRevertRunResult.message.slice(-42);
    t.true(testAddressArray.includes(errorAddress));
  }
);

test.serial("deploy example contract in the right way", async (t) => {
  const constructorArgs = [1, testAddressArray];
  contractDeployArgs = constructorArgs;
  const implementationFactory = new ContractFactory(ABI, BYTECODE, deployer);
  // you need this extra steps to convert your constructor arguments
  // for deploying contract otherwise the address will be the
  const newConstructorArgs = await deployer.convertDeployArgs(
    constructorArgs,
    ABI as AbiItems,
    BYTECODE
  );
  t.not(constructorArgs, newConstructorArgs);
  // pass the new args with address converting to deploy contract
  const tx = implementationFactory.getDeployTransaction(...newConstructorArgs);
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  const txReceipt = await res.wait();
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  contractAddressFromGoodDeployment = txReceipt.contractAddress;
});

test.serial(
  "call example contract with good deployment to show deploy arguments supporting automatically address-converting",
  async (t) => {
    const contract = new Contract(
      contractAddressFromGoodDeployment,
      ABI,
      deployer
    );
    const value: BigNumber = await contract.callStatic.getValue();
    t.is(value.toString(), contractDeployArgs[0].toString());

    // the return addressList should be the same with the contract constructor arguments
    const addressList = await contract.callStatic.getAddressList();
    t.deepEqual(addressList, contractDeployArgs[1]);
  }
);

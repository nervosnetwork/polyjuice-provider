import test from "ava";
import { Contract, ContractFactory } from "ethers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import {
  PolyjuiceWallet,
  PolyjuiceJsonRpcProvider,
  PolyjuiceWebsocketProvider,
} from "../lib/index";
import crypto from "crypto";
import Web3 from "web3";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const SimpleStorageV2_ByteCode =
  "0x608060405234801561001057600080fd5b5061040c806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80632801617e146100515780636d4ce63c146100955780639f494991146100df578063d504ea1d14610197575b600080fd5b6100936004803603602081101561006757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506101f6565b005b61009d610239565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610195600480360360208110156100f557600080fd5b810190808035906020019064010000000081111561011257600080fd5b82018360208201111561012457600080fd5b8035906020019184602083028401116401000000008311171561014657600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f820116905080830192505050505050509192919290505050610262565b005b61019f61027c565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b838110156101e25780820151818401526020810190506101c7565b505050509050019250505060405180910390f35b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b806001908051906020019061027892919061030a565b5050565b6060600180548060200260200160405190810160405280929190818152602001828054801561030057602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116102b6575b5050505050905090565b828054828255906000526020600020908101928215610383579160200282015b828111156103825782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055509160200191906001019061032a565b5b5090506103909190610394565b5090565b6103d491905b808211156103d057600081816101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555060010161039a565b5090565b9056fea265627a7a72315820e5de101a155dd99887410de2703d538ff81a88530c31ad8aa76e88a527725ace64736f6c63430005100032";
const SimpleStorageV2_Abi = [
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
];
var provider: PolyjuiceJsonRpcProvider;
var wsProvider: PolyjuiceWebsocketProvider;
var deployer: PolyjuiceWallet;
var wsDeployer: PolyjuiceWallet;
var SimpleStorageV2_Address;

var test_address_array = [
  genNewEthAddress(),
  "0x0000000000000000000000000000000000000000",
  process.env.ETH_ADDRESS,
];

function genNewEthAddress() {
  return Web3.utils.toChecksumAddress(crypto.randomBytes(20).toString("hex"));
}

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const web3WsRpc = process.env.WEB3_WS_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: SimpleStorageV2_Abi as AbiItems,
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

test.serial("import class", (t) => {
  t.not(provider, undefined);
  t.not(deployer, undefined);
});

test.serial("deploy_example_contract", async (t) => {
  const implementationFactory = new ContractFactory(
    SimpleStorageV2_Abi,
    SimpleStorageV2_ByteCode,
    deployer
  );

  const tx = implementationFactory.getDeployTransaction();
  tx.gasPrice = 0;
  tx.gasLimit = 500000;
  const res = await deployer.sendTransaction(tx);
  const txReceipt = await res.wait();
  t.is(txReceipt.contractAddress.slice(0, 2), "0x");
  SimpleStorageV2_Address = txReceipt.contractAddress;
  test_address_array.push(SimpleStorageV2_Address);
});

test.serial("call set not-exist address on contract", async (t) => {
  const simpleStorageV2 = new Contract(
    SimpleStorageV2_Address,
    SimpleStorageV2_Abi,
    deployer
  );
  const res = await simpleStorageV2.set(test_address_array[0]);
  t.is(typeof res.wait, "function");
  const txReceipt = await res.wait();
  t.not(txReceipt, undefined);
});

test.serial("call contract get for not-exist address", async (t) => {
  const simpleStorageV2 = new Contract(
    SimpleStorageV2_Address,
    SimpleStorageV2_Abi,
    deployer
  );

  const address = await simpleStorageV2.callStatic.get();
  t.is(address, test_address_array[0]);
});

test.serial("call set array address on contract", async (t) => {
  const simpleStorageV2 = new Contract(
    SimpleStorageV2_Address,
    SimpleStorageV2_Abi,
    deployer
  );
  const res = await simpleStorageV2.setArray(test_address_array);
  t.is(typeof res.wait, "function");
  const txReceipt = await res.wait();
  t.not(txReceipt, undefined);
  t.is(txReceipt.transactionHash.slice(0, 2), "0x");
});

test.serial("call contract get array address", async (t) => {
  const simpleStorageV2 = new Contract(
    SimpleStorageV2_Address,
    SimpleStorageV2_Abi,
    deployer
  );

  const address_array = await simpleStorageV2.callStatic.getArray();
  t.deepEqual(address_array, test_address_array);
});

test.serial("ws-provider: call set address on contract", async (t) => {
  const simpleStorageV2 = new Contract(
    SimpleStorageV2_Address,
    SimpleStorageV2_Abi,
    wsDeployer
  );
  const res = await simpleStorageV2.set(process.env.ETH_ADDRESS);
  t.is(typeof res.wait, "function");
  const txReceipt = await res.wait();
  t.not(txReceipt, undefined);
});

test.serial("ws-provider: call contract get_address", async (t) => {
  const simpleStorageV2 = new Contract(
    SimpleStorageV2_Address,
    SimpleStorageV2_Abi,
    wsDeployer
  );

  const address = await simpleStorageV2.callStatic.get();
  t.is(address, process.env.ETH_ADDRESS);
});

// test.serial("make a lot of send at serial", async (t) => {
//   const simpleStorageV2 = new Contract(
//     process.env.EXAMPLE_CONTRACT_ADDRESS,
//     SimpleStorageV2_Abi,
//     deployer
//   );
//
//   for(let i=0;i<10;i++){
//     const res = await simpleStorageV2.setArray(test_address_array);
//     t.is(typeof res.wait, "function");
//     const txReceipt = await res.wait();
//     t.not(txReceipt, undefined);
//     t.is(txReceipt.transactionHash.slice(0, 2), "0x");
//     t.pass();
//   }
//
//   t.pass();
// });

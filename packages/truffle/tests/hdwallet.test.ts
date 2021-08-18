import test from "ava";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceHDWalletProvider } from "../src/index";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";
import Web3 from "web3";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const _SimpleStorageV2_ByteCode =
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
const mnemonicPhrase =
  "gentle coffee topic impose couple reunion ask daring boat fresh below retreat";

let provider;
let web3: Web3;

test.before(() => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const polyjuice_config: PolyjuiceConfig = {
    abiItems: SimpleStorageV2_Abi as AbiItems,
    web3Url: godwoken_rpc_url,
  };

  const polyjuiceHttpProvider = new PolyjuiceHttpProvider(
    polyjuice_config.web3Url,
    polyjuice_config
  );

  provider = new PolyjuiceHDWalletProvider(
    [
      {
        mnemonic: mnemonicPhrase,
        providerOrUrl: polyjuiceHttpProvider,
      },
    ],
    polyjuice_config
  );

  web3 = new Web3(provider);
});

test.serial("import class", (t) => {
  t.not(provider, undefined);
});

test.serial("sign tx", async (t) => {
  const txReceipt = await web3.eth.sendTransaction({
    from: process.env.ETH_ADDRESS,
    to: "0x" + "0".repeat(40),
    value: "0x00",
    data: "0x00",
    gas: "0x5def00",
    gasPrice: "0x00",
  });
  t.not(txReceipt, undefined);
  t.is(txReceipt.transactionHash.slice(0, 2), "0x");
});

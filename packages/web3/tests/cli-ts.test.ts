const test = require("ava");
import Web3 from "web3";
import { PolyjuiceConfig, PolyjuiceHttpProviderCli } from "../lib/index";
import { GodwokerOption, AbiItems } from "@polyjuice-provider/base";

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const ETH_ADDRESS = "0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A";
const PRIVATE_KEY =
  "0xcd277d1a87ffc737b01f6f079a721fe34910b673755130399ea379200a6ef9f2";
const EXAMPLE_CONTRACT = {
  contractName: "SimpleStorageV2",
  abi: [
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
  ],
};
var provider;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config: PolyjuiceConfig = {
    rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
    abiItems: EXAMPLE_CONTRACT.abi as AbiItems,
    web3Url: godwoken_rpc_url,
  };
  provider = new PolyjuiceHttpProviderCli(
    godwoken_rpc_url,
    provider_config,
    PRIVATE_KEY
  );
});

test.serial("sign message method", (t) => {
  const message =
    "0x61c0994ff56d3cc888e41ee4a45080a431ffa84979ccf936b3ecc4887d7e9324";
  const sig = provider.signer.sign_with_private_key(message, ETH_ADDRESS);
  t.is(
    sig,
    "0x7de886aaeb6c6df85a6c5a7603bdfe1dab36da558f9460f8f2fe201b1053ed111aaec1cf024eada7393f0dec80587398ec5d83f8976eaa0662c3b8b4ad9ee9601c"
  );
});

test.serial("proxy rpc: send_transaction", async (t) => {
  const web3 = new Web3(provider);
  const simplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS
  );
  const txRes = await simplestorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

test.serial("proxy rpc: call_transaction", async (t) => {
  const web3 = new Web3(provider);
  const simplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS
  );
  const result = await simplestorageV2.methods.get().call();
  console.log(result);
  t.is(result.slice(0, 2), "0x");
  t.is(result.length, 42);
});

test.serial("change abi then send_transaction", async (t) => {
  const BoxContractArtifact = {
    _format: "hh-sol-artifact-1",
    contractName: "Box",
    sourceName: "contracts/Box.sol",
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "newValue",
            type: "uint256",
          },
        ],
        name: "store",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "value",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    bytecode:
      "0x608060405234801561001057600080fd5b5061012c806100206000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80633fa4f2451460375780636057361d146051575b600080fd5b603d6069565b6040516048919060bf565b60405180910390f35b6067600480360381019060639190608c565b606f565b005b60005481565b8060008190555050565b60008135905060868160e2565b92915050565b600060208284031215609d57600080fd5b600060a9848285016079565b91505092915050565b60b98160d8565b82525050565b600060208201905060d2600083018460b2565b92915050565b6000819050919050565b60e98160d8565b811460f357600080fd5b5056fea264697066735822122018acbfb64cb7fec944af4a19d7713a95b22bc970b54ea8b247b407b117c3a28664736f6c63430008030033",
    deployedBytecode:
      "0x6080604052348015600f57600080fd5b506004361060325760003560e01c80633fa4f2451460375780636057361d146051575b600080fd5b603d6069565b6040516048919060bf565b60405180910390f35b6067600480360381019060639190608c565b606f565b005b60005481565b8060008190555050565b60008135905060868160e2565b92915050565b600060208284031215609d57600080fd5b600060a9848285016079565b91505092915050565b60b98160d8565b82525050565b600060208201905060d2600083018460b2565b92915050565b6000819050919050565b60e98160d8565b811460f357600080fd5b5056fea264697066735822122018acbfb64cb7fec944af4a19d7713a95b22bc970b54ea8b247b407b117c3a28664736f6c63430008030033",
    linkReferences: {},
    deployedLinkReferences: {},
  };
  provider.setAbi(BoxContractArtifact.abi);
  let web3 = new Web3(provider);
  // const deployTxReceipt = await web3.eth.sendTransaction({
  //   from: ETH_ADDRESS,
  //   to: '0x'+'00'.repeat(20),
  //   gas: 0x30d40,
  //   gasPrice: "0x00",
  //   value: "0x00",
  //   data: BoxContractArtifact.bytecode
  // });
  // const contractAddress = deployTxReceipt.contractAddress;
  // const box = new web3.eth.Contract(
  //   BoxContractArtifact.abi as AbiItems,
  //   contractAddress
  // );
  // const txReceipt = await box.methods.store(123).send({from: ETH_ADDRESS, gas: 0x30d40, gasPrice: "0x00",});
  // t.is(txReceipt.transactionHash.slice(0, 2), "0x");
  // t.is(txReceipt.transactionHash.length, 66);
  // t.is(txReceipt.status, true);

  // change another contract using the same provider, should not working
  const simplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS
  );
  const shortAddress = await simplestorageV2.methods
    .get()
    .call({ from: ETH_ADDRESS });
  t.not(shortAddress, ETH_ADDRESS);

  // change provider's abi, and try again
  provider.setAbi(EXAMPLE_CONTRACT.abi);
  web3.setProvider(provider);
  const newSimplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS
  );
  const ethAddress = await newSimplestorageV2.methods
    .get()
    .call({ from: ETH_ADDRESS });
  t.is(ethAddress, ETH_ADDRESS);
});

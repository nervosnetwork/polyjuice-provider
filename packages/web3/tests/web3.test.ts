import test from "ava";
import Web3 from "web3";
import {
  PolyjuiceHttpProvider,
  PolyjuiceAccounts,
  PolyjuiceHttpProviderCli,
  PolyjuiceWebsocketProvider,
} from "../lib/index";
import {
  AbiItems,
  PolyjuiceConfig,
  RpcFailedError,
} from "@polyjuice-provider/base";
import { initMockWindowsEthereum } from "./helper";
import errorReceiptContract from "../../../contract-testcase/ErrorReceipt.json";

const Contract = require("web3-eth-contract");

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
const EXAMPLE_CONTRACT_BIN =
  "0x608060405234801561001057600080fd5b50610882806100206000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c80632801617e146100675780634ef65c3b146100835780636d4ce63c1461009f5780639f494991146100bd578063d1d1a6f3146100d9578063d504ea1d146100f7575b600080fd5b610081600480360361007c91908101906104cb565b610115565b005b61009d60048036036100989190810190610535565b610158565b005b6100a7610162565b6040516100b491906106af565b60405180910390f35b6100d760048036036100d291908101906104f4565b61018b565b005b6100e16101a5565b6040516100ee91906106ec565b60405180910390f35b6100ff61028c565b60405161010c91906106ca565b60405180910390f35b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b8060028190555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b80600190805190602001906101a192919061031a565b5050565b6101ad6103a4565b604051806060016040528060025481526020016000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600180548060200260200160405190810160405280929190818152602001828054801561027f57602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610235575b5050505050815250905090565b6060600180548060200260200160405190810160405280929190818152602001828054801561031057602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116102c6575b5050505050905090565b828054828255906000526020600020908101928215610393579160200282015b828111156103925782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055509160200191906001019061033a565b5b5090506103a091906103db565b5090565b604051806060016040528060008152602001600073ffffffffffffffffffffffffffffffffffffffff168152602001606081525090565b61041b91905b8082111561041757600081816101000a81549073ffffffffffffffffffffffffffffffffffffffff0219169055506001016103e1565b5090565b90565b60008135905061042d81610811565b92915050565b600082601f83011261044457600080fd5b81356104576104528261073b565b61070e565b9150818183526020840193506020810190508385602084028201111561047c57600080fd5b60005b838110156104ac5781610492888261041e565b84526020840193506020830192505060018101905061047f565b5050505092915050565b6000813590506104c581610828565b92915050565b6000602082840312156104dd57600080fd5b60006104eb8482850161041e565b91505092915050565b60006020828403121561050657600080fd5b600082013567ffffffffffffffff81111561052057600080fd5b61052c84828501610433565b91505092915050565b60006020828403121561054757600080fd5b6000610555848285016104b6565b91505092915050565b600061056a8383610576565b60208301905092915050565b61057f816107d5565b82525050565b61058e816107d5565b82525050565b600061059f8261078e565b6105a981856107c4565b93506105b483610773565b8060005b838110156105e55781516105cc888261055e565b97506105d7836107a6565b9250506001810190506105b8565b5085935050505092915050565b60006105fd82610783565b61060781856107b3565b935061061283610763565b8060005b8381101561064357815161062a888261055e565b975061063583610799565b925050600181019050610616565b5085935050505092915050565b600060608301600083015161066860008601826106a0565b50602083015161067b6020860182610576565b506040830151848203604086015261069382826105f2565b9150508091505092915050565b6106a981610807565b82525050565b60006020820190506106c46000830184610585565b92915050565b600060208201905081810360008301526106e48184610594565b905092915050565b600060208201905081810360008301526107068184610650565b905092915050565b6000604051905081810181811067ffffffffffffffff8211171561073157600080fd5b8060405250919050565b600067ffffffffffffffff82111561075257600080fd5b602082029050602081019050919050565b6000819050602082019050919050565b6000819050602082019050919050565b600081519050919050565b600081519050919050565b6000602082019050919050565b6000602082019050919050565b600082825260208201905092915050565b600082825260208201905092915050565b60006107e0826107e7565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b61081a816107d5565b811461082557600080fd5b50565b61083181610807565b811461083c57600080fd5b5056fea365627a7a72315820ef73bb2343fb2e9ee8b5eec1bdc20a2589f69bd4bd6560e1a7f335f520a6068f6c6578706572696d656e74616cf564736f6c63430005100040";

let provider: PolyjuiceHttpProvider,
  cliProvider: PolyjuiceHttpProviderCli,
  wsProvider: PolyjuiceWebsocketProvider,
  polyjuiceAccounts: PolyjuiceAccounts,
  wsPolyjuiceAccounts: PolyjuiceAccounts;
let web3, cliWeb3, wsWeb3;
let contract_address: string;

test.before((t) => {
  // init provider and web3
  const web3Rpc = process.env.WEB3_JSON_RPC;
  const web3WsRpc = process.env.WEB3_WS_JSON_RPC;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: EXAMPLE_CONTRACT.abi as AbiItems,
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
test.serial("account: account-sign-tx", async (t) => {
  const abiItems = [
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);
  polyjuiceAccounts.setAbi(abiItems as AbiItems);
  Contract.setProvider(provider, polyjuiceAccounts);
  const address_params = ETH_ADDRESS.slice(2).toLocaleLowerCase();
  const eth_tx = {
    from: ETH_ADDRESS,
    to: "0x" + Array(40).fill("0").join(""),
    value: "0x00",
    gas: "0x5b8d80",
    gasPrice: "0x0",
    data: `0x095ea7b3000000000000000000000000${address_params}0000000000000000000000000000000000000000000000000000000000000000`,
  };
  const signed_tx = await polyjuiceAccounts.signTransaction(
    eth_tx,
    PRIVATE_KEY
  );
  t.is(signed_tx.rawTransaction.slice(0, 2), "0x");
  t.is(signed_tx.rawTransaction.includes(address_params), false);
});

test.serial("account: sign-tx-deploy", async (t) => {
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);

  const simplestorageV2 = new Contract(EXAMPLE_CONTRACT.abi as AbiItems);

  const contract = await simplestorageV2
    .deploy({
      data: EXAMPLE_CONTRACT_BIN,
      arguments: [],
    })
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });

  t.is(contract._address.slice(0, 2), "0x");
  t.is(contract._address.length, 42);
  contract_address = contract._address;
});

test.serial("account: sign-tx-send", async (t) => {
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);

  const simplestorageV2 = new Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address
  );

  const txRes = await simplestorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });

  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

test.serial("account: get revert message", async (t) => {
  polyjuiceAccounts.wallet.add(PRIVATE_KEY);
  Contract.setProvider(provider, polyjuiceAccounts);
  const errorCotnract = new Contract(errorReceiptContract.abi as AbiItems);
  const contractInstance = await errorCotnract
    .deploy({
      data: errorReceiptContract.bytecode,
      arguments: [],
    })
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });
  t.is(contractInstance._address.slice(0, 2), "0x");
  t.is(contractInstance._address.length, 42);

  // get revert message
  const callRevert = async () =>
    await contractInstance.methods
      .getRevertMsg(555)
      .call({ from: ETH_ADDRESS });
  const callError = await t.throwsAsync(callRevert);
  t.is(callError.message, "Returned error: revert: you trigger crying value!");
  t.is(
    (callError as unknown as RpcFailedError).data.failed_reason.status_code,
    "0x2"
  );
});

//# cli provider test
test.serial("cli: sign message method", (t) => {
  const message =
    "0x61c0994ff56d3cc888e41ee4a45080a431ffa84979ccf936b3ecc4887d7e9324";
  const sig = cliProvider.signer.sign_with_private_key(message);
  t.is(
    sig,
    "0x7de886aaeb6c6df85a6c5a7603bdfe1dab36da558f9460f8f2fe201b1053ed111aaec1cf024eada7393f0dec80587398ec5d83f8976eaa0662c3b8b4ad9ee9601c"
  );
});

test.serial("cli: proxy rpc, send_transaction", async (t) => {
  const simplestorageV2 = new cliWeb3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address
  );
  const txRes = await simplestorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

test.serial("cli: proxy rpc, call_transaction", async (t) => {
  const simplestorageV2 = new cliWeb3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address
  );
  const result = await simplestorageV2.methods.get().call();
  t.is(result.slice(0, 2), "0x");
  t.is(result.length, 42);
});

test.serial("cli: change abi then send_transaction", async (t) => {
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
  cliProvider.setAbi(BoxContractArtifact.abi as AbiItems);
  cliWeb3 = new Web3(cliProvider);

  // change another contract using the same provider, should not working
  const simplestorageV2 = new cliWeb3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address
  );
  const shortAddress = await simplestorageV2.methods
    .get()
    .call({ from: ETH_ADDRESS });
  t.not(shortAddress, ETH_ADDRESS);

  // change provider's abi, and try again
  cliProvider.setAbi(EXAMPLE_CONTRACT.abi as AbiItems);
  cliWeb3.setProvider(provider);
  const newSimplestorageV2 = new cliWeb3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address
  );
  const ethAddress = await newSimplestorageV2.methods
    .get()
    .call({ from: ETH_ADDRESS });
  t.is(ethAddress, ETH_ADDRESS);
});

//# websocket provider test
test.serial("ws: test-ws-provider-with-account", async (t) => {
  wsWeb3.eth.accounts = wsPolyjuiceAccounts;
  wsWeb3.eth.Contract._ethAccounts = wsWeb3.eth.accounts;
  wsPolyjuiceAccounts.wallet.add(PRIVATE_KEY);

  const simpleStorageV2 = new wsWeb3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address!
  );

  const id = await wsWeb3.eth.net.getId();
  const txRes = await simpleStorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });

  t.is(id, 1024777);
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

test.serial("ws: test-ws-provider-with-metamask", async (t) => {
  (global as any).window = await initMockWindowsEthereum(PRIVATE_KEY);

  const simpleStorageV2 = new wsWeb3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    contract_address!
  );

  const id = await wsWeb3.eth.net.getId();
  const txRes = await simpleStorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });

  t.is(id, 1024777);
  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

// test.serial("make a lot of call at short time", async (t) => {
//   polyjuiceAccounts.wallet.add(PRIVATE_KEY);
//   Contract.setProvider(provider, polyjuiceAccounts);
//
//   const simplestorageV2 = new Contract(
//     EXAMPLE_CONTRACT.abi as AbiItems,
//     contract_address
//   );
//
//   async function concurrentCall(){
//     const res = await simplestorageV2.methods
//     .get().call();
//     console.log('cocurrently call =>', res);
//   }
//
//   concurrentCall();
//   concurrentCall();
//   concurrentCall();
//   concurrentCall();
//   concurrentCall();
//
//   for(let i=0;i<10;i++){
//     const res = await simplestorageV2.methods
//     .get().call();
//     console.log(i, res);
//     t.pass();
//   }
//
//   t.pass();
// });
//
// test.serial("make a lot of send at serial", async (t) => {
//   polyjuiceAccounts.wallet.add(PRIVATE_KEY);
//   Contract.setProvider(provider, polyjuiceAccounts);
//
//   const simplestorageV2 = new Contract(
//     EXAMPLE_CONTRACT.abi as AbiItems,
//     contract_address
//   );
//
//   for(let i=0;i<10;i++){
//     const txReceipt = await simplestorageV2.methods
//     .set(ETH_ADDRESS).send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });
//     //console.log(`receive txHash: ${txHash}`);
//     //const txReceipt = await provider.godwoker.waitForTransactionReceipt(txHash);
//     console.log(i, txReceipt);
//     t.pass();
//   }
//
//   t.pass();
// });
//
// test.serial("make two send at sametime with same nonce", async (t) => {
//   polyjuiceAccounts.wallet.add(PRIVATE_KEY);
//   Contract.setProvider(provider, polyjuiceAccounts);
//
//   const simplestorageV2 = new Contract(
//     EXAMPLE_CONTRACT.abi as AbiItems,
//     contract_address
//   );
//
//   async function send1(){
//     const txReceipt = await simplestorageV2.methods
//     .set(ETH_ADDRESS).send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });
//     console.log('finished send1');
//     console.log(txReceipt);
//     t.is(txReceipt.transactionHash.slice(0, 2), "0x");
//     t.is(txReceipt.transactionHash.length, 66);
//     t.is(typeof txReceipt.gasUsed, "number");
//     t.is(txReceipt.status, true);
//   }
//
//   async function send2(){
//     const txReceipt = await simplestorageV2.methods
//     .set(ETH_ADDRESS).send({ from: ETH_ADDRESS, gas: "0x30e40", gasPrice: "0x00" });
//     console.log('finished send2');
//     console.log(txReceipt);
//     t.is(txReceipt.transactionHash.slice(0, 2), "0x");
//     t.is(txReceipt.transactionHash.length, 66);
//     t.is(typeof txReceipt.gasUsed, "number");
//     t.is(txReceipt.status, true);
//   }
//
//   send1();
//   send2();
//
//   const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
//
//   for(let i=0;i<10;i++){
//     await delay(5000);
//     t.pass();
//   }
//
//   t.pass();
// });

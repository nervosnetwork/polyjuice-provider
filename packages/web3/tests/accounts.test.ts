import test from "ava";
import Web3 from "web3";
import { PolyjuiceConfig, PolyjuiceHttpProvider } from "../lib/providers";
import { AbiItems } from "@polyjuice-provider/base";
import { PolyjuiceAccounts } from "../lib/accounts";

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

var provider;
var polyjuiceAccounts: PolyjuiceAccounts;
var contract_address: string;
var web3;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config: PolyjuiceConfig = {
    rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
    abiItems: EXAMPLE_CONTRACT.abi as AbiItems,
    web3Url: godwoken_rpc_url,
  };
  provider = new PolyjuiceHttpProvider(godwoken_rpc_url, provider_config);
  web3 = new Web3(provider);
  polyjuiceAccounts = new PolyjuiceAccounts(provider_config);
});

test.serial("replace-web3-eth-account", async (t) => {
  web3.eth.accounts = polyjuiceAccounts;
  web3.eth.Contract._ethAccounts = web3.eth.accounts;

  web3.eth.accounts.wallet.add(PRIVATE_KEY);

  const simplestorageV2 = new web3.eth.Contract(
    EXAMPLE_CONTRACT.abi as AbiItems,
    process.env.EXAMPLE_CONTRACT_ADDRESS!
  );

  const txRes = await simplestorageV2.methods
    .set(ETH_ADDRESS)
    .send({ from: ETH_ADDRESS, gas: "0x30d40", gasPrice: "0x00" });

  t.is(txRes.transactionHash.slice(0, 2), "0x");
  t.is(txRes.transactionHash.length, 66);
  t.is(typeof txRes.gasUsed, "number");
  t.is(txRes.status, true);
});

test.serial("sign-tx-deploy", async (t) => {
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

test.serial("sign-tx-send", async (t) => {
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

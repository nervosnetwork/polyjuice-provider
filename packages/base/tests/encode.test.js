const test = require("ava");
const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const browserEnv = require("browser-env");
if (process.env.MODE === "browser") browserEnv();

const { Godwoker } = require("../lib/util");
const PolyjuiceProvider = require("@retric/test-provider");

const TEST_ABI_ITEMS = [
  {
    inputs: [{ type: "address", name: "" }],
    constant: true,
    name: "isInstantiation",
    payable: false,
    outputs: [{ type: "bool", name: "" }],
    type: "function",
  },
  {
    inputs: [
      { type: "address[]", name: "_owners" },
      { type: "uint256", name: "_required" },
      { type: "uint256", name: "_dailyLimit" },
    ],
    constant: false,
    name: "create",
    payable: false,
    outputs: [{ type: "address", name: "wallet" }],
    type: "function",
  },
  {
    inputs: [
      { type: "address", name: "" },
      { type: "uint256", name: "" },
    ],
    constant: true,
    name: "instantiations",
    payable: false,
    outputs: [{ type: "address", name: "" }],
    type: "function",
  },
  {
    inputs: [{ type: "address", name: "creator" }],
    constant: true,
    name: "getInstantiationCount",
    payable: false,
    outputs: [{ type: "uint256", name: "" }],
    type: "function",
  },
  {
    inputs: [
      { indexed: false, type: "address", name: "sender" },
      { indexed: false, type: "address", name: "instantiation" },
    ],
    type: "event",
    name: "ContractInstantiation",
    anonymous: false,
  },
];
var abi;
var godwoker;
var godwoker2;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config = {
    godwoken: {
      rollup_type_hash: process.env.ROLLUP_TYPE_HASH || "",
      eth_account_lock: {
        code_hash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH || "",
        hash_type: "type",
      },
    },
  };
  godwoker = new Godwoker(godwoken_rpc_url, provider_config);
  const p = new PolyjuiceProvider(godwoken_rpc_url, provider_config);
  godwoker2 = p.godwoker;
});

test.serial("ecode-data-in-single-function", (t) => {
  function writeBigUint64LE(buf, value, offset = 0) {
    let lo = Number(value & BigInt(0xffffffff));
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number((value >> BigInt(32)) & BigInt(0xffffffff));
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
  }
  const gas = "0x9184e72a000";
  const buf = Buffer.allocUnsafe(8);
  const b1 = buf.writeBigInt64LE(BigInt(gas));
  const buf2 = Buffer.allocUnsafe(8);
  const b2 = writeBigUint64LE(buf2, BigInt(gas));
  console.log(buf.toString("hex"));
  t.is(buf.toString("hex"), buf2.toString("hex"));
});

test.serial("encode-data-in-godwoker", (t) => {
  const eth_tx = {
    from: "0xfb2c72d3ffe10ef7c9960272859a23d24db9e04a",
    to: "0x0000000000000000000000000000000000000000",
    value: "0x0",
    data: "0x608060405234801561001057600080fd5b5061040c806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80632801617e146100515780636d4ce63c146100955780639f494991146100df578063d504ea1d14610197575b600080fd5b6100936004803603602081101561006757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506101f6565b005b61009d610239565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610195600480360360208110156100f557600080fd5b810190808035906020019064010000000081111561011257600080fd5b82018360208201111561012457600080fd5b8035906020019184602083028401116401000000008311171561014657600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f820116905080830192505050505050509192919290505050610262565b005b61019f61027c565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b838110156101e25780820151818401526020810190506101c7565b505050509050019250505060405180910390f35b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b806001908051906020019061027892919061030a565b5050565b6060600180548060200260200160405190810160405280929190818152602001828054801561030057602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116102b6575b5050505050905090565b828054828255906000526020600020908101928215610383579160200282015b828111156103825782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055509160200191906001019061032a565b5b5090506103909190610394565b5090565b6103d491905b808211156103d057600081816101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555060010161039a565b5090565b9056fea265627a7a72315820e5de101a155dd99887410de2703d538ff81a88530c31ad8aa76e88a527725ace64736f6c63430005100032",
    gas: "0x9184e72a000",
    gasPrice: "0x0",
  };
  const result =
    "0xffffff504f4c590300a0724e1809000000000000000000000000000000000000000000000000000000000000000000002c040000608060405234801561001057600080fd5b5061040c806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80632801617e146100515780636d4ce63c146100955780639f494991146100df578063d504ea1d14610197575b600080fd5b6100936004803603602081101561006757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506101f6565b005b61009d610239565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610195600480360360208110156100f557600080fd5b810190808035906020019064010000000081111561011257600080fd5b82018360208201111561012457600080fd5b8035906020019184602083028401116401000000008311171561014657600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f820116905080830192505050505050509192919290505050610262565b005b61019f61027c565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b838110156101e25780820151818401526020810190506101c7565b505050509050019250505060405180910390f35b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b806001908051906020019061027892919061030a565b5050565b6060600180548060200260200160405190810160405280929190818152602001828054801561030057602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116102b6575b5050505050905090565b828054828255906000526020600020908101928215610383579160200282015b828111156103825782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055509160200191906001019061032a565b5b5090506103909190610394565b5090565b6103d491905b808211156103d057600081816101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555060010161039a565b5090565b9056fea265627a7a72315820e5de101a155dd99887410de2703d538ff81a88530c31ad8aa76e88a527725ace64736f6c63430005100032";
  const data = godwoker.encodeArgs(eth_tx);
  const data1 = godwoker2.encodeArgs(eth_tx);
  t.is(data, result);
  t.is(data, data1);
});

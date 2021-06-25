const test = require("ava");
const Web3 = require("web3");
const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const PolyjuiceHttpProvider = require("../lib/cli");

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
const ETH_ADDRESS = "0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A";
const PRIVATE_KEY =
  "0xcd277d1a87ffc737b01f6f079a721fe34910b673755130399ea379200a6ef9f2";
var provider;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config = {
    godwoken: {
      rollup_type_hash: process.env.ROLLUP_TYPE_HASH,
      eth_account_lock: {
        code_hash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
        hash_type: "type",
      },
    },
  };
  provider = new PolyjuiceHttpProvider(
    godwoken_rpc_url,
    provider_config,
    TEST_ABI_ITEMS,
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

// test.serial("proxy rpc: send_transaction", async (t) => {
//   const web3 = new Web3(provider);
//   const txHash = await web3.eth.sendTransaction({
//     from: ETH_ADDRESS,
//     to: `0x${Array(40).fill(0).join('')}`,
//     value: "0x00",
//     data: "0x00",
//     gas: "0x30d40",
//     gasPrice: "0x00",
//   });
//   console.log(txHash);
//   t.true(typeof txHash === "string");
// });

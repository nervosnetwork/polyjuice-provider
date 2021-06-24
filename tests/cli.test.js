const test = require("ava");
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
    process.env.PRIVATE_KEY
  );
});

test.serial("sign method", (t) => {
  const message = "0x1000";
  const sig = provider.signer.sign_with_private_key(
    message,
    "0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A"
  );
  t.is(
    sig,
    "0x824b98f8dc8ab3b4d67cd1e6fdce9f9bfe3ac462124affaf19229cf43111deff06c170076d07ae7cc4cc4b2d7b375e5a1e4fae75eb68b77d4447f9af6e41bde01b"
  );
});

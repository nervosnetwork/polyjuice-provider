const test = require("ava");
const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const { PolyjuiceJsonRpcProvider } = require("../lib/hardhat/providers");
const PolyjuiceWallet = require("../lib/hardhat/wallet-signer");

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
var wallet;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const polyjuice_config = {
    godwokerOption: {
      godwoken: {
        rollup_type_hash: process.env.ROLLUP_TYPE_HASH,
        eth_account_lock: {
          code_hash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
          hash_type: "type",
        },
      },
    },
    web3RpcUrl: godwoken_rpc_url,
  };
  provider = new PolyjuiceJsonRpcProvider(godwoken_rpc_url);
  wallet = new PolyjuiceWallet(
    process.env.PRIVATE_KEY,
    polyjuice_config,
    provider
  );
});

test.serial("import class", (t) => {
  t.not(provider, undefined);
  t.not(wallet, undefined);
});

test.serial("sendTransaction", async (t) => {
  if (process.env.MODE === "browser") {
    // skip test, the last test in node env might not be done, will cause duplicated-tx
    return t.pass();
  }

  const eth_tx = {
    data: "0x60806040525b607b60006000508190909055505b610018565b60db806100266000396000f3fe60806040526004361060295760003560e01c806360fe47b114602f5780636d4ce63c14605b576029565b60006000fd5b60596004803603602081101560445760006000fd5b81019080803590602001909291905050506084565b005b34801560675760006000fd5b50606e6094565b6040518082815260200191505060405180910390f35b8060006000508190909055505b50565b6000600060005054905060a2565b9056fea2646970667358221220044daf4e34adffc61c3bb9e8f40061731972d32db5b8c2bc975123da9e988c3e64736f6c63430006060033",
    from: "0xfb2c72d3ffe10ef7c9960272859a23d24db9e04a",
    gasLimit: "0x9184e72a0000",
    gasPrice: "0x00",
    to: "0x0000000000000000000000000000000000000000",
    value: "0x00",
  };
  const res = await wallet.sendTransaction(eth_tx);
  t.is(res.chainId, 3);
  t.is(typeof res.wait, "function");
});

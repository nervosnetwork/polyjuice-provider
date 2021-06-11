const test = require("ava");
const Web3EthAbi = require("web3-eth-abi");
const PolyjuiceHttpProvider = require("../lib/node/polyjuice_provider.js");

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

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = "http://127.0.0.1:8119";
  const provider_config = {
    godwoken: {
      rollup_type_hash:
        "0x0cafffe5a6049ee107a3c9f83c68984806028b4cf196d841739ba92e31e5288f",
      eth_account_lock: {
        code_hash:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
        hash_type: "data",
      },
    },
  };
  const provider = new PolyjuiceHttpProvider(
    godwoken_rpc_url,
    provider_config,
    TEST_ABI_ITEMS
  );
  abi = provider.abi;
  godwoker = provider.godwoker;
});

test.serial("get_interested_methods", (t) => {
  const methods = abi.get_interested_methods();
  t.is(methods.length, 4);
});

test.serial("decode method", (t) => {
  const testData =
    "0x53d9d9100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114de5000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114daa";
  const decodedData = abi.decode_method(testData);
  t.deepEqual(decodedData.params[0].value, [
    "0xa6d9c5f7d4de3cef51ad3b7235d79ccc95114de5",
    "0xa6d9c5f7d4de3cef51ad3b7235d79ccc95114daa",
  ]);
});

test.serial("refactor eth-address in inputs", async (t) => {
  const testData =
    "0x53d9d9100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114de5000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114daa";
  const decodedData = abi.decode_method(testData);
  const newTestData = await abi.refactor_data_with_short_address(
    testData,
    godwoker.getShortAddressByAllTypeEthAddress.bind(godwoker)
  );
  const newDecodedData = abi.decode_method(newTestData);
  t.not(testData, newTestData);
  t.notDeepEqual(decodedData, newDecodedData);
});

test.serial("refactor eth-address in outputs", async (t) => {
	const abi_item = {
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
	      };

	const test_values = Web3EthAbi.encodeParameters(['address'], ['0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A']);
	const output_value_types = abi_item.outputs.map(item => item.type);
	const decoded_values = Web3EthAbi.decodeParameters(output_value_types, test_values);
	const new_decoded_value = await abi.refactor_return_value_with_short_address(test_values, abi_item, godwoker.getShortAddressByAllTypeEthAddress.bind(godwoker));
	t.not(decoded_values[0], new_decoded_value[0]);
});

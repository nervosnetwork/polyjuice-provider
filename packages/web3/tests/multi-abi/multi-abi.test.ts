import test from "ava";
import Web3 from "web3";
import { PolyjuiceHttpProvider } from "../../lib/providers";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { PolyjuiceAccounts } from "../../lib/accounts";

import { abi as s1Abi } from "./build/s1.json";
import { abi as s2Abi } from "./build/s2.json";
import { abi as s3Abi } from "./build/s3.json";
import { abi as s4Abi } from "./build/s4.json";

const Contract = require("web3-eth-contract");

const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const ETH_ADDRESS = "0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A";

var provider: PolyjuiceHttpProvider;
var polyjuiceAccounts: PolyjuiceAccounts;
var contract_address: string;
var web3;

test.before((t) => {
  // init provider and web3
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const provider_config: PolyjuiceConfig = {
    abiItems: s1Abi as AbiItems,
    web3Url: godwoken_rpc_url,
  };
  provider = new PolyjuiceHttpProvider(godwoken_rpc_url, provider_config);
  web3 = new Web3(provider);
});

test.serial("multiple-abi", async (t) => {
  t.is(Object.keys(provider.abi.interested_method_ids).length, 2);

  provider.addAbi(s2Abi as AbiItems);
  t.is(Object.keys(provider.abi.interested_method_ids).length, 2);

  provider.addAbi(s3Abi as AbiItems);
  t.is(Object.keys(provider.abi.interested_method_ids).length, 2);

  provider.addAbi(s4Abi as AbiItems);
  t.is(Object.keys(provider.abi.interested_method_ids).length, 3);

  provider.setMultiAbi([
    s1Abi as AbiItems,
    s2Abi as AbiItems,
    s3Abi as AbiItems,
    s4Abi as AbiItems,
  ]);
  t.is(Object.keys(provider.abi.interested_method_ids).length, 3);
});

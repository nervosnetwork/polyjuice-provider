const test = require("ava");
const root = require("path").join.bind(this, __dirname, "..");
require("dotenv").config({ path: root(".test.env") });

const { Godwoker } = require("../lib/index");

var godwoker;

test.cb("initSync without any config", (t) => {
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  godwoker = new Godwoker(godwoken_rpc_url);
  godwoker.initSync().then(function () {
    t.is(godwoker.eth_account_lock.code_hash.slice(0, 2), "0x");
    t.is(godwoker.rollup_type_hash.slice(0, 2), "0x");
    t.not(godwoker.eth_account_lock.code_hash, godwoker.rollup_type_hash);
    t.is(godwoker.godwokenUtils.rollupTypeHash, godwoker.rollup_type_hash);
    t.end();
  });
});

test.cb("initSync with one config", (t) => {
  const godwoken_rpc_url = process.env.WEB3_JSON_RPC;
  const fake_rollup_type_hash = "0xffffffff";
  const provider_config = {
    godwoken: {
      rollup_type_hash: fake_rollup_type_hash,
      eth_account_lock: {
        code_hash: undefined,
        hash_type: "type",
      },
    },
  };
  godwoker = new Godwoker(godwoken_rpc_url, provider_config);
  godwoker.initSync().then(function () {
    t.is(godwoker.rollup_type_hash, fake_rollup_type_hash);
    t.is(godwoker.eth_account_lock.code_hash.slice(0, 2), "0x");
    t.is(godwoker.rollup_type_hash.slice(0, 2), "0x");
    t.not(godwoker.eth_account_lock.code_hash, godwoker.rollup_type_hash);
    t.is(godwoker.godwokenUtils.rollupTypeHash, godwoker.rollup_type_hash);
    t.end();
  });
});

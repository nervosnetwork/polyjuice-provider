import test from "ava";
import {
  Abi,
  Godwoker,
  AbiItems,
  EthTransaction,
  GodwokerOption,
  DecodedMethodParam,
  RequestRpcResult,
  Signer,
} from "../lib/index";

test.serial("typescript-import-from-index", (t) => {
  t.is(typeof Abi, 'function');
  t.is(typeof Godwoker, 'function');
  t.is(typeof Signer, 'function');
});

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
  t.not(Abi, undefined);
  t.not(Godwoker, undefined);
  t.not(Signer, undefined);
});

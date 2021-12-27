import test from "ava";
import erc20Contract from "../../../contract-testcase/erc20.json";
import deployTestContract from "../../../contract-testcase/DeployArgs.json";
import {
  calculateDeploymentSignature,
  CONTRACT_BYTE_CODE_HASH_HEAD_IN_BYTE,
  CONTRACT_BYTE_CODE_ID_OFFSET,
  restoreDeploymentSignature,
} from "../lib/index";
import keccak256 from "keccak256";

test.serial("calculate and restore deployment signature", async (t) => {
  {
    const sig = calculateDeploymentSignature(erc20Contract.bytecode);
    const restore = restoreDeploymentSignature(sig);
    t.is(erc20Contract.bytecode.length, restore.length);
    t.is(
      erc20Contract.bytecode.slice(-CONTRACT_BYTE_CODE_ID_OFFSET),
      restore.byteCodeId
    );
    t.is(
      keccak256(Buffer.from(erc20Contract.bytecode, "hex"))
        .slice(0, CONTRACT_BYTE_CODE_HASH_HEAD_IN_BYTE)
        .toString("hex"),
      restore.byteCodeSignature
    );
  }

  {
    const sig = calculateDeploymentSignature(deployTestContract.bytecode);
    const restore = restoreDeploymentSignature(sig);
    t.is(deployTestContract.bytecode.length, restore.length);
    t.is(
      deployTestContract.bytecode.slice(-CONTRACT_BYTE_CODE_ID_OFFSET),
      restore.byteCodeId
    );
    t.is(
      keccak256(Buffer.from(deployTestContract.bytecode, "hex"))
        .slice(0, CONTRACT_BYTE_CODE_HASH_HEAD_IN_BYTE)
        .toString("hex"),
      restore.byteCodeSignature
    );
  }
});

const crypto = require("crypto");
const keccak256 = require("keccak256");
const { Command } = require("commander");
const { argv } = require("process");
const Web3 = require("web3");

// const DEFAULT_WEB3_RPC = "http://localhost:8024";

const program = new Command();

// program
//   .command("prepareEnv <rollupTypeHash> <ethAccountLockCodeHash> <privateKey> <web3Rpc>")
//   .description("prepare .test.env for project testing.")
//   .action(prepareEnvFiles);

program
  .command("privateKeyToEthAddress <privateKey>")
  .description("convert privateKey to EthAddress.")
  .action(privateKeyToEthAddress);

program.parse(argv);

function privateKeyToEthAddress(privateKey) {
  const ecdh = crypto.createECDH(`secp256k1`);
  ecdh.generateKeys();
  ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), "hex"));
  const publicKey = "0x" + ecdh.getPublicKey("hex", "uncompressed");
  const _ethAddress =
    "0x" +
    keccak256(Buffer.from(publicKey.slice(4), "hex"))
      .slice(12)
      .toString("hex");
  const ethAddress = Web3.utils.toChecksumAddress(_ethAddress);
  console.log(ethAddress);
  return ethAddress;
}

// function prepareEnvFiles(
//   rollupTypeHash,
//   ethAccountLockCodeHash,
//   privateKey,
//   web3Rpc = DEFAULT_WEB3_RPC
// ) {
//   const ethAddress = privateKeyToEthAddress(privateKey);
//   const output = execSync(
//     `
// cat > ./.test.env <<EOF
// WEB3_JSON_RPC=${web3Rpc}
// ROLLUP_TYPE_HASH=${rollupTypeHash}
// ETH_ACCOUNT_LOCK_CODE_HASH=${ethAccountLockCodeHash}
// EXAMPLE_CONTRACT_ADDRESS=
// PRIVATE_KEY=${privateKey}
// ETH_ADDRESS=${ethAddress}
// EOF
//   `,
//     { encoding: "utf-8" }
//   );
//   console.log("Output was:\n", output);
//
//   const output2 = execSync("cp .test.env ./packages/ethers/");
//   const output3 = execSync("cp .test.env ./packages/web3/");
//   const output4 = execSync("cp .test.env ./packages/base/");
//   const output5 = execSync("cp .test.env ./packages/truffle/");
// }

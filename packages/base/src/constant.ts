// source: https://github.com/nervosnetwork/godwoken-polyjuice/blob/main/docs/EVM-compatible.md
export const POLY_MAX_BLOCK_GAS_LIMIT = 12500000;
export const POLY_MAX_TRANSACTION_GAS_LIMIT = 12500000;
export const POLY_MIN_GAS_PRICE = 0;
export const POLY_BLOCK_DIFFICULTY = 2500000000000000;

export const U128_MIN = BigInt(0);
export const U128_MAX = BigInt("340282366920938463463374607431768211455");
// 340282366920938463463374607431768211455 equals to BigInt(2) ** BigInt(128) - BigInt(1)
// if we use formular instead of the direct result,
// in some case, boundler like webpack will turn ** into Math.pow(),
// which doesn't support BigInt type thus causing error.
// this is a known issue as https://github.com/facebook/create-react-app/issues/10785
export const DEFAULT_EMPTY_ETH_ADDRESS = `0x${"0".repeat(40)}`;

export const DEFAULT_ETH_LOGS_BLOOM = "0x" + "00".repeat(256);

export const HEX_CHARACTERS: string = "0123456789abcdef";

export const EMPTY_ABI_ITEM_SERIALIZE_STR = "0x";

// utils
// waitForTransactionReceipt
export const WAIT_TIMEOUT_MILSECS = 225000; // 3.75 minutes
export const WAIT_LOOP_INTERVAL_MILSECS = 1000; // 1 secs

// sudt transfer
export const DEFAULT_SUDT_ID_HEX_STRING = "0x1";
export const DEFAULT_SUDT_FEE_HEX_STRING = "0x0";
export const DEFAULT_ETH_TO_CKB_SUDT_DECIMAL = 100_0000_0000; // 1 eth = 1 ckb in layer2

// contract deployment
export const MAX_CONTRACT_CODE_SIZE_IN_BYTE = 24000; // 24k byte
export const CONTRACT_BYTE_CODE_ID_OFFSET = 12; // we use last 12 of bytecode string to identified contract
export const CONTRACT_BYTE_CODE_HASH_HEAD_IN_BYTE = 8; // keccak(bytecode) first 8 bytes as HASH_HEAD

// docs link
export const DEPLOY_CONTRACT_DOCS_LINK =
  "https://github.com/nervosnetwork/polyjuice-provider/readme.md";

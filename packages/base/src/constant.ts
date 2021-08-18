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

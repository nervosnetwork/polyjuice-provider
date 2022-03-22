import { HexNumber, HexString } from "@ckb-lumos/base";
import { AbiItem } from "web3-utils";

export type AbiItems = AbiItem[];

export type PolyjuiceConfig = {
  rollupTypeHash?: string;
  ethAccountLockCodeHash?: string;
  creatorId?: HexNumber;
  defaultFromAddress?: HexString;
  abiItems?: AbiItems;
  web3Url?: string;
};

export enum ShortAddressType {
  eoaAddress,
  contractAddress,
  notExistEoaAddress,
  notExistContractAddress, // create2 contract which haven't really created, currently provider can't distinguish this type of address.
  creatorAddress, // special case: 0x00000...
}

export interface ShortAddress {
  value: HexString;
  type: ShortAddressType;
}

export enum SigningMessageType {
  withPrefix,
  noPrefix,
}

export type BlockTag = "latest" | "earliest" | "pending";
export type BlockParameter = HexString | BlockTag;

export enum FailedReasonStatusType {
  "SUCCESS",
  "FAILURE",
  "REVERT",
  "OUT_OF_GAS",
  "INVALID_INSTRUCTION",
  "UNDEFINED_INSTRUCTION",
  "STACK_OVERFLOW",
  "STACK_UNDERFLOW",
  "BAD_JUMP_DESTINATION",
  "INVALID_MEMORY_ACCESS",
  "CALL_DEPTH_EXCEEDED",
  "STATIC_MODE_VIOLATION",
  "PRECOMPILE_FAILURE",
  "CONTRACT_VALIDATION_FAILURE",
  "ARGUMENT_OUT_OF_RANGE",
  "WASM_UNREACHABLE_INSTRUCTION",
  "WASM_TRAP",
  "INSUFFICIENT_BALANCE",
  "INTERNAL_ERROR",
  "REJECTED",
  "OUT_OF_MEMORY",
}

export interface FailedReason {
  status_code: HexNumber;
  status_type: FailedReasonStatusType;
  message: string;
}

export interface RpcFailedError {
  code: number;
  message: string;
  data: {
    failed_reason: FailedReason;
  };
}

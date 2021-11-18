import { Hash, HexNumber, HexString, Script } from "@ckb-lumos/base";
import { normalizers, Reader } from "ckb-js-toolkit";
import { L2Transaction, WithdrawalRequest } from "../index";
import {
  AddressMapping,
  AddressMappingItem,
  L2TransactionWithAddressMapping,
  RawL2TransactionWithAddressMapping,
} from "./addressTypes";
import {
  AbiInput,
  AbiItem,
  AbiOutput,
  AbiType,
  StateMutabilityType,
} from "./abiTypes";
import _ from "lodash";

// Taken for now from https://github.com/xxuejie/ckb-js-toolkit/blob/68f5ff709f78eb188ee116b2887a362123b016cc/src/normalizers.js#L17-L69,
// later we can think about exposing those functions directly.
function normalizeHexNumber(length: number) {
  return function (debugPath: string, value: any) {
    if (!(value instanceof ArrayBuffer)) {
      let intValue = BigInt(value).toString(16);
      if (intValue.length % 2 !== 0) {
        intValue = "0" + intValue;
      }
      if (intValue.length / 2 > length) {
        throw new Error(
          `${debugPath} is ${
            intValue.length / 2
          } bytes long, expected length is ${length}!`
        );
      }
      const view = new DataView(new ArrayBuffer(length));
      for (let i = 0; i < intValue.length / 2; i++) {
        const start = intValue.length - (i + 1) * 2;
        view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
      }
      value = view.buffer;
    }
    if (value.byteLength < length) {
      const array = new Uint8Array(length);
      array.set(new Uint8Array(value), 0);
      value = array.buffer;
    }
    return value;
  };
}

function normalizeRawData(length: number) {
  return function (debugPath: string, value: any) {
    try {
      value = new Reader(value).toArrayBuffer();
    } catch (error: any) {
      throw new Error(
        `${debugPath} invalid value ${value}, error: ${error?.message}`
      );
    }
    if (length > 0 && value.byteLength !== length) {
      throw new Error(
        `${debugPath} has invalid length ${value.byteLength}, required: ${length}`
      );
    }
    return value;
  };
}

function normalizeObject(debugPath: string, obj: any, keys: object) {
  const result: any = {};

  for (const [key, f] of Object.entries(keys)) {
    const value = obj[key];
    if (!value) {
      throw new Error(`${debugPath} is missing ${key}!`);
    }
    result[key] = f(`${debugPath}.${key}`, value);
  }
  return result;
}

function toNormalize(normalize: Function) {
  return function (debugPath: string, value: any) {
    return normalize(value, {
      debugPath,
    });
  };
}

function toNormalizeArray(normalizeFunction: Function) {
  return function (debugPath: string, array: any[]) {
    return array.map((item, i) => {
      return normalizeFunction(`${debugPath}[${i}]`, item);
    });
  };
}

export interface DepositRequest {
  capacity: HexNumber;
  amount: HexNumber;
  sudt_script_hash: Hash;
  script: Script;
}

export function NormalizeDepositRequest(
  request: object,
  { debugPath = "deposit_request" } = {}
) {
  return normalizeObject(debugPath, request, {
    capacity: normalizeHexNumber(8),
    amount: normalizeHexNumber(16),
    sudt_script_hash: normalizeRawData(32),
    script: toNormalize(normalizers.NormalizeScript),
  });
}

export function NormalizeDepositLockArgs(
  args: object,
  { debugPath = "deposit_lock_args" } = {}
) {
  return normalizeObject(debugPath, args, {
    owner_lock_hash: normalizeRawData(32),
    layer2_lock: toNormalize(normalizers.NormalizeScript),
    cancel_timeout: normalizeHexNumber(8),
  });
}

export interface HeaderInfo {
  number: HexNumber;
  block_hash: Hash;
}

export function NormalizeHeaderInfo(
  headerInfo: object,
  { debugPath = "header_info" } = {}
) {
  return normalizeObject(debugPath, headerInfo, {
    number: normalizeHexNumber(8),
    block_hash: normalizeRawData(32),
  });
}

export interface CustodianLockArgs {
  owner_lock_hash: Hash;
  deposit_block_hash: Hash;
  deposit_block_number: HexNumber;
}

export function NormalizeCustodianLockArgs(
  args: object,
  { debugPath = "custodian_lock_args" } = {}
) {
  return normalizeObject(debugPath, args, {
    owner_lock_hash: normalizeRawData(32),
    deposit_block_hash: normalizeRawData(32),
    deposit_block_number: normalizeHexNumber(8),
  });
}

export function NormalizeRawL2Transaction(
  rawL2Transaction: object,
  { debugPath = "raw_l2_transaction" } = {}
) {
  return normalizeObject(debugPath, rawL2Transaction, {
    from_id: normalizeHexNumber(4),
    to_id: normalizeHexNumber(4),
    nonce: normalizeHexNumber(4),
    args: normalizeRawData(-1),
  });
}

export function NormalizeL2Transaction(
  l2Transaction: L2Transaction,
  { debugPath = "l2_transaction" } = {}
) {
  return normalizeObject(debugPath, l2Transaction, {
    raw: toNormalize(NormalizeRawL2Transaction),
    signature: normalizeRawData(65),
  });
}

export function utfStringToHexString(value: string) {
  return "0x" + Buffer.from(value, "utf-8").toString("hex");
}

export function hexStringToUtfString(value: HexString) {
  if (!value.startsWith("0x") || value.length % 2)
    throw new Error(
      `${value} expected hex string with 0x and even number length`
    );

  return Buffer.from(value.slice(2), "hex").toString("utf-8");
}

export function NormalizeAbiType(
  value: AbiType,
  { debugPath = "abi_item_abi_type" } = {}
) {
  switch (value) {
    case "constructor":
      return 1;

    case "event":
      return 2;

    case "fallback":
      return 3;

    case "function":
      return 4;

    default:
      throw new Error(`${debugPath} has invalid value: ${value}`);
  }
}

export function NormalizeStateMutabilityType(
  value: StateMutabilityType,
  { debugPath = "abi_item_abi_type" } = {}
) {
  switch (value) {
    case "view":
      return 1;

    case "nonpayable":
      return 2;

    case "payable":
      return 3;

    case "pure":
      return 4;

    default:
      throw new Error(`${debugPath} has invalid value: ${value}`);
  }
}

export function NormalizeBoolean(
  value: boolean,
  { debugPath = "boolean" } = {}
) {
  switch (value) {
    case true:
      return 1;

    case false:
      return 2;

    default:
      throw new Error(`${debugPath} has invalid value: ${value}`);
  }
}

export function NormalizeAbiInput(
  _abiInput: AbiInput,
  { debugPath = "address_mapping_abi_item_input" } = {}
) {
  let abiInput = _.cloneDeep(_abiInput); //don't change origin abi
  abiInput.name = utfStringToHexString(abiInput.name);
  abiInput.type = utfStringToHexString(abiInput.type);
  const result = normalizeObject(debugPath, abiInput, {
    name: normalizeRawData(-1),
    type: normalizeRawData(-1),
  });
  if (abiInput.indexed != undefined) {
    result.indexed = NormalizeBoolean(abiInput.indexed, {
      debugPath: `${debugPath}.indexed`,
    });
  }
  if (abiInput.components) {
    result.components = abiInput.components.map((v) => NormalizeAbiInput(v));
  }
  if (abiInput.internalType) {
    result.internalType = normalizeRawData(-1)(
      debugPath,
      utfStringToHexString(abiInput.internalType)
    );
  }
  return result;
}

export function NormalizeAbiOutput(
  _abiOutput: AbiOutput,
  { debugPath = "address_mapping_abi_item_output" } = {}
) {
  let abiOutput = _abiOutput;
  abiOutput.name = utfStringToHexString(abiOutput.name);
  abiOutput.type = utfStringToHexString(abiOutput.type);
  const result = normalizeObject(debugPath, abiOutput, {
    name: normalizeRawData(-1),
    type: normalizeRawData(-1),
  });
  if (abiOutput.components) {
    result.components_ = abiOutput.components.map((v) => NormalizeAbiOutput(v));
  }
  if (abiOutput.internalType) {
    result.internalType_ = normalizeRawData(-1);
  }

  return result;
}

export function NormalizeAbiItem(
  _abiItem: AbiItem,
  { debugPath = "address_mapping_abi_item" } = {}
) {
  let abiItem = _.cloneDeep(_abiItem); // do not change the original abi;
  let result: any = {
    type: NormalizeAbiType(abiItem.type),
  };
  if (abiItem.name) {
    result.name = normalizeRawData(-1)(
      debugPath,
      utfStringToHexString(abiItem.name)
    );
  }
  if (abiItem.inputs) {
    result.inputs = abiItem.inputs!.map((v) => NormalizeAbiInput(v));
  }
  if (abiItem.outputs) {
    result.outputs = abiItem.outputs!.map((v) => NormalizeAbiOutput(v));
  }
  if (abiItem.payable != undefined) {
    result.payable = NormalizeBoolean(abiItem.payable!);
  }
  if (abiItem.anonymous != undefined) {
    result.anonymous = NormalizeBoolean(abiItem.anonymous!);
  }
  if (abiItem.constant != undefined) {
    result.constant = NormalizeBoolean(abiItem.constant!);
  }
  if (abiItem.stateMutability) {
    result.stateMutability = NormalizeStateMutabilityType(
      abiItem.stateMutability
    );
  }
  if (abiItem.gas) {
    result.gas = normalizeRawData(4)(debugPath, abiItem.stateMutability);
  }
  return result;
}

export function NormalizeAbiItems(
  _abiItems: AbiItem[],
  { debugPath = "address_mapping_abi_items" } = {}
) {
  let abiItems = _abiItems;
  return toNormalizeArray(NormalizeAbiItem)(debugPath, abiItems);
}

export function NormalizeAddressMappingItem(
  addressMappingItem: AddressMappingItem,
  { debugPath = "address_mapping_item" } = {}
) {
  return normalizeObject(debugPath, addressMappingItem, {
    eth_address: normalizeRawData(20),
    gw_short_address: normalizeRawData(20),
  });
}

export function NormalizeAddressMapping(
  addressMapping: AddressMapping,
  { debugPath = "address_mapping" } = {}
) {
  return normalizeObject(debugPath, addressMapping, {
    length: normalizeHexNumber(4),
    data: toNormalizeArray(toNormalize(NormalizeAddressMappingItem)),
  });
}

export function NormalizeL2TransactionWithAddressMapping(
  l2TransactionWithAddressMapping: L2TransactionWithAddressMapping,
  { debugPath = "l2_transaction_with_address_mapping" } = {}
) {
  return normalizeObject(debugPath, l2TransactionWithAddressMapping, {
    tx: toNormalize(NormalizeL2Transaction),
    addresses: toNormalize(NormalizeAddressMapping),
    extra: normalizeRawData(-1),
  });
}

export function NormalizeRawL2TransactionWithAddressMapping(
  rawL2TransactionWithAddressMapping: RawL2TransactionWithAddressMapping,
  { debugPath = "raw_l2_transaction_with_address_mapping" } = {}
) {
  return normalizeObject(debugPath, rawL2TransactionWithAddressMapping, {
    raw_tx: toNormalize(NormalizeRawL2Transaction),
    addresses: toNormalize(NormalizeAddressMapping),
    extra: normalizeRawData(-1),
  });
}

export function NormalizeRawWithdrawalRequest(
  raw_request: object,
  { debugPath = "raw_withdrawal_request" } = {}
) {
  return normalizeObject(debugPath, raw_request, {
    nonce: normalizeHexNumber(4),
    capacity: normalizeHexNumber(8),
    amount: normalizeHexNumber(16),
    sudt_script_hash: normalizeRawData(32),
    account_script_hash: normalizeRawData(32),
    sell_amount: normalizeHexNumber(16),
    sell_capacity: normalizeHexNumber(8),
    owner_lock_hash: normalizeRawData(32),
    payment_lock_hash: normalizeRawData(32),
  });
}

export function NormalizeWithdrawalRequest(
  request: WithdrawalRequest,
  { debugPath = "withdrawal_request" } = {}
) {
  return normalizeObject(debugPath, request, {
    raw: toNormalize(NormalizeRawWithdrawalRequest),
    signature: normalizeRawData(65),
  });
}

export interface UnionType {
  type: string;
  value: any;
}

export function NormalizeFee(fee: object, { debugPath = "fee" } = {}) {
  return normalizeObject(debugPath, fee, {
    sudt_id: normalizeHexNumber(4),
    amount: normalizeHexNumber(16),
  });
}

export function NormalizeCreateAccount(
  createAccount: object,
  { debugPath = "create_account" } = {}
) {
  return normalizeObject(debugPath, createAccount, {
    script: toNormalize(normalizers.NormalizeScript),
    fee: toNormalize(NormalizeFee),
  });
}

export interface SUDTQuery {
  account_id: HexNumber;
}

export function NormalizeSUDTQuery(
  sudt_query: object,
  { debugPath = "sudt_query" } = {}
) {
  return normalizeObject(debugPath, sudt_query, {
    account_id: normalizeHexNumber(4),
  });
}

export interface SUDTTransfer {
  to: HexString;
  amount: HexNumber;
  fee: HexNumber;
}

export function NormalizeSUDTTransfer(
  sudt_transfer: object,
  { debugPath = "sudt_transfer" } = {}
) {
  return normalizeObject(debugPath, sudt_transfer, {
    to: normalizeRawData(20),
    amount: normalizeHexNumber(16),
    fee: normalizeHexNumber(16),
  });
}

export function NormalizeWithdrawalLockArgs(
  withdrawal_lock_args: object,
  { debugPath = "withdrawal_lock_args" } = {}
) {
  return normalizeObject(debugPath, withdrawal_lock_args, {
    // the original deposit info
    // used for helping programs generate reverted custodian cell
    deposit_block_hash: normalizeRawData(32),
    deposit_block_number: normalizeHexNumber(8),
    // the original custodian lock hash
    withdrawal_block_hash: normalizeRawData(32),
    withdrawal_block_number: normalizeHexNumber(8),
    // buyer can pay sell_amount token to unlock
    sudt_script_hash: normalizeRawData(32),
    sell_amount: normalizeHexNumber(16),
    sell_capacity: normalizeHexNumber(8),
    // layer1 lock to withdraw after challenge period
    owner_lock_hash: normalizeRawData(32),
    // layer1 lock to receive the payment, must exists on the chain
    payment_lock_hash: normalizeRawData(32),
  });
}

export function NormalizeUnlockWithdrawalViaFinalize(
  unlock_withdrawal_finalize: object,
  { debugPath = "unlock_withdrawal_finalize" } = {}
) {
  return normalizeObject(debugPath, unlock_withdrawal_finalize, {
    block_proof: normalizeRawData(-1),
  });
}

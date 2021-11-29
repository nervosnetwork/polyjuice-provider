import { HexString } from "@ckb-lumos/base";
import { AddressMappingItem } from "@polyjuice-provider/godwoken/lib/addressTypes";
import { RawL2Transaction } from "@polyjuice-provider/godwoken";
import { Abi } from "./abi";
import {
  buildL2TransactionWithAddressMapping,
  buildRawL2TransactionWithAddressMapping,
  EthTransaction,
  formalizeEthToAddress,
  Godwoker,
  normalizeEthTransaction,
  splitByteCodeAndConstructorArgs,
} from "./util";
import { serializeAbiItem } from "./abi";
import { SigningMessageType } from "./types";
import {
  DEPLOY_CONTRACT_DOCS_LINK,
  EMPTY_ABI_ITEM_SERIALIZE_STR,
} from "./constant";
import _ from "lodash";
import { DEFAULT_EMPTY_ETH_ADDRESS, DeploymentRecords } from ".";

export type SerializeSignedTransactionString = HexString;

export enum ProcessTransactionType {
  send,
  call,
  estimateGas,
}

export interface Process {
  type: ProcessTransactionType;
  signingMethod?: (message: string) => string | Promise<string>;
  executeEstimateGasMethod?: any;
  signingMessageType?: SigningMessageType;
}

export async function buildSendTransaction(
  abi: Abi,
  godwoker: Godwoker,
  tx: EthTransaction,
  signingMethod: any,
  signingMessageType?: SigningMessageType
): Promise<SerializeSignedTransactionString> {
  const process: Process = {
    type: ProcessTransactionType.send,
    signingMethod: signingMethod,
    signingMessageType: signingMessageType,
  };
  const serializeTx = await buildProcess(abi, godwoker, tx, process);
  if (typeof serializeTx !== "string")
    throw new Error(
      "build sendTransaction end up with non-string type return!"
    );

  return serializeTx;
}

export async function executeCallTransaction(
  abi: Abi,
  godwoker: Godwoker,
  tx: EthTransaction
): Promise<string> {
  const process: Process = {
    type: ProcessTransactionType.call,
  };
  const callReturnData = await buildProcess(abi, godwoker, tx, process);
  if (typeof callReturnData !== "string")
    throw new Error("execute callTransaction end up with non-string return!");

  return callReturnData;
}

export async function buildEstimateGasTransaction(
  abi: Abi,
  godwoker: Godwoker,
  tx: EthTransaction
): Promise<RawL2Transaction> {
  const process: Process = {
    type: ProcessTransactionType.call,
  };
  const rawL2Tx = await buildProcess(abi, godwoker, tx, process);
  if (typeof rawL2Tx === "string")
    throw new Error("build estimateGasTransaction end up with string return!");

  if (!isRawL2Transaction(rawL2Tx))
    throw new Error(
      "build estimateGasTransaction end up with invalid RawL2Transaction type return!"
    );

  return rawL2Tx;
}

// one special type transaction: contract deployment.
// to address must be zero address and must be a send transaction
// we can't convert address for contract deployment since:
//  (1. it doesn't have a function signature in eth_tx's input data
//  (2. we support multiple contract ABIs
// thus it is impossible to identified a deploy transaction's abiItem and do the address converting
// instead, we ask developer to explicitly convert the address while we recorded some info to build address mapping if needed.
export async function buildDeployProcess(
  deployAddressMapping: AddressMappingItem[],
  deploymentRecords: DeploymentRecords,
  abi: Abi,
  godwoker: Godwoker,
  tx: EthTransaction,
  signingMethod: any,
  signingMessageType_?: SigningMessageType
): Promise<SerializeSignedTransactionString> {
  const process: Process = {
    type: ProcessTransactionType.send,
    signingMethod: signingMethod,
    signingMessageType: signingMessageType_,
  };
  if (formalizeEthToAddress(tx.to) != DEFAULT_EMPTY_ETH_ADDRESS) {
    throw new Error(`deployTransaction must be a zero to address transaction`);
  }
  if (!tx.from) {
    throw new Error("tx.from can not be missing in sendTransaction!");
  }
  if (!process.signingMethod) {
    throw new Error(
      "process.signingMethod can not be missing in deployTransaction!"
    );
  }

  const t = normalizeEthTransaction({
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gas: tx.gas,
    gasPrice: tx.gasPrice,
    data: tx.data,
  });

  const rawL2Tx = await godwoker.assembleRawL2Transaction(t);

  const signingMessageType =
    process.signingMessageType || SigningMessageType.withPrefix;

  // generate message to sign
  const senderScriptHash = godwoker.computeScriptHashByEoaEthAddress(t.from);
  const receiverScriptHash = await godwoker.getScriptHashByAccountId(
    parseInt(rawL2Tx.to_id, 16)
  );
  const message = godwoker.generateTransactionMessageToSign(
    rawL2Tx,
    senderScriptHash,
    receiverScriptHash,
    signingMessageType === SigningMessageType.withPrefix
  );

  const _signature = await process.signingMethod!(message);
  const signature = godwoker.packSignature(_signature);
  const l2Tx = { raw: rawL2Tx, signature: signature };

  const result = splitByteCodeAndConstructorArgs(tx.data, deploymentRecords);
  if (result == undefined) {
    // let's build a standard send transaction
    // since we can't find matched deploymentRecords
    // here we should notify user the standard way to deploy contract
    console.log(
      `Are you trying to deploy contract? If so, we should use the standard way to convert the constructor arguments in case some unexpected behavior. you can check more at ${DEPLOY_CONTRACT_DOCS_LINK} \n`
    );
    return buildSendTransaction(
      abi,
      godwoker,
      tx,
      signingMethod,
      signingMessageType_
    );
  }

  const abiItem = deploymentRecords[result.signature];
  const _abiItem = _.cloneDeep(abiItem); // do not change the original abi object
  let serializedAbiItem = serializeAbiItem(_abiItem);

  const polyL2Tx = buildL2TransactionWithAddressMapping(
    l2Tx,
    deployAddressMapping,
    serializedAbiItem
  );
  return godwoker.serializeL2TransactionWithAddressMapping(polyL2Tx);
}

export async function buildProcess(
  abi: Abi,
  godwoker: Godwoker,
  tx: EthTransaction,
  process: Process
): Promise<HexString | RawL2Transaction> {
  if (!tx.from && process.type === ProcessTransactionType.send) {
    throw new Error("tx.from can not be missing in sendTransaction!");
  }
  if (!process.signingMethod && process.type === ProcessTransactionType.send) {
    throw new Error(
      "process.signingMethod can not be missing in sendTransaction!"
    );
  }
  if (
    process.type === ProcessTransactionType.estimateGas &&
    !process.executeEstimateGasMethod
  ) {
    throw new Error(
      "executeEstimateGasMethod can not be missing in estimateGas!"
    );
  }

  tx.from = tx.from || godwoker.default_from_address!;

  let addressMappingItemVec: AddressMappingItem[] = [];
  function setAddressMappingItemVec(
    _addressMappingItemVec: AddressMappingItem[]
  ) {
    addressMappingItemVec = _addressMappingItemVec;
  }

  let dataWithShortAddress;
  dataWithShortAddress = await abi.refactor_data_with_short_address(
    tx.data,
    godwoker.getShortAddressByAllTypeEthAddress.bind(godwoker),
    setAddressMappingItemVec
  );

  const t = normalizeEthTransaction({
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gas: tx.gas,
    gasPrice: tx.gasPrice,
    data: dataWithShortAddress,
  });

  const rawL2Tx = await godwoker.assembleRawL2Transaction(t);

  switch (process.type) {
    case ProcessTransactionType.send: {
      const signingMessageType =
        process.signingMessageType || SigningMessageType.withPrefix;

      // generate message to sign
      const senderScriptHash = godwoker.computeScriptHashByEoaEthAddress(
        t.from
      );
      const receiverScriptHash = await godwoker.getScriptHashByAccountId(
        parseInt(rawL2Tx.to_id, 16)
      );
      const message = godwoker.generateTransactionMessageToSign(
        rawL2Tx,
        senderScriptHash,
        receiverScriptHash,
        signingMessageType === SigningMessageType.withPrefix
      );

      const _signature = await process.signingMethod!(message);
      const signature = godwoker.packSignature(_signature);
      const l2Tx = { raw: rawL2Tx, signature: signature };
      let serializedAbiItem = buildSerializeAddressMappingAbiItem(
        abi,
        dataWithShortAddress
      );
      const polyL2Tx = buildL2TransactionWithAddressMapping(
        l2Tx,
        addressMappingItemVec,
        serializedAbiItem
      );
      return godwoker.serializeL2TransactionWithAddressMapping(polyL2Tx);
    }

    case ProcessTransactionType.call: {
      let serializedAbiItem = buildSerializeAddressMappingAbiItem(
        abi,
        dataWithShortAddress
      );
      const polyRawL2Tx = buildRawL2TransactionWithAddressMapping(
        rawL2Tx,
        addressMappingItemVec,
        serializedAbiItem
      );
      const run_result = await godwoker.poly_executeRawL2Transaction(
        polyRawL2Tx
      );

      const abi_item = abi.get_interested_abi_item_by_encoded_data(tx.data);
      if (!abi_item) return run_result.return_data;

      return await abi.refactor_return_value_with_short_address(
        run_result.return_data,
        abi_item,
        godwoker.getEthAddressByAllTypeShortAddress.bind(godwoker)
      );
    }

    case ProcessTransactionType.estimateGas: {
      return rawL2Tx;
    }

    default:
      throw new Error("unknown process type!");
  }
}

export function buildSerializeAddressMappingAbiItem(abi: Abi, data: HexString) {
  const abiItem = abi.get_interested_abi_item_by_encoded_data(data);
  if (!abiItem) return EMPTY_ABI_ITEM_SERIALIZE_STR;

  const abiInputs = abi.filter_interested_inputs(abiItem);
  if (abiInputs.length === 0) return EMPTY_ABI_ITEM_SERIALIZE_STR; // we only want abiItem with interested inputs not outputs

  const _abiItem = _.cloneDeep(abiItem); // do not change the original abi object
  return serializeAbiItem(_abiItem);
}

function isRawL2Transaction(value: any): value is RawL2Transaction {
  return (
    (<RawL2Transaction>value).from_id != undefined &&
    (<RawL2Transaction>value).to_id != undefined &&
    (<RawL2Transaction>value).nonce != undefined &&
    (<RawL2Transaction>value).args != undefined
  );
}

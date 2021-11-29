import {
  provider,
  AccountsBase,
  TransactionConfig,
  SignedTransaction,
} from "web3-core";
import {
  Abi,
  AbiItems,
  EthTransaction,
  formalizeEthToAddress,
  Godwoker,
  GodwokerOption,
  PolyjuiceConfig,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  buildSendTransaction,
  deserializeL2TransactionWithAddressMapping,
  convertContractConstructorArgs,
  DEFAULT_EMPTY_ETH_ADDRESS,
  buildDeployProcess,
  DeploymentRecords,
} from "@polyjuice-provider/base";
import BN from "bn.js";
import Account from "eth-lib/lib/account";
import { utils as lumosUtils } from "@ckb-lumos/base";
import { normalizer, RawL2Transaction } from "@polyjuice-provider/godwoken";
import { SerializeRawL2Transaction } from "@polyjuice-provider/godwoken/schemas";
import { AddressMappingItem } from "@polyjuice-provider/godwoken/lib/addressTypes";
// do not change the following require to import, otherwise it will cause error.
// the original web3-eth-accounts Account class is exported by module.exports.
const Accounts = require("web3-eth-accounts");

export interface PolyjuiceAccounts extends AccountsBase {
  constructor(polyjuiceConfig: PolyjuiceConfig, provider?: provider);
}

export class PolyjuiceAccounts extends Accounts {
  godwoker: Godwoker;
  abi: Abi;
  deployAddressMapping: AddressMappingItem[];
  deploymentRecords: DeploymentRecords;

  constructor(polyjuiceConfig: PolyjuiceConfig, provider?: provider) {
    if (provider) {
      super(provider);
    } else {
      super();
    }

    if (!polyjuiceConfig.web3Url) {
      throw new Error("should support web3 rpc url in PolyjuiceConfig.");
    }

    const godwokerOption: GodwokerOption = {
      godwoken: {
        rollup_type_hash: polyjuiceConfig.rollupTypeHash,
        eth_account_lock: {
          code_hash: polyjuiceConfig.ethAccountLockCodeHash,
          hash_type: "type",
        },
      },
      polyjuice: {
        creator_id: polyjuiceConfig.creatorId,
        default_from_address: polyjuiceConfig.defaultFromAddress,
      },
    };
    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwokerOption);
    this.abi = new Abi(polyjuiceConfig.abiItems || []);
    this.deployAddressMapping = [];
    this.deploymentRecords = {};
  }

  setAbi(abiItems: AbiItems) {
    this.abi = new Abi(abiItems);
  }

  setMultiAbi(abiItemsArray: AbiItems[]) {
    const abiItems = [].concat.apply([], abiItemsArray);
    this.abi = new Abi(abiItems);
  }

  addAbi(_abiItems: AbiItems) {
    const abiItems = this.abi.get_abi_items().concat(_abiItems);
    this.abi = new Abi(abiItems);
  }

  async convertDeployArgs(args: any[], abiItems: AbiItems, bytecode: string) {
    const convertResult = await convertContractConstructorArgs(
      args,
      abiItems,
      bytecode,
      this.godwoker.getShortAddressByAllTypeEthAddress.bind(this.godwoker)
    );

    // later when sending this deployment transaction,
    // we will submit this.deployContractAddressMapping to web3 as well,
    // for saving address mapping if needed.
    this.deployAddressMapping = convertResult.addressMapping;
    // deploymentRecords will be used to extract constructor args from eth_tx's input data
    this.deploymentRecords = {
      ...this.deploymentRecords,
      ...convertResult.deploymentRecords,
    };

    return convertResult.newArgs;
  }

  signTransaction(
    _tx: TransactionConfig,
    privateKey: string,
    callback?: (error: Error, signedTransaction?: SignedTransaction) => void
  ): Promise<SignedTransaction> {
    const that = this;
    callback = callback || function () {};

    if (!_tx) {
      const error = new Error("No transaction object given!");

      callback(error);
      return Promise.reject(error);
    }

    if (!_tx.from) {
      _tx.from = this.privateKeyToAccount(privateKey).address;
    }

    // use godwoken-polyjuice transaction signing method
    // (which is different tx structure and use a message signing)
    // to sign transaction.
    let tx = transactionConfigToPolyjuiceEthTransaction(_tx);
    try {
      // do init incase user not passing config parameter during construction
      return this.godwoker.initSync().then(async function () {
        let message: string = null;
        const signingMethod = (_message: string) => {
          message = _message;
          return Account.sign(message, privateKey);
        };

        const rawTx =
          tx.to === DEFAULT_EMPTY_ETH_ADDRESS
            ? await buildDeployProcess(
                that.deployAddressMapping,
                that.deploymentRecords,
                that.abi,
                that.godwoker,
                tx,
                signingMethod.bind(that)
              )
            : await buildSendTransaction(
                that.abi,
                that.godwoker,
                tx,
                signingMethod
              );

        const deRawTx = deserializeL2TransactionWithAddressMapping(rawTx);
        let result = {
          messageHash: message,
          v: "0x0", // todo: replace with real v
          r: "0x0", // todo: replace with real r
          s: deRawTx.tx.signature,
          rawTransaction: rawTx,
          transactionHash: calcPolyjuiceTxHash(deRawTx.tx.raw),
        };
        callback(null, result);
        return Promise.resolve(result);
      });
    } catch (error) {
      callback(error);
      return Promise.reject(error);
    }
  }
}

export function transactionConfigToPolyjuiceEthTransaction(
  tx: TransactionConfig
) {
  let { from, to, value, gas, gasPrice, data, nonce } = tx;

  if (!from) {
    throw new Error("from is missing!");
  }

  if (typeof from === "number") {
    //todo: handle from is number
    throw new Error("todo: handle from is number case!");
  }

  return formatEthTransaction({ from, to, value, gas, gasPrice, data, nonce });
}

// todo: remove to @polyjuice-provider/base
export function formatEthTransaction({
  from,
  to,
  value,
  gas,
  gasPrice,
  data,
  nonce,
}) {
  const ethTx: EthTransaction = {
    from: from,
    to: formalizeEthToAddress(to),
    value: value ? TxConfigValueTypeToString(value) : "0x00",
    gas: gas
      ? TxConfigValueTypeToString(gas)
      : `0x${BigInt(POLY_MAX_TRANSACTION_GAS_LIMIT).toString(16)}`,
    gasPrice: gasPrice
      ? TxConfigValueTypeToString(gasPrice)
      : `0x${BigInt(POLY_MIN_GAS_PRICE).toString(16)}`,
    data: data || "0x00",
    nonce: nonce ? TxConfigValueTypeToString(nonce) : "0x1",
  };
  return ethTx;
}

export function TxConfigValueTypeToString(value: number | string | BN) {
  if (typeof value === "string") {
    value = "0x" + BigInt(value).toString(16);
  }
  if (typeof value === "number") {
    value = "0x" + BigInt(value).toString(16);
  }
  if (typeof value !== "string" || typeof value !== "number") {
    // BN.js type
    value = value.toString(16);
  }
  return value;
}

// todo: move to @polyjuice-provider/godwoken
export function calcPolyjuiceTxHash(tx: RawL2Transaction) {
  const tx_hash = lumosUtils
    .ckbHash(
      SerializeRawL2Transaction(normalizer.NormalizeRawL2Transaction(tx))
    )
    .serializeJson();
  return tx_hash;
}

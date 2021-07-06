import { Accounts, Wallet } from "web3-eth-accounts";
import { TransactionConfig, SignedTransaction } from "web3-core";
import {
  Abi,
  EthTransaction,
  Godwoker,
  GodwokerOption,
} from "@polyjuice-provider/base";
import { PolyjuiceConfig } from "./index";
import BN from "bn.js";
import Account from "eth-lib/lib/account";

export interface PolyjuiceAccounts extends Accounts {
  constructor(polyjuiceConfig: PolyjuiceConfig);
}

export class PolyjuiceAccounts extends Accounts {
  godwoker: Godwoker;
  abi: Abi;

  constructor(polyjuiceConfig: PolyjuiceConfig) {
    super();
    if (!polyjuiceConfig.web3Url) {
      throw new Error("should support web3 rpc url in PolyjuiceConfig.");
    }

    const godwokerOption: GodwokerOption = {
      godwoken: {
        rollup_type_hash: polyjuiceConfig.ethAccountLockCodeHash,
        eth_account_lock: {
          code_hash: polyjuiceConfig.ethAccountLockCodeHash,
          hash_type: "type",
        },
      },
    };
    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwokerOption);
    this.abi = new Abi(polyjuiceConfig.abiItems || []);
  }

  signTransaction(
    _tx: TransactionConfig,
    privateKey: string,
    callback?: (error: Error, signedTransaction?: SignedTransaction) => void
  ): Promise<SignedTransaction> {
    callback = callback || function () {};

    if (!_tx) {
      const error = new Error("No transaction object given!");

      callback(error);
      return Promise.reject(error);
    }

    // use godwoken-polyjuice's transaction signing method
    // (which is deifferent tx structure and use a message signing)
    // to sign transaction.
    var tx = transactionConfigToPolyjuiceEthTransaction(_tx);

    try {
      // Otherwise, get the missing info from the Ethereum Node
      return Promise.all([
        this.godwoker.assembleRawL2Transaction(tx),
        this.godwoker.generateMessageFromEthTransaction(tx),
      ]).then(function (args) {
        if (!args[0] || !args[1]) {
          const error = new Error(
            "assembleRawL2Transaction or generateMessageFromEthTransaction is failed."
          );
          callback(error);
          return Promise.reject(error);
        }

        const polyjuice_tx = args[0];
        const message = args[1];
        const _signature = Account.sign(message, privateKey);
        const signature = this.godwoker.packSignature(_signature);
        const l2_tx = { raw: polyjuice_tx, signature: signature };

        var result = {
          messageHash: message,
          v: "0x0", // todo: replace with real v
          r: "0x0", // todo: replace with real r
          s: signature,
          rawTransaction: this.godwoker.serializeL2Transaction(l2_tx), // todo: replace with eth raw tx isntead of godwoken raw tx
          transactionHash: "",
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
  var { from, to, value, gas, gasPrice, data, nonce } = tx;

  if (typeof from === "number") {
    //todo: handle from is number
    throw new Error("todo: handle from is number case!");
  }

  const ethTx: EthTransaction = {
    from: from,
    to: to || `0x${"0".repeat(40)}`,
    value: TxConfigValueTypeToString(value),
    gas: TxConfigValueTypeToString(gasPrice),
    data: TxConfigValueTypeToString(gasPrice),
    nonce: TxConfigValueTypeToString(nonce),
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
  if (typeof value != "string" || typeof value != "number") {
    // BN.js type
    value = value.toString(16);
  }
  return value;
}

import { providers } from "ethers";
import { Transaction } from "@ethersproject/transactions";
import { hexDataLength, hexlify } from "@ethersproject/bytes";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { ConnectionInfo } from "@ethersproject/web";
import { Networkish } from "@ethersproject/networks";
import {
  Godwoker,
  GodwokerOption,
  PolyjuiceConfig,
  Abi,
  AbiItems,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  verifyHttpUrl,
  executeCallTransaction,
} from "@polyjuice-provider/base";

import { Logger } from "@ethersproject/logger";
const logger = new Logger("Polyjuice-Provider/0.0.1");

// instant-finality feature of Godwoken enable very quick tx-receipt fetching,
// so you do not need to wait for blocks to get transaction
const WAIT_TRANSACTION_TIMEOUT_MILSECS = 20 * 1000; // 20 seconds
const WAIT_TRANSACTION_INTERVAL_MILSECS = 500; // 500ms

export interface PolyjuiceJsonRpcProvider extends providers.JsonRpcProvider {
  constructor(
    polyjuiceConfig: PolyjuiceConfig,
    url?: ConnectionInfo | string,
    network?: Networkish
  );
}

export class PolyjuiceJsonRpcProvider extends providers.JsonRpcProvider {
  abi: Abi;
  godwoker: Godwoker;
  enableInstantFinalityForReceipt: boolean;

  constructor(
    polyjuiceConfig: PolyjuiceConfig,
    url?: ConnectionInfo | string,
    network?: Networkish,
    enableInstantFinalityForReceipt: boolean = true
  ) {
    super(url, network);
    const abi_items: AbiItems = polyjuiceConfig.abiItems || [];
    this.abi = new Abi(abi_items);
    const web3_url = typeof url === "string" ? url : url.url;
    const godwoker_option: GodwokerOption = {
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
    this.godwoker = new Godwoker(web3_url, godwoker_option);
    this.enableInstantFinalityForReceipt = enableInstantFinalityForReceipt;
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

  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<TransactionResponse> {
    await this.getNetwork();
    const hexTx = await Promise.resolve(signedTransaction).then((t) =>
      hexlify(t)
    );
    //const tx = this.formatter.transaction(signedTransaction);
    const blockNumber = await this._getInternalBlockNumber(
      100 + 2 * this.pollingInterval
    );
    try {
      const hash = await this.perform("sendTransaction", {
        signedTransaction: hexTx,
      });
      // TODO replace with real eth tx deserialize from godwoken signed tx serialized hex string
      const fake_tx: Transaction = {
        hash: hash,
        from: "0x",
        nonce: 0,
        gasLimit: BigNumber.from("0x00"),
        gasPrice: BigNumber.from("0x00"),
        data: "0x00",
        value: BigNumber.from("0x00"),
        chainId: 3,
      };
      return _wrapTransaction.bind(this)(
        fake_tx,
        hash,
        blockNumber,
        this.enableInstantFinalityForReceipt
      );
    } catch (error) {
      (<any>error).transaction = null;
      (<any>error).transactionHash = null;
      throw error;
    }
  }

  async send(method: string, params: Array<any>): Promise<any> {
    await this.godwoker.init();
    switch (method) {
      case "eth_call":
        try {
          params[0].from = params[0].from || this.godwoker.default_from_address;
          params[0].gas =
            params[0].gas ||
            `0x${BigInt(POLY_MAX_TRANSACTION_GAS_LIMIT).toString(16)}`;
          params[0].gasPrice =
            params[0].gasPrice ||
            `0x${BigInt(POLY_MIN_GAS_PRICE).toString(16)}`;
          params[0].value = params[0].value || "0x00";

          const t = params[0];
          return await executeCallTransaction(this.abi, this.godwoker, t);
        } catch (error) {
          this.emit("debug", {
            action: "response",
            error: error,
            provider: this,
          });

          throw error;
        }

      case "eth_estimateGas":
        try {
          const { data } = params[0];
          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              )
            );
          params[0].data = data_with_short_address;
          params[0].from = params[0].from || this.godwoker.default_from_address;
          return super.send(method, params); // todo: this should send and parse by provider
        } catch (error) {
          this.emit("debug", {
            action: "response",
            error: error,
            provider: this,
          });

          throw error;
        }

      default:
        return super.send(method, params);
    }
  }

  prepareRequest(method: string, params: any): [string, Array<any>] {
    switch (method) {
      case "sendTransaction":
        return ["poly_submitL2Transaction", [params.signedTransaction]];

      default:
        return super.prepareRequest(method, params);
    }
  }
}

let NextId = 1;

export interface PolyjuiceWebsocketProvider
  extends providers.WebSocketProvider {
  constructor(
    polyjuiceConfig: PolyjuiceConfig,
    url: string,
    network?: Networkish
  );
}

export class PolyjuiceWebsocketProvider extends providers.WebSocketProvider {
  abi: Abi;
  godwoker: Godwoker;
  enableInstantFinalityForReceipt: boolean;

  constructor(
    polyjuiceConfig: PolyjuiceConfig,
    url: string,
    network?: Networkish,
    enableInstantFinalityForReceipt: boolean = true
  ) {
    super(url, network);
    const godwoker_option: GodwokerOption = {
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
    if (!polyjuiceConfig.web3Url || !verifyHttpUrl(polyjuiceConfig.web3Url)) {
      throw new Error(
        "You must provide web3 http-protocol URL in PolyjuiceConfig when using polyjuice websocket provider. this restrict might be removed in the future. but right now, please bear with this method."
      );
    }
    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwoker_option);
    const abi_items: AbiItems = polyjuiceConfig.abiItems || [];
    this.abi = new Abi(abi_items);
    this.enableInstantFinalityForReceipt = enableInstantFinalityForReceipt;
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

  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<TransactionResponse> {
    await this.getNetwork();
    const hexTx = await Promise.resolve(signedTransaction).then((t) =>
      hexlify(t)
    );
    //const tx = this.formatter.transaction(signedTransaction);
    const blockNumber = await this._getInternalBlockNumber(
      100 + 2 * this.pollingInterval
    );
    try {
      const hash = await this.perform("sendTransaction", {
        signedTransaction: hexTx,
      });
      // TODO replace with real eth tx deserialize from godwoken signed tx serialized hex string
      const fake_tx: Transaction = {
        hash: hash,
        from: "0x",
        nonce: 0,
        gasLimit: BigNumber.from("0x00"),
        gasPrice: BigNumber.from("0x00"),
        data: "0x00",
        value: BigNumber.from("0x00"),
        chainId: 3,
      };

      return _wrapTransaction.bind(this)(
        fake_tx,
        hash,
        blockNumber,
        this.enableInstantFinalityForReceipt
      );
    } catch (error) {
      (<any>error).transaction = null;
      (<any>error).transactionHash = null;
      throw error;
    }
  }

  prepareRequest(method: string, params: any): [string, Array<any>] {
    switch (method) {
      case "sendTransaction":
        return ["poly_submitL2Transaction", [params.signedTransaction]];

      default:
        return super.prepareRequest(method, params);
    }
  }

  send(method: string, params?: Array<any>): Promise<any> {
    const rid = NextId++;

    return new Promise(async (resolve, reject) => {
      function callback(error: Error, result: any) {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }

      const payload = JSON.stringify({
        method: method,
        params: params,
        id: rid,
        jsonrpc: "2.0",
      });

      this.emit("debug", {
        action: "request",
        request: JSON.parse(payload),
        provider: this,
      });

      this._requests[String(rid)] = { callback, payload };

      if (this._wsReady) {
        await this.godwoker.init();

        switch (method) {
          case "eth_call":
            try {
              params[0].from =
                params[0].from || this.godwoker.default_from_address;
              params[0].gas =
                params[0].gas ||
                `0x${BigInt(POLY_MAX_TRANSACTION_GAS_LIMIT).toString(16)}`;
              params[0].gasPrice =
                params[0].gasPrice ||
                `0x${BigInt(POLY_MIN_GAS_PRICE).toString(16)}`;
              params[0].value = params[0].value || "0x00";

              const t = params[0];
              const return_value = await executeCallTransaction(
                this.abi,
                this.godwoker,
                t
              );
              return callback(null, return_value);
            } catch (error) {
              this.emit("debug", {
                action: "response",
                error: error,
                provider: this,
              });

              return callback(error, null);
            }

          case "eth_estimateGas":
            try {
              const { data } = params[0];
              const data_with_short_address =
                await this.abi.refactor_data_with_short_address(
                  data,
                  this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                    this.godwoker
                  )
                );
              params[0].data = data_with_short_address;
              params[0].from =
                params[0].from || this.godwoker.default_from_address;
              return this._websocket.send(payload); // this should handle and parse by provider
            } catch (error) {
              this.emit("debug", {
                action: "response",
                error: error,
                provider: this,
              });

              return callback(error, null);
            }

          default:
            return this._websocket.send(payload);
        }
      }
    });
  }
}

// overwrite _wrapTransaction with instant-finality option.
export function _wrapTransaction(
  tx: Transaction,
  hash?: string,
  startBlock?: number,
  instantFinality?: boolean
): TransactionResponse {
  // by default we turn on the instantFinality feature
  if (instantFinality == null) {
    instantFinality = true;
  }

  if (hash != null && hexDataLength(hash) !== 32) {
    throw new Error("invalid response - sendTransaction");
  }

  const result = <TransactionResponse>tx;

  // Check the hash we expect is the same as the hash the server reported
  if (hash != null && tx.hash !== hash) {
    logger.throwError(
      "Transaction hash mismatch from Provider.sendTransaction.",
      Logger.errors.UNKNOWN_ERROR,
      { expectedHash: tx.hash, returnedHash: hash }
    );
  }

  result.wait = async (confirms?: number, timeout?: number) => {
    if (confirms == null) {
      confirms = 1;
    }
    if (timeout == null) {
      timeout = 0;
    }

    // Get the details to detect replacement
    let replacement = undefined;
    if (confirms !== 0 && startBlock != null) {
      replacement = {
        data: tx.data,
        from: tx.from,
        nonce: tx.nonce,
        to: tx.to,
        value: tx.value,
        startBlock,
      };
    }

    // const waitTransaction = `wait-transaction-instantFinality-turn-on:${instantFinality} =>`;
    // console.time(waitTransaction);
    if (instantFinality == true) {
      try {
        await (this.godwoker as Godwoker).waitForTransactionReceipt(
          tx.hash,
          WAIT_TRANSACTION_TIMEOUT_MILSECS,
          WAIT_TRANSACTION_INTERVAL_MILSECS
        );
      } catch (error) {
        console.log(
          `instant-finality failed: unable to fetch ${tx.hash} tx receipt under ${WAIT_TRANSACTION_TIMEOUT_MILSECS} ms. continue.`
        );
      }
    }
    // console.timeEnd(waitTransaction);

    // const fetchReceiptTime = `fetch-receipt-instantFinality-turn-on:${instantFinality} =>`;
    // console.time(fetchReceiptTime);
    const receipt = await this._waitForTransaction(
      tx.hash,
      confirms,
      timeout,
      replacement
    );
    // console.timeEnd(fetchReceiptTime);
    if (receipt == null && confirms === 0) {
      return null;
    }

    // No longer pending, allow the polling loop to garbage collect this
    this._emitted["t:" + tx.hash] = receipt.blockNumber;

    if (receipt.status === 0) {
      logger.throwError("transaction failed", Logger.errors.CALL_EXCEPTION, {
        transactionHash: tx.hash,
        transaction: tx,
        receipt: receipt,
      });
    }
    return receipt;
  };

  return result;
}

PolyjuiceJsonRpcProvider.prototype._wrapTransaction = _wrapTransaction.bind(
  PolyjuiceJsonRpcProvider
);
PolyjuiceWebsocketProvider.prototype._wrapTransaction = _wrapTransaction.bind(
  PolyjuiceWebsocketProvider
);

export default { PolyjuiceJsonRpcProvider, PolyjuiceWebsocketProvider };

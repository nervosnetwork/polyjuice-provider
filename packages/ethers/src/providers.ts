import { providers } from "ethers";
import { Transaction } from "@ethersproject/transactions";
import { hexlify } from "@ethersproject/bytes";
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
} from "@polyjuice-provider/base";

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

  constructor(
    polyjuice_config: PolyjuiceConfig,
    url?: ConnectionInfo | string,
    network?: Networkish
  ) {
    super(url, network);
    const abi_items: AbiItems = polyjuice_config.abiItems || [];
    this.abi = new Abi(abi_items);
    const web3_url = typeof url === "string" ? url : url.url;
    const godwoker_option: GodwokerOption = {
      godwoken: {
        rollup_type_hash: polyjuice_config.rollupTypeHash,
        eth_account_lock: {
          code_hash: polyjuice_config.ethAccountLockCodeHash,
          hash_type: "type",
        },
      },
    };
    this.godwoker = new Godwoker(web3_url, godwoker_option);
  }

  setAbi(abiItems: AbiItems) {
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
      // TODO replace with real eth tx unserialize from godwoken signed tx serialized hex string
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
      return this._wrapTransaction(fake_tx, hash, blockNumber);
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
          const { data } = params[0];
          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              )
            );
          // todo: use an common method to format params
          params[0].from =
            params[0].from ||
            (await this.godwoker.getPolyjuiceDefaultFromAddress());
          params[0].data = data_with_short_address;
          params[0].gas =
            params[0].gas ||
            `0x${BigInt(POLY_MAX_TRANSACTION_GAS_LIMIT).toString(16)}`;
          params[0].gasPrice =
            params[0].gasPrice ||
            `0x${BigInt(POLY_MIN_GAS_PRICE).toString(16)}`;
          params[0].value = params[0].value || "0x00";

          const t = params[0];
          const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);

          const run_result = await this.godwoker.gw_executeRawL2Transaction(
            polyjuice_tx
          );

          const abi_item =
            this.abi.get_intereted_abi_item_by_encoded_data(data);

          if (!abi_item) return run_result.return_data;

          const return_value_with_short_address =
            await this.abi.refactor_return_value_with_short_address(
              run_result.return_data,
              abi_item,
              this.godwoker.getEthAddressByAllTypeShortAddress.bind(
                this.godwoker
              )
            );
          return return_value_with_short_address;
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
          params[0].from =
            params[0].from ||
            (await this.godwoker.getPolyjuiceDefaultFromAddress());
          return super.send(method, params);
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
        return ["gw_submit_l2transaction", [params.signedTransaction]];

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

  constructor(
    polyjuiceConfig: PolyjuiceConfig,
    url: string,
    network?: Networkish
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
    };
    if (!polyjuiceConfig.web3Url || !verifyHttpUrl(polyjuiceConfig.web3Url)) {
      throw new Error(
        "You must provide web3 http-protocol URL in PolyjuiceConfig when using polyjuice websocket provider. this restrict might be removed in the future. but right now, please bear with this method."
      );
    }
    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwoker_option);
    const abi_items: AbiItems = polyjuiceConfig.abiItems || [];
    this.abi = new Abi(abi_items);
  }

  setAbi(abiItems: AbiItems) {
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
      // TODO replace with real eth tx unserialize from godwoken signed tx serialized hex string
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
      return this._wrapTransaction(fake_tx, hash, blockNumber);
    } catch (error) {
      (<any>error).transaction = null;
      (<any>error).transactionHash = null;
      throw error;
    }
  }

  prepareRequest(method: string, params: any): [string, Array<any>] {
    switch (method) {
      case "sendTransaction":
        return ["gw_submit_l2transaction", [params.signedTransaction]];

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
              const { data } = params[0];
              const data_with_short_address =
                await this.abi.refactor_data_with_short_address(
                  data,
                  this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                    this.godwoker
                  )
                );
              // todo: use an common method to format params
              params[0].from =
                params[0].from ||
                (await this.godwoker.getPolyjuiceDefaultFromAddress());
              params[0].data = data_with_short_address;
              params[0].gas =
                params[0].gas ||
                `0x${BigInt(POLY_MAX_TRANSACTION_GAS_LIMIT).toString(16)}`;
              params[0].gasPrice =
                params[0].gasPrice ||
                `0x${BigInt(POLY_MIN_GAS_PRICE).toString(16)}`;
              params[0].value = params[0].value || "0x00";

              const t = params[0];
              const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(
                t
              );

              const run_result = await this.godwoker.gw_executeRawL2Transaction(
                polyjuice_tx
              );

              const abi_item =
                this.abi.get_intereted_abi_item_by_encoded_data(data);

              if (!abi_item) return callback(null, run_result.return_data);

              const return_value_with_short_address =
                await this.abi.refactor_return_value_with_short_address(
                  run_result.return_data,
                  abi_item,
                  this.godwoker.getEthAddressByAllTypeShortAddress.bind(
                    this.godwoker
                  )
                );

              return callback(null, return_value_with_short_address);
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
                params[0].from ||
                (await this.godwoker.getPolyjuiceDefaultFromAddress());
              return this._websocket.send(payload);
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

export default { PolyjuiceJsonRpcProvider, PolyjuiceWebsocketProvider };

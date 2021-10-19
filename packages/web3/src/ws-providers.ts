import { WebsocketProvider } from "web3-providers-ws";
import { WebsocketProviderOptions } from "web3-core-helpers";
import {
  Abi,
  verifyHttpUrl,
  formalizeEthToAddress,
  Godwoker,
  GodwokerOption,
  PolyjuiceConfig,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  Signer,
  AbiItems,
  buildSendTransaction,
  executeCallTransaction,
  SigningMessageType,
} from "@polyjuice-provider/base";
import {
  errors,
  JsonRpcPayload,
  JsonRpcResponse,
  RequestItem,
} from "web3-core-helpers";

const Web3WsProvider = require("web3-providers-ws");

export interface PolyjuiceWebsocketProvider
  extends Omit<WebsocketProvider, "requestQueue" | "responseQueue"> {
  godwoker: Godwoker;
  abi: Abi;
  signer: Signer;
  requestQueue: Map<number | string, RequestItem>;
  responseQueue: Map<number | string, RequestItem>;

  constructor(
    host: string,
    polyjuiceConfig: PolyjuiceConfig,
    option?: WebsocketProviderOptions
  );
  send(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): Promise<void>;
}

export class PolyjuiceWebsocketProvider extends Web3WsProvider {
  godwoker: Godwoker;
  abi: Abi;
  signer: Signer;
  requestQueue: Map<number | string, RequestItem>;
  responseQueue: Map<number | string, RequestItem>;

  constructor(
    host: string,
    polyjuiceConfig: PolyjuiceConfig,
    option?: WebsocketProviderOptions
  ) {
    super(host, option);
    this.signer = new Signer();
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

    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwoker_option); // must use http url here
    this.abi = new Abi(polyjuiceConfig.abiItems || []);
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

  async send(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): Promise<void> {
    const _this = this;
    let id = payload.id;
    const request = { payload: payload, callback: callback };

    if (Array.isArray(payload)) {
      id = payload[0].id;
    }

    if (
      this.connection.readyState === this.connection.CONNECTING ||
      this.reconnecting
    ) {
      this.requestQueue.set(id, request);

      return;
    }

    if (this.connection.readyState !== this.connection.OPEN) {
      this.requestQueue.delete(id);

      this.emit(this.ERROR, errors.ConnectionNotOpenError());
      request.callback(errors.ConnectionNotOpenError());

      return;
    }

    this.responseQueue.set(id, request);
    this.requestQueue.delete(id);

    try {
      await this.godwoker.init();
      const { id: _id, method, params } = payload;
      const jsonRpcId = +_id;

      switch (method) {
        case "eth_sendRawTransaction":
          // todo: forbidden normal eth raw tx pass.
          try {
            const tx_hash =
              await this.godwoker.poly_submitSerializedL2Transaction(params[0]);
            const res = {
              jsonrpc: payload.jsonrpc,
              id: jsonRpcId,
              result: tx_hash,
            };
            callback(null, res);
            this.simulateWebsocketResponse(res, id);
          } catch (error) {
            request.callback(error);
            _this.responseQueue.delete(id);
          }
          break;
        case "eth_sendTransaction":
          try {
            const { from, gas, gasPrice, value, data } = params[0];
            const to = formalizeEthToAddress(params[0].to);
            const t = {
              from: from,
              to: to,
              value: value || 0,
              data: data || "",
              gas: gas,
              gasPrice: gasPrice,
            };

            const signingMethod = async (message: string) => {
              return await this.signer.sign_with_metamask(message, from);
            };
            const rawTxString = await buildSendTransaction(
              this.abi,
              this.godwoker,
              t,
              signingMethod.bind(this),
              SigningMessageType.noPrefix
            );
            const tx_hash =
              await this.godwoker.poly_submitSerializedL2Transaction(
                rawTxString
              );
            // await this.godwoker.waitForTransactionReceipt(tx_hash);
            const res = {
              jsonrpc: payload.jsonrpc,
              id: jsonRpcId,
              result: tx_hash,
            };
            callback(null, res);
            this.simulateWebsocketResponse(res, id);
          } catch (error) {
            request.callback(error);
            _this.responseQueue.delete(id);
          }
          break;

        case "eth_call":
          try {
            const { from, gas, gasPrice, value, data, to } = params[0];

            const t = {
              from: from || this.godwoker.default_from_address,
              to: to,
              value: value || 0,
              data: data || "",
              gas: gas || POLY_MAX_TRANSACTION_GAS_LIMIT,
              gasPrice: gasPrice || POLY_MIN_GAS_PRICE,
            };

            const return_data = await executeCallTransaction(
              this.abi,
              this.godwoker,
              t
            );
            const res = {
              jsonrpc: payload.jsonrpc,
              id: jsonRpcId,
              result: return_data,
            };
            callback(null, res);
            this.simulateWebsocketResponse(res, id);
          } catch (error) {
            request.callback(error);
            _this.responseQueue.delete(id);
          }
          break;

        case "eth_estimateGas":
          try {
            let new_payload = payload;
            const { data } = params[0];

            const data_with_short_address =
              await this.abi.refactor_data_with_short_address(
                data,
                this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                  this.godwoker
                )
              );

            new_payload.params[0].data = data_with_short_address;

            new_payload.params[0].from =
              new_payload.params[0].from || this.godwoker.default_from_address;
            this.connection.send(JSON.stringify(new_payload)); // this should be handle by provider
          } catch (error) {
            request.callback(error);
            _this.responseQueue.delete(id);
          }
          break;

        default:
          this.connection.send(JSON.stringify(request.payload));
          break;
      }
    } catch (error) {
      request.callback(error);
      _this.responseQueue.delete(id);
    }
  }

  simulateWebsocketResponse(result: JsonRpcResponse, id: string | number) {
    if (this.responseQueue.has(id)) {
      if (this.responseQueue.get(id).callback !== undefined) {
        this.responseQueue.get(id).callback(false, result);
      }
      this.responseQueue.delete(id);
    }
  }
}

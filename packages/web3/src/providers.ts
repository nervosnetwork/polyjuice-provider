/**
 * this file is a custom http provider used to proxy ETH rpc call to godwoken-polyjuice chain.
 * it is fork and based on https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http
 */

import * as http from "http";
import * as https from "https";
import { errors } from "web3-core-helpers";
import { XMLHttpRequest as XHR2 } from "xhr2-cookies";
import { JsonRpcResponse } from "web3-core-helpers";

import {
  Godwoker,
  GodwokerOption,
  PolyjuiceConfig,
  Signer,
  Abi,
  AbiItems,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  formalizeEthToAddress,
  buildSendTransaction,
  executeCallTransaction,
  SigningMessageType,
} from "@polyjuice-provider/base";

export interface HttpHeader {
  name: string;
  value: string;
}

export interface HttpProviderAgent {
  baseUrl?: string;
  http?: http.Agent;
  https?: https.Agent;
}

export interface HttpProviderOptions {
  withCredentials?: boolean;
  timeout?: number;
  headers?: HttpHeader[];
  agent?: HttpProviderAgent;
  keepAlive?: boolean;
}

export interface ExperimentalFeatureOption {
  mode: boolean;
  private_key?: string;
}

export class PolyjuiceHttpProvider {
  experimentalFeatureMode: boolean;
  signer: Signer;
  godwoker: Godwoker;
  abi: Abi;
  withCredentials: boolean;
  timeout: number;
  headers: HttpHeader[];
  agent: HttpProviderAgent;
  connected: boolean;
  host: string;
  httpsAgent: https.Agent;
  httpAgent: http.Agent;
  baseUrl: any;

  constructor(
    host: string,
    polyjuiceConfig: PolyjuiceConfig,
    options?: HttpProviderOptions
  ) {
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
    this.godwoker = new Godwoker(host, godwoker_option);
    this.abi = new Abi(polyjuiceConfig.abiItems || []);

    options = options || {};

    this.withCredentials = options.withCredentials || false;
    this.timeout = options.timeout || 0;
    this.headers = options.headers;
    this.agent = options.agent;
    this.connected = false;

    // keepAlive is true unless explicitly set to false
    const keepAlive = options.keepAlive !== false;
    this.host = host || "http://localhost:8024";
    if (!this.agent) {
      if (this.host.substring(0, 5) === "https") {
        this.httpsAgent = new https.Agent({ keepAlive });
      } else {
        this.httpAgent = new http.Agent({ keepAlive });
      }
    }
  }

  setAbi(abiItems: AbiItems) {
    this.abi = new Abi(abiItems);
  }

  async send(
    payload: any,
    callback?: (
      error: Error | null,
      result: JsonRpcResponse | undefined
    ) => void
  ) {
    await this.godwoker.init();
    const { method, params } = payload;

    switch (method) {
      case "eth_sendRawTransaction":
        // todo: forbidden normal eth raw tx pass.
        try {
          const tx_hash =
            await this.godwoker.poly_submitSerializedL2Transaction(params[0]);
          callback(null, {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: tx_hash,
          });
        } catch (error) {
          callback(null, {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            error: error.message,
          });
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
            await this.godwoker.poly_submitSerializedL2Transaction(rawTxString);
          // await this.godwoker.waitForTransactionReceipt(tx_hash);
          const res = {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: tx_hash,
          };
          callback(null, res);
        } catch (error) {
          callback(null, {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            error: error.message,
          });
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
            id: payload.id,
            result: return_data,
          };
          callback(null, res);
        } catch (error) {
          callback(null, {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            error: error.message,
          });
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
          this._send(new_payload, callback); // this should be handle by provider
        } catch (error) {
          callback(null, {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            error: error.message,
          });
        }
        break;

      default:
        this._send(payload, callback);
        break;
    }
  }

  _prepareRequest() {
    let request;

    // the current runtime is a browser
    if (typeof XMLHttpRequest !== "undefined") {
      request = new XMLHttpRequest();
    } else {
      request = new XHR2();
      let agents = {
        httpsAgent: this.httpsAgent,
        httpAgent: this.httpAgent,
        baseUrl: this.baseUrl,
      };

      if (this.agent) {
        agents.httpsAgent = this.agent.https;
        agents.httpAgent = this.agent.http;
        agents.baseUrl = this.agent.baseUrl;
      }

      request.nodejsSet(agents);
    }

    request.open("POST", this.host, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.timeout = this.timeout;
    request.withCredentials = this.withCredentials;

    if (this.headers) {
      this.headers.forEach(function (header) {
        request.setRequestHeader(header.name, header.value);
      });
    }

    return request;
  }

  /**
   * Should be used to make async request
   *
   * @method send
   * @param {Object} payload
   * @param {Function} callback triggered on end with (err, result)
   */
  _send(payload, callback) {
    let _this = this;
    let request = this._prepareRequest();

    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.timeout !== 1) {
        let result = request.responseText;
        let error = null;

        try {
          result = JSON.parse(result);
        } catch (e) {
          error = errors.InvalidResponse(request.responseText);
        }

        _this.connected = true;
        callback(error, result);
      }
    };

    request.ontimeout = function () {
      _this.connected = false;
      callback(errors.ConnectionTimeout(this.timeout));
    };

    try {
      request.send(JSON.stringify(payload));
    } catch (error) {
      this.connected = false;
      callback(errors.InvalidConnection(this.host));
    }
  }

  /**
   * Returns the desired boolean.
   *
   * @method supportsSubscriptions
   * @returns {boolean}
   */
  supportsSubscriptions() {
    return false;
  }

  disconnect(): boolean {
    return this.connected;
  }
}

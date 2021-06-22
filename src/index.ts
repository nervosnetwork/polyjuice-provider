/**
 * this file is a custom http provider used to proxy ETH rpc call to godwoken-polyjuice chain.
 * it is fork and based on https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http
 */

import * as http from "http";
import * as https from "https";
import { errors } from "web3-core-helpers";
import { XMLHttpRequest as XHR2 } from "xhr2-cookies";
import { JsonRpcResponse } from "web3-core-helpers";
import { AbiItem } from "web3-utils";
import { Godwoker, GodwokerOption } from "./util";
import { Abi } from "./abi";

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

declare global {
  interface Window {
    ethereum: any;
  }
}

export default class PolyjuiceHttpProvider {
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
    godwoken_config: GodwokerOption,
    abi_items: AbiItem[] = [],
    options?: HttpProviderOptions
  ) {
    this.godwoker = new Godwoker(host, godwoken_config);
    this.abi = new Abi(abi_items);

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

  async send(
    payload: any,
    callback?: (
      error: Error | null,
      result: JsonRpcResponse | undefined
    ) => void
  ) {
    const { method, params } = payload;

    switch (method) {
      case "eth_sendTransaction":
        if (!window.ethereum) {
          alert(
            "PolyjuiceHttpProvider needs a wallet provider such as metamask!"
          );
          break;
        }

        try {
          const { from, gas, gasPrice, value, data, to } = params[0];

          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              )
            );

          console.log(data, data_with_short_address);

          const t = {
            from: from || window.ethereum.selectedAddress,
            to: to,
            value: value || 0,
            data: data_with_short_address || "",
            gas: gas,
            gasPrice: gasPrice,
          };

          const to_id = await this.godwoker.allTypeEthAddressToAccountId(to);
          const sender_script_hash =
            this.godwoker.computeScriptHashByEoaEthAddress(from);
          const receiver_script_hash =
            await this.godwoker.getScriptHashByAccountId(parseInt(to_id));

          const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
          const message = this.godwoker.generateTransactionMessageToSign(
            polyjuice_tx,
            sender_script_hash,
            receiver_script_hash
          );
          const _signature = await window.ethereum.request({
            method: "personal_sign",
            params: [message, window.ethereum.selectedAddress],
          });
          const signature = this.godwoker.packSignature(_signature);
          const tx_hash = await this.godwoker.gw_submitL2Transaction(
            polyjuice_tx,
            signature
          );
          console.log(
            `provider just proxy an eth_sendTransaction rpc call, tx_hash: ${tx_hash}`
          );
          await this.godwoker.waitForTransactionReceipt(tx_hash);
          this._send(payload, function (err, result) {
            console.log(err, result);
            const res = {
              jsonrpc: result.jsonrpc,
              id: result.id,
            };
            const new_res = { ...res, ...{ result: tx_hash } };
            console.log(
              `eth_sendTransaction, new_res: ${JSON.stringify(
                new_res,
                null,
                2
              )}`
            );
            callback(null, new_res);
          });
          break;
        } catch (error) {
          this.connected = false;
          throw error;
        }

      case "eth_call":
        try {
          const { from, gas, gasPrice, value, data, to } = params[0];

          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              )
            );

          const t = {
            from: from || window.ethereum.selectedAddress,
            to: to,
            value: value || 0,
            data: data_with_short_address || "",
            gas: gas || 5000000,
            gasPrice: gasPrice || 0,
          };

          const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);

          const run_result = await this.godwoker.gw_executeRawL2Transaction(
            polyjuice_tx
          );

          console.log(`provider just proxy an eth_call rpc call.`);

          console.log(`runResult: ${JSON.stringify(run_result, null, 2)}`);
          const abi_item =
            this.abi.get_intereted_abi_item_by_encoded_data(data);
          if (!abi_item) {
            this._send(payload, function (err, result) {
              console.log(err, result);
              const res = {
                jsonrpc: result.jsonrpc,
                id: result.id,
              };
              const new_res = { ...res, ...{ result: run_result.return_data } };
              console.log(
                `no abi, new_res: ${JSON.stringify(new_res, null, 2)}`
              );
              callback(null, new_res);
            });
          } else {
            const return_value_with_short_address =
              await this.abi.refactor_return_value_with_short_address(
                run_result.return_data,
                abi_item,
                this.godwoker.getEthAddressByAllTypeShortAddress.bind(
                  this.godwoker
                )
              );
            this._send(payload, function (err, result) {
              console.log(err, result);
              const res = {
                jsonrpc: result.jsonrpc,
                id: result.id,
              };
              const new_res = {
                ...res,
                ...{ result: return_value_with_short_address },
              };
              callback(null, new_res);
            });
          }
          break;
        } catch (error) {
          this.connected = false;
          throw error;
        }

      case "eth_estimateGas":
        try {
          var new_payload = payload;
          const { data } = params[0];

          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              )
            );

          new_payload.params[0].data = data_with_short_address;

          console.log(
            `provider just proxy an eth_estimateGas rpc call, data: ${data_with_short_address}`
          );
          this._send(new_payload, callback);
          break;
        } catch (error) {
          this.connected = false;
          throw error;
        }

      default:
        try {
          this._send(payload, callback);
          break;
        } catch (error) {
          this.connected = false;
          throw error;
        }
    }
  }

  _prepareRequest() {
    var request;

    // the current runtime is a browser
    if (typeof XMLHttpRequest !== "undefined") {
      request = new XMLHttpRequest();
    } else {
      request = new XHR2();
      var agents = {
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
    var _this = this;
    var request = this._prepareRequest();

    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.timeout !== 1) {
        var result = request.responseText;
        var error = null;

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

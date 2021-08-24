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
  buildL2TransactionWithAddressMapping,
  buildRawL2TransactionWithAddressMapping,
} from "@polyjuice-provider/base";
import { AddressMappingItem } from "@polyjuice-provider/godwoken/lib/addressTypes";

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
    polyjuice_config: PolyjuiceConfig,
    options?: HttpProviderOptions
  ) {
    this.signer = new Signer();
    const godwoker_option: GodwokerOption = {
      godwoken: {
        rollup_type_hash: polyjuice_config.rollupTypeHash,
        eth_account_lock: {
          code_hash: polyjuice_config.ethAccountLockCodeHash,
          hash_type: "type",
        },
      },
    };
    this.godwoker = new Godwoker(host, godwoker_option);
    this.abi = new Abi(polyjuice_config.abiItems || []);

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

          let addressMappingItemVec: AddressMappingItem[];
          function setAddressMappingItemVec(
            _addressMappingItemVec: AddressMappingItem[]
          ) {
            addressMappingItemVec = _addressMappingItemVec;
          }
          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              ),
              setAddressMappingItemVec
            );

          const t = {
            from: from,
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
          const _signature = await this.signer.sign_with_metamask(
            message,
            from
          );
          const signature = this.godwoker.packSignature(_signature);

          const l2_tx = {
            raw: polyjuice_tx,
            signature: signature,
          };
          const l2_tx_with_address_mapping =
            buildL2TransactionWithAddressMapping(l2_tx, addressMappingItemVec);
          const l2_tx_with_address_mapping_in_serialize =
            this.godwoker.serializeL2TransactionWithAddressMapping(
              l2_tx_with_address_mapping
            );
          const tx_hash =
            await this.godwoker.poly_submitSerializedL2Transaction(
              l2_tx_with_address_mapping_in_serialize
            );
          await this.godwoker.waitForTransactionReceipt(tx_hash);
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

          let addressMappingItemVec: AddressMappingItem[];
          function setAddressMappingItemVec(
            _addressMappingItemVec: AddressMappingItem[]
          ) {
            addressMappingItemVec = _addressMappingItemVec;
          }
          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              ),
              setAddressMappingItemVec
            );

          const t = {
            from:
              from || (await this.godwoker.getPolyjuiceDefaultFromAddress()),
            to: to,
            value: value || 0,
            data: data_with_short_address || "",
            gas: gas || POLY_MAX_TRANSACTION_GAS_LIMIT,
            gasPrice: gasPrice || POLY_MIN_GAS_PRICE,
          };

          const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
          const polyjuice_tx_with_address_mapping =
            buildRawL2TransactionWithAddressMapping(
              polyjuice_tx,
              addressMappingItemVec
            );
          const run_result = await this.godwoker.poly_executeRawL2Transaction(
            polyjuice_tx_with_address_mapping
          );

          const abi_item =
            this.abi.get_intereted_abi_item_by_encoded_data(data);
          if (!abi_item) {
            const res = {
              jsonrpc: payload.jsonrpc,
              id: payload.id,
              result: run_result.return_data,
            };
            callback(null, res);
          } else {
            const return_value_with_short_address =
              await this.abi.refactor_return_value_with_short_address(
                run_result.return_data,
                abi_item,
                this.godwoker.getEthAddressByAllTypeShortAddress.bind(
                  this.godwoker
                )
              );
            const res = {
              jsonrpc: payload.jsonrpc,
              id: payload.id,
              result: return_value_with_short_address,
            };
            callback(null, res);
          }
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
            new_payload.params[0].from ||
            (await this.godwoker.getPolyjuiceDefaultFromAddress());
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

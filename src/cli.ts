/**
 * this file is a custom http provider used to proxy ETH rpc call to godwoken-polyjuice chain.
 * it is fork and based on https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http
 * this is only aims for nodejs development popurse. it will sign tx with private-key, which it is dangerours.
 * please ues it at your own risk.
 */

import * as http from "http";
import * as https from "https";
import { JsonRpcResponse } from "web3-core-helpers";
import { AbiItem } from "web3-utils";
import { GodwokerOption } from "./util";
import Signer from "./signer";
import PolyjuiceHttpProvider from "./index";

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

export default class PolyjuiceHttpProviderForNode extends PolyjuiceHttpProvider {
  constructor(
    host: string,
    godwoken_config: GodwokerOption,
    abi_items: AbiItem[] = [],
    private_key: string,
    options?: HttpProviderOptions
  ) {
    super(host, godwoken_config, abi_items);
    this.signer = new Signer(private_key);
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

          // ready to sign tx
          console.log(
            `it is very dangerous to sign with private-key, please use it carefully and only use in test development scence!`
          );
          const message = this.godwoker.generateTransactionMessageToSign(
            polyjuice_tx,
            sender_script_hash,
            receiver_script_hash
          );
          const _signature = await this.signer.sign_with_private_key(
            message,
            from
          );
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

      default:
        try {
          super.send(payload, callback);
          break;
        } catch (error) {
          this.connected = false;
          throw error;
        }
    }
  }
}

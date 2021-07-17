/**
 * this file is a custom http provider used to proxy ETH rpc call to godwoken-polyjuice chain.
 * it is fork and based on https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http
 * this is only aims for nodejs development popurse. it will sign tx with private-key, which it is dangerours.
 * please ues it at your own risk.
 */

import * as http from "http";
import * as https from "https";
import { JsonRpcResponse } from "web3-core-helpers";
import Signer from "@polyjuice-provider/base/lib/signer";
import { PolyjuiceHttpProvider, PolyjuiceConfig } from "./providers";
import { DEFAULT_EMPTY_ETH_ADDRESS } from "../../base/lib";

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

export class PolyjuiceHttpProviderCli extends PolyjuiceHttpProvider {
  constructor(
    host: string,
    polyjuice_config: PolyjuiceConfig,
    private_key: string,
    _options?: HttpProviderOptions
  ) {
    super(host, polyjuice_config);
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
          const { from, gas, gasPrice, value, data } = params[0];
          const to = params[0].to || DEFAULT_EMPTY_ETH_ADDRESS;
          const data_with_short_address =
            await this.abi.refactor_data_with_short_address(
              data,
              this.godwoker.getShortAddressByAllTypeEthAddress.bind(
                this.godwoker
              )
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

          // ready to sign tx
          console.log(
            `it is very dangerous to sign with private-key, please use it carefully and only use in test development!`
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

      default:
        super.send(payload, callback);
        break;
    }
  }
}

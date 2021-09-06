/**
 * this file is a custom http provider used to proxy ETH rpc call to godwoken-polyjuice chain.
 * it is fork and based on https://github.com/ChainSafe/web3.js/tree/1.x/packages/web3-providers-http
 * this is only aims for nodejs development purpose. it will sign tx with private-key, which it is dangerous.
 * please ues it at your own risk.
 */

import * as http from "http";
import * as https from "https";
import { JsonRpcResponse } from "web3-core-helpers";
import Signer from "@polyjuice-provider/base/lib/signer";
import { PolyjuiceHttpProvider } from "./providers";
import {
  formalizeEthToAddress,
  PolyjuiceConfig,
  buildSendTransaction,
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
    await this.godwoker.init();
    const { method, params } = payload;

    switch (method) {
      case "eth_sendTransaction":
        try {
          const that = this;
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
            console.log(
              `it is very dangerous to sign with private-key, please use it carefully and only use in test development!`
            );
            console.log(
              "sinature: ",
              await this.signer.sign_with_private_key(message)
            );
            return await that.signer.sign_with_private_key(message);
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

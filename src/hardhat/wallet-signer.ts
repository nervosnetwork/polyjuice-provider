import { Wallet } from "@ethersproject/wallet";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { SigningKey } from "@ethersproject/signing-key";
import { resolveProperties } from "@ethersproject/properties";
import { getAddress } from "@ethersproject/address";
import { GodwokerOption, Godwoker } from "../util";

import { Logger } from "@ethersproject/logger";
import { joinSignature, Bytes, BytesLike, hexlify } from "@ethersproject/bytes";
const logger = new Logger("Polyjuice-Wallet/0.0.1");

export interface PolyjuiceConfig {
  godwokerOption: GodwokerOption;
  web3RpcUrl: string;
}

export default interface PolyjuiceWallet extends Wallet {
  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    polyjuiceConfig: PolyjuiceConfig,
    provider?: JsonRpcProvider
  );
}

export default class PolyjuiceWallet extends Wallet {
  godwoker: Godwoker;

  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    polyjuiceConfig: PolyjuiceConfig,
    provider?: JsonRpcProvider
  ) {
    super(privateKey, provider);
    const { web3RpcUrl, godwokerOption } = polyjuiceConfig;
    this.godwoker = new Godwoker(web3RpcUrl, godwokerOption);
  }

  signTransaction(transaction: TransactionRequest): Promise<string> {
    return resolveProperties(transaction).then(async (tx) => {
      if (tx.from != null) {
        if (getAddress(tx.from) !== this.address) {
          logger.throwArgumentError(
            "transaction from address mismatch",
            "transaction.from",
            transaction.from
          );
          throw new Error(
            `transaction from address mismatch, wallet address: ${this.address}, transaction address: ${transaction.from}`
          );
        }
        // delete tx.from;
      }

      // use godwoken-polyjuice's transaction signing method
      // (which is deifferent tx type and use a message signing)
      // to sign transaction.
      const t = {
        from: tx.from,
        to: tx.to || "0x" + "0".repeat(40),
        value: hexlify(tx.value || 0),
        data: hexlify(tx.data || "0x00"),
        gas: hexlify(tx.gasLimit || 50000),
        gasPrice: hexlify(tx.gasPrice || 0),
      };
      const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
      const message = await this.godwoker.generateMessageFromEthTransaction(t);
      const _signature = await this.personalSignMessage(message);
      const signature = this.godwoker.packSignature(_signature);
      const l2_tx = { raw: polyjuice_tx, signature: signature };
      return this.godwoker.serializeL2Transaction(l2_tx);
    });
  }

  async personalSignMessage(messageDigest: string): Promise<string> {
    return joinSignature(this._signingKey().signDigest(messageDigest));
  }
}

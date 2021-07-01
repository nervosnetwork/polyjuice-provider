import { Wallet, providers } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { SigningKey } from "@ethersproject/signing-key";
import { resolveProperties } from "@ethersproject/properties";
import { getAddress } from "@ethersproject/address";
import { GodwokerOption, Godwoker } from "../util";
import { Abi, AbiItems } from "../abi";

import { Logger } from "@ethersproject/logger";
import { joinSignature, Bytes, BytesLike, hexlify } from "@ethersproject/bytes";
const logger = new Logger("Polyjuice-Wallet/0.0.1");

export interface PolyjuiceConfig {
  godwokerOption: GodwokerOption;
  web3RpcUrl: string;
  abiItems?: AbiItems;
}

export default interface PolyjuiceWallet extends Wallet {
  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    polyjuiceConfig: PolyjuiceConfig,
    provider?: providers.JsonRpcProvider
  );
}

export default class PolyjuiceWallet extends Wallet {
  godwoker: Godwoker;
  abi: Abi;

  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    polyjuiceConfig: PolyjuiceConfig,
    provider?: providers.JsonRpcProvider
  ) {
    super(privateKey, provider);
    const { web3RpcUrl, abiItems, godwokerOption } = polyjuiceConfig;
    this.godwoker = new Godwoker(web3RpcUrl, godwokerOption);
    this.abi = new Abi(abiItems || []);
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
      let data_with_short_address;
      try {
        data_with_short_address =
          await this.abi.refactor_data_with_short_address(
            hexlify(tx.data || "0x00"),
            this.godwoker.getShortAddressByAllTypeEthAddress.bind(this.godwoker)
          );
      } catch (error) {
        logger.throwArgumentError(
          "can not replace data with short_address",
          "data",
          transaction.data
        );
        throw new Error(
          `can not replace data with short_address ${transaction.data}`
        );
      }

      const t = {
        from: tx.from,
        to: tx.to || "0x" + "0".repeat(40),
        value: hexlify(tx.value || 0),
        data: data_with_short_address,
        gas: hexlify(tx.gasLimit || 50000),
        gasPrice: hexlify(tx.gasPrice || 0),
      };
      const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
      const message = await this.godwoker.generateMessageFromEthTransaction(t);
      const _signature = await joinSignature(
        this._signingKey().signDigest(message)
      );
      const signature = this.godwoker.packSignature(_signature);
      const l2_tx = { raw: polyjuice_tx, signature: signature };
      return this.godwoker.serializeL2Transaction(l2_tx);
    });
  }
}

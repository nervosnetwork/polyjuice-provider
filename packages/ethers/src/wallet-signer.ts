import { Wallet, providers } from "ethers";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { SigningKey } from "@ethersproject/signing-key";
import { resolveProperties } from "@ethersproject/properties";
import { getAddress } from "@ethersproject/address";
import {
  PolyjuiceConfig,
  GodwokerOption,
  Godwoker,
  Abi,
  AbiItems,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  formalizeEthToAddress,
  buildSendTransaction,
} from "@polyjuice-provider/base";

import { Logger } from "@ethersproject/logger";
import { joinSignature, BytesLike, hexlify } from "@ethersproject/bytes";
const logger = new Logger("Polyjuice-Wallet/0.0.1");

export interface PolyjuiceWallet extends Wallet {
  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    polyjuiceConfig: PolyjuiceConfig,
    provider?: providers.JsonRpcProvider
  );
}

export class PolyjuiceWallet extends Wallet {
  godwoker: Godwoker;
  abi: Abi;

  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    polyjuiceConfig: PolyjuiceConfig,
    provider?: providers.JsonRpcProvider
  ) {
    super(privateKey, provider);
    const godwokerOption: GodwokerOption = {
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
    if (!polyjuiceConfig.web3Url)
      throw new Error("should provide web3 rpc url in polyjuiceConfigs.");

    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwokerOption);
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

  signTransaction(transaction: TransactionRequest): Promise<string> {
    return resolveProperties(transaction).then(async (tx) => {
      await this.godwoker.init();
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
      }

      // use godwoken-polyjuice transaction signing method
      // (which is different tx type and use a message signing)
      // to sign transaction.
      const t = {
        from: tx.from,
        to: formalizeEthToAddress(tx.to),
        value: hexlify(tx.value || 0),
        data: hexlify(tx.data),
        gas: hexlify(tx.gasLimit || POLY_MAX_TRANSACTION_GAS_LIMIT),
        gasPrice: hexlify(tx.gasPrice || POLY_MIN_GAS_PRICE),
      };
      const that = this;
      const signingMethod = function (message: string) {
        return joinSignature(that._signingKey().signDigest(message));
      };
      try {
        return await buildSendTransaction(
          this.abi,
          this.godwoker,
          t,
          signingMethod.bind(that)
        );
      } catch (error) {
        logger.throwError(error.message, error.code, t);
        throw new Error(error.message);
      }
    });
  }
}

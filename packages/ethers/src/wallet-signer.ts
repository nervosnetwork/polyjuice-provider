import { Wallet, providers } from "ethers";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { SigningKey } from "@ethersproject/signing-key";
import { resolveProperties } from "@ethersproject/properties";
import { getAddress } from "@ethersproject/address";
import {
  GodwokerOption,
  Godwoker,
  Abi,
  AbiItems,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  DEFAULT_EMPTY_ETH_ADDRESS,
} from "@polyjuice-provider/base";
import { PolyjuiceConfig } from "./providers";

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
    };
    if (!polyjuiceConfig.web3Url)
      throw new Error("should provide web3 rpc url in polyjuiceConfigs.");

    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwokerOption);
    this.abi = new Abi(polyjuiceConfig.abiItems || []);
  }

  setAbi(abiItems: AbiItems) {
    this.abi = new Abi(abiItems);
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
        to: tx.to || DEFAULT_EMPTY_ETH_ADDRESS,
        value: hexlify(tx.value || 0),
        data: data_with_short_address,
        gas: hexlify(tx.gasLimit || POLY_MAX_TRANSACTION_GAS_LIMIT),
        gasPrice: hexlify(tx.gasPrice || POLY_MIN_GAS_PRICE),
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

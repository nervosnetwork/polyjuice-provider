import HDWalletProvider from "@truffle/hdwallet-provider";
import { ConstructorArguments } from "@truffle/hdwallet-provider/dist/constructor/ConstructorArguments";
import HookedSubprovider from "@trufflesuite/web3-provider-engine/subproviders/hooked-wallet";
import * as EthUtil from "ethereumjs-util";
import FiltersSubprovider from "@trufflesuite/web3-provider-engine/subproviders/filters";
import ProviderSubprovider from "@trufflesuite/web3-provider-engine/subproviders/provider";
import ProviderEngine from "@trufflesuite/web3-provider-engine";
// @ts-ignore
import RpcProvider from "@trufflesuite/web3-provider-engine/subproviders/rpc";
// @ts-ignore
import WebsocketProvider from "@trufflesuite/web3-provider-engine/subproviders/websocket";
import Url from "url";
import { getOptions } from "@truffle/hdwallet-provider/dist/constructor/getOptions";
import {
  Godwoker,
  GodwokerOption,
  POLY_MAX_TRANSACTION_GAS_LIMIT,
  POLY_MIN_GAS_PRICE,
  formalizeEthToAddress,
  PolyjuiceConfig,
  buildSendTransaction,
  Abi,
} from "@polyjuice-provider/base";
import { NonceTrackerSubprovider as NonceSubProvider } from "./nonce-tracker";

const singletonNonceSubProvider = new NonceSubProvider();

export class PolyjuiceHDWalletProvider extends HDWalletProvider {
  abi: Abi;
  godwoker: Godwoker;

  constructor(args: ConstructorArguments, polyjuiceConfig: PolyjuiceConfig) {
    super(...args);
    this.engine.stop();
    this.engine = undefined;

    const {
      providerOrUrl, // required
      // addressIndex = 0,
      // numberOfAddresses = 10,
      shareNonce = true,
      // derivationPath = `m/44'/60'/0'/0/`,
      pollingInterval = 4000,
      // chainId,
      // chainSettings = {},

      // what's left is either a mnemonic or a list of private keys
      // ...signingAuthority
    } = getOptions(...args);

    const tmpAccounts = this.getAddresses();
    // @ts-ignore: Private method
    const tmpWallets = this.wallets;

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
        default_from_address: polyjuiceConfig.defaultFromAddress
      }
    };

    this.godwoker = new Godwoker(polyjuiceConfig.web3Url, godwokerOption);
    this.abi = new Abi(polyjuiceConfig.abiItems || []);

    this.engine = new ProviderEngine({
      pollingInterval,
    });

    const self = this;
    this.engine.addProvider(
      new HookedSubprovider({
        getAccounts(cb: any) {
          cb(null, tmpAccounts);
        },
        getPrivateKey(address: string, cb: any) {
          if (!tmpWallets[address]) {
            return cb("Account not found");
          } else {
            cb(null, tmpWallets[address].getPrivateKey().toString("hex"));
          }
        },
        async signTransaction(txParams: any, cb: any) {
          await self.godwoker.init();
          // @ts-ignore: Private method
          await self.initialized;
          // we need to rename the 'gas' field
          txParams.gasLimit = txParams.gas;
          delete txParams.gas;

          let pkey;
          const from = txParams.from.toLowerCase();
          if (tmpWallets[from]) {
            pkey = tmpWallets[from].getPrivateKey();
          } else {
            cb("Account not found");
          }
          // @ts-ignore: Private method
          // const chain = self.chainId;
          // const KNOWN_CHAIN_IDS = new Set([1, 3, 4, 5, 42]);

          let t = {
            from: EthUtil.bufferToHex(txParams.from),
            to: formalizeEthToAddress(EthUtil.bufferToHex(txParams.to)),
            value: EthUtil.bufferToHex(txParams.value) || "0x0",
            data: EthUtil.bufferToHex(txParams.data),
            gas:
              EthUtil.bufferToHex(txParams.gasLimit) ||
              "0x" + POLY_MAX_TRANSACTION_GAS_LIMIT.toString(16),
            gasPrice:
              EthUtil.bufferToHex(txParams.gasPrice) ||
              "0x" + POLY_MIN_GAS_PRICE.toString(16),
          };

          const signingMethod = (message: string) => {
            const msgHashBuff = EthUtil.toBuffer(message);
            const sig = EthUtil.ecsign(msgHashBuff, pkey);
            const signature = EthUtil.toRpcSig(sig.v, sig.r, sig.s);
            return signature;
          };
          const rawTxString = await buildSendTransaction(
            self.abi,
            self.godwoker,
            t,
            signingMethod
          );
          cb(null, rawTxString);
        },
        signMessage({ data, from }: any, cb: any) {
          const dataIfExists = data;
          if (!dataIfExists) {
            cb("No data to sign");
          }
          if (!tmpWallets[from]) {
            cb("Account not found");
          }
          let pkey = tmpWallets[from].getPrivateKey();
          const dataBuff = EthUtil.toBuffer(dataIfExists);
          const msgHashBuff = EthUtil.hashPersonalMessage(dataBuff);
          const sig = EthUtil.ecsign(msgHashBuff, pkey);
          const rpcSig = EthUtil.toRpcSig(sig.v, sig.r, sig.s);
          cb(null, rpcSig);
        },
        signPersonalMessage(...args: any[]) {
          this.signMessage(...args);
        },
      })
    );

    !shareNonce
      ? this.engine.addProvider(
          new NonceSubProvider().setGodwoker(self.godwoker)
        )
      : this.engine.addProvider(
          singletonNonceSubProvider.setGodwoker(self.godwoker)
        );

    this.engine.addProvider(new FiltersSubprovider());
    if (typeof providerOrUrl === "string") {
      const url = providerOrUrl;

      const providerProtocol = (
        Url.parse(url).protocol || "http:"
      ).toLowerCase();

      switch (providerProtocol) {
        case "ws:":
        case "wss:":
          this.engine.addProvider(new WebsocketProvider({ rpcUrl: url }));
          break;
        default:
          this.engine.addProvider(new RpcProvider({ rpcUrl: url }));
      }
    } else {
      const provider = providerOrUrl;
      this.engine.addProvider(new ProviderSubprovider(provider, "gw"));
    }

    // Required by the provider engine.
    this.engine.start((err: any) => {
      if (err) throw err;
    });
  }
}

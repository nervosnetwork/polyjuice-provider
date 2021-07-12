import HDWalletProvider from "@truffle/hdwallet-provider";
import { ConstructorArguments } from "@truffle/hdwallet-provider/dist/constructor/ConstructorArguments";
import HookedSubprovider from "@trufflesuite/web3-provider-engine/subproviders/hooked-wallet";

export interface PolyjuiceHDWalletProvider extends HDWalletProvider {}

export class PolyjuiceHDWalletProvider extends HDWalletProvider {
  constructor(...args: ConstructorArguments) {
    super(...args);

    var that = this;

    const tmpAccounts = this.addresses;
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
          await that.initialized;
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
          const chain = self.chainId;
          const KNOWN_CHAIN_IDS = new Set([1, 3, 4, 5, 42]);
          let txOptions;
          if (typeof chain !== "undefined" && KNOWN_CHAIN_IDS.has(chain)) {
            txOptions = { chain };
          } else if (typeof chain !== "undefined") {
            const common = Common.forCustomChain(
              1,
              {
                name: "custom chain",
                chainId: chain,
              },
              self.hardfork
            );
            txOptions = { common };
          }
          const tx = new Transaction(txParams, txOptions);
          tx.sign(pkey as Buffer);
          const rawTx = `0x${tx.serialize().toString("hex")}`;
          cb(null, rawTx);
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
  }
}

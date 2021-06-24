import { JsonRpcProvider } from "@ethersproject/providers";
import { hexlify } from "@ethersproject/bytes";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";

export class PolyjuiceJsonRpcProvider extends JsonRpcProvider {
  async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<TransactionResponse> {
    await this.getNetwork();
    const hexTx = await Promise.resolve(signedTransaction).then((t) =>
      hexlify(t)
    );
    //const tx = this.formatter.transaction(signedTransaction);
    const blockNumber = await this._getInternalBlockNumber(
      100 + 2 * this.pollingInterval
    );
    try {
      const hash = await this.perform("sendTransaction", {
        signedTransaction: hexTx,
      });
      // TODO replace with real eth tx unserialize from godwoken signed tx serialized hex string
      const fake_tx = {
        hash: hash,
        from: "0x",
        nonce: 0,
        gasLimit: BigNumber.from("0x00"),
        gasPrice: BigNumber.from("0x00"),
        data: "0x00",
        value: BigNumber.from("0x00"),
        chainId: 3,
      };
      return this._wrapTransaction(fake_tx, hash, blockNumber);
    } catch (error) {
      (<any>error).transaction = null;
      (<any>error).transactionHash = null;
      throw error;
    }
  }

  prepareRequest(method: string, params: any): [string, Array<any>] {
    // TODO add address params replacement in eth_call / eth_estimateGas
    switch (method) {
      case "sendTransaction":
        return ["gw_submit_l2transaction", [params.signedTransaction]];

      default:
        return super.prepareRequest(method, params);
    }
  }
}

export default { PolyjuiceJsonRpcProvider };

import NonceTrackerSubprovider from "@trufflesuite/web3-provider-engine/subproviders/nonce-tracker";
import { blockTagForPayload } from "@trufflesuite/web3-provider-engine/util/rpc-cache-utils";
import {
  deserializeL2TransactionWithAddressMapping,
  Godwoker,
} from "@polyjuice-provider/base/lib";

NonceTrackerSubprovider.prototype.setGodwoker = function (godwoker: Godwoker) {
  this.godwoker = godwoker;
  return this;
};

NonceTrackerSubprovider.prototype.handleRequest = function (
  payload: any,
  next: any,
  end: any
) {
  const self = this;
  switch (payload.method) {
    case "eth_getTransactionCount":
      let blockTag = blockTagForPayload(payload);
      let address = payload.params[0].toLowerCase();
      let cachedResult = self.nonceCache[address];
      // only handle requests against the 'pending' blockTag
      if (blockTag === "pending") {
        // has a result
        if (cachedResult) {
          end(null, cachedResult);
          // fallthrough then populate cache
        } else {
          next(function (err, result, cb) {
            if (err) return cb();
            if (self.nonceCache[address] === undefined) {
              self.nonceCache[address] = result;
            }
            cb();
          });
        }
      } else {
        next();
      }
      return;

    case "eth_sendRawTransaction":
      // allow the request to continue normally
      next(async function (err, result, cb) {
        await self.godwoker.init();
        // only update local nonce if tx was submitted correctly
        if (err) return cb();

        const godwoker: Godwoker = self.godwoker;
        const rawTx: string = payload.params[0];
        const txWithAddressMapping =
          deserializeL2TransactionWithAddressMapping(rawTx);
        const fromId = parseInt(txWithAddressMapping.tx.raw.from_id);
        const scriptHash = await godwoker.getScriptHashByAccountId(fromId);
        const script = await godwoker.getScriptByScriptHash(scriptHash);
        const ethAddress = script.args.slice(66);
        let nonce = parseInt(txWithAddressMapping.tx.raw.nonce);

        nonce++;
        // hexify and normalize
        let hexNonce = nonce.toString(16);
        if (hexNonce.length % 2) hexNonce = "0" + hexNonce;
        hexNonce = "0x" + hexNonce;
        // dont update our record on the nonce until the submit was successful
        // update cache
        self.nonceCache[ethAddress] = hexNonce;
        cb();
      });
      return;

    // Clear cache on a testrpc revert
    case "evm_revert":
      self.nonceCache = {};
      next();
      return;

    default:
      next();
      return;
  }
};

export { NonceTrackerSubprovider };

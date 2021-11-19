import Web3 from "web3";
import crypto from "crypto";

export function genNewEthAddress() {
  return Web3.utils.toChecksumAddress(crypto.randomBytes(20).toString("hex"));
}

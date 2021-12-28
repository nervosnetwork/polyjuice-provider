import { personalSign } from "@metamask/eth-sig-util";
import crypto from "crypto";
import keccak256 from "keccak256";
import Web3 from "web3";

export function privateKeyToEthAddress(privateKey) {
  const ecdh = crypto.createECDH(`secp256k1`);
  ecdh.generateKeys();
  ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), "hex"));
  const publicKey = "0x" + ecdh.getPublicKey("hex", "uncompressed");
  const _ethAddress =
    "0x" +
    keccak256(Buffer.from(publicKey.slice(4), "hex"))
      .slice(12)
      .toString("hex");
  const ethAddress = Web3.utils.toChecksumAddress(_ethAddress);
  return ethAddress;
}

export async function initMockWindowsEthereum(privateKey: string) {
  let window = {
    ethereum: {
      request: async function ({ method, params }) {
        if (method !== "personal_sign") {
          throw new Error(
            "mock window.ethereum only impl personal_sign method."
          );
        }
        const [message_without_prefix, address] = params;
        const ethAddress = privateKeyToEthAddress(privateKey);
        if (address === ethAddress.toLocaleLowerCase()) {
          return personalSign({
            privateKey: Buffer.from(privateKey.slice(2), "hex"),
            data: message_without_prefix,
          });
        }

        throw new Error("invalid test data");
      },
    },
  };
  return window;
}

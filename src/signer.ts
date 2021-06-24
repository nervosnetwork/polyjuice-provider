const Accounts = require("web3-eth-accounts");

declare global {
  interface Window {
    ethereum: any;
  }
}

export default class Signer {
  private_key: string | undefined;

  constructor(private_key?: string) {
    this.private_key = private_key;
  }

  // message without prefix "\x19Ethereum Signed Message:\n"
  async sign_with_metamask(message_without_prefix: string, address: string) {
    if (!window.ethereum) {
      alert("please install metamask!");
      throw new Error(
        "metamask not found. if you are in nodejs env, you can try sign_with_private_key method."
      );
    }

    const _signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message_without_prefix, address],
    });

    return _signature;
  }

  // message with prefix "\x19Ethereum Signed Message:\n"
  sign_with_private_key(message_with_prefix: string, address: string): string {
    if (!this.private_key) {
      throw new Error("private key not found! cannot use this method!");
    }

    const accounts = new Accounts();
    const sign = accounts.sign(message_with_prefix, this.private_key);
    return sign.signature;
  }

  // sign with other wallet...
}

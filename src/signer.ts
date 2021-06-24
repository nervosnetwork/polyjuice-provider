import { personalSign } from 'eth-sig-util';

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

  // message without prefix "\x19Ethereum Signed Message:\n"
  sign_with_private_key(message_without_prefix: string, address: string): string {
    if (!this.private_key) {
      throw new Error("private key not found! cannot use this method!");
    }

    let privateKeyBuffer = Buffer.from(this.private_key.length === 40 ? this.private_key : this.private_key.slice(2), 'hex');

    const signature = personalSign(privateKeyBuffer, {
      data: message_without_prefix
    })

    return signature;
  }

  // sign with other wallet...
}

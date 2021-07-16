import { Script, Hash, utils, HexNumber, HexString } from "@ckb-lumos/base";
import {
  GodwokenUtils,
  RawL2Transaction,
  L2Transaction,
} from "@polyjuice-provider/godwoken";
import {
  SerializeL2Transaction,
  SerializeRawL2Transaction,
} from "@polyjuice-provider/godwoken/schemas";
import {
  NormalizeL2Transaction,
  NormalizeRawL2Transaction,
} from "@polyjuice-provider/godwoken/lib/normalizer";
import { U128_MIN, U128_MAX, DEFAULT_EMPTY_ETH_ADDRESS } from "./constant";
import { Reader } from "ckb-js-toolkit";
import crossFetch from "cross-fetch"; // for nodejs compatibility polyfill
import { Buffer } from "buffer"; // for browser compatibility polyfill

// replace for buffer polyfill under 0.6 version.
// eg: for react project using webpack 4 (this is the most common case when created by running `npx create-react-app`),
// the default react-scripts config just use buffer@0.4.3 which doesn't include writeBigUint64LE function.
// code copy from https://github.com/feross/buffer/blob/master/index.js#L1497-L1513
function writeBigUint64LE(buf, value, offset = 0) {
  let lo = Number(value & BigInt(0xffffffff));
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  let hi = Number((value >> BigInt(32)) & BigInt(0xffffffff));
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  return offset;
}

Buffer.prototype.writeBigUInt64LE = function (value, offset) {
  return writeBigUint64LE(this, value, offset);
};

const jaysonBrowserClient = require("jayson/lib/client/browser");

declare global {
  interface Window {
    fetch: any;
  }
}

const fetch = typeof window !== "undefined" ? window.fetch : crossFetch;

export type EthTransaction = {
  from: HexString;
  to: HexString;
  gas?: HexNumber;
  gasPrice?: HexNumber;
  value: HexNumber;
  data: HexString;
  nonce?: HexNumber;
};

export type L2TransactionArgs = {
  to_id: number;
  value: bigint;
  data: HexString;
};

export type GodwokerOption = {
  godwoken: {
    rollup_type_hash: Hash;
    eth_account_lock: Omit<Script, "args">;
  };
  queryEthAddressByShortAddress?: (short_address: string) => string;
  saveEthAddressShortAddressMapping?: (
    eth_address: string,
    short_address: string
  ) => void;
  request_option?: object;
};

export type RequestRpcResult = {
  err: any;
  data?: string;
};

export class Godwoker {
  private eth_account_lock: Omit<Script, "args">;
  private rollup_type_hash: string;
  private client: any;
  private godwkenUtils: GodwokenUtils;
  private queryEthAddressByShortAddress;
  private saveEthAddressShortAddressMapping;

  constructor(host: string, option: GodwokerOption) {
    const callServer = function (request: any, callback: any) {
      const opt = option.request_option || {
        method: "POST",
        body: request,
        headers: {
          "Content-Type": "application/json",
        },
      };
      fetch(host, opt)
        .then(function (res) {
          return res.text();
        })
        .then(function (text) {
          callback(null, text);
        })
        .catch(function (err) {
          callback(err);
        });
    };
    this.client = jaysonBrowserClient(callServer);
    this.godwkenUtils = new GodwokenUtils(option.godwoken.rollup_type_hash);
    this.eth_account_lock = option.godwoken.eth_account_lock;
    this.rollup_type_hash = option.godwoken.rollup_type_hash;
    this.queryEthAddressByShortAddress = option.queryEthAddressByShortAddress;
    this.saveEthAddressShortAddressMapping =
      option.saveEthAddressShortAddressMapping;
  }

  packSignature(_signature: Hash): Hash {
    let v = Number.parseInt(_signature.slice(-2), 16);
    if (v >= 27) v -= 27;
    const signature = _signature.slice(0, -2) + v.toString(16).padStart(2, "0");
    return signature;
  }

  computeScriptHashByEoaEthAddress(eth_address: string): string {
    const layer2_lock: Script = {
      code_hash: this.eth_account_lock.code_hash,
      hash_type: this.eth_account_lock.hash_type as "type" | "data",
      args: this.rollup_type_hash + eth_address.slice(2),
    };
    const lock_hash = utils.computeScriptHash(layer2_lock);
    return lock_hash;
  }

  async getScriptByScriptHash(_script_hash: string): Promise<Script> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_script",
        [_script_hash],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(`unable to fetch script from ${_script_hash}`)
            );
          return resolve(res.result);
        }
      );
    });
  }

  async getScriptHashByAccountId(account_id: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_script_hash",
        [`0x${BigInt(account_id).toString(16)}`],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `unable to fetch account script hash from 0x${BigInt(
                  account_id
                ).toString(16)}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async getAccountIdByScriptHash(script_hash: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_account_id_by_script_hash",
        [script_hash],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `unable to fetch account id from script hash ${script_hash}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async getAccountIdByEoaEthAddress(eth_address: string): Promise<string> {
    const layer2_lock: Script = {
      code_hash: this.eth_account_lock.code_hash,
      hash_type: this.eth_account_lock.hash_type as "type" | "data",
      args: this.rollup_type_hash + eth_address.slice(2),
    };
    const lock_hash = utils.computeScriptHash(layer2_lock);
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_account_id_by_script_hash",
        [lock_hash],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `unable to fetch account id from ${eth_address}, lock_hash is ${lock_hash}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async getScriptHashByShortAddress(_address: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_script_hash_by_short_address",
        [_address],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || !res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `unable to fetch script hash from short address: ${_address}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  computeShortAddressByEoaEthAddress(
    _address: string,
    write_callback?: (eth_address: string, short_address: string) => void
  ): string {
    const short_address = this.computeScriptHashByEoaEthAddress(_address).slice(
      0,
      42
    );

    if (write_callback) {
      write_callback(_address, short_address);
    }

    return short_address;
  }

  async getShortAddressByAllTypeEthAddress(_address: string): Promise<string> {
    // todo: support create2 address in such case that it haven't create real contract yet.
    try {
      // assume it is an contract address (thus already an short address)
      await this.getScriptHashByShortAddress(_address);
      return _address;
    } catch (error) {
      // script hash not exist with short address, assume it is EOA address..
      // remember to save the script and eoa address mapping with default or user-specific callback
      const write_callback = this.saveEthAddressShortAddressMapping
        ? this.saveEthAddressShortAddressMapping
        : this.defaultSaveEthAddressShortAddressMapping.bind(this);
      return this.computeShortAddressByEoaEthAddress(_address, write_callback);
    }
  }

  async getEthAddressByAllTypeShortAddress(_short_address: string) {
    // todo: support create2 address in such case which it haven't create real contract yet.
    try {
      // first, query on-chain
      const script_hash = await this.getScriptHashByShortAddress(
        _short_address
      );
      const script = await this.getScriptByScriptHash(script_hash);
      if (script.code_hash === this.eth_account_lock.code_hash) {
        return "0x" + script.args.slice(66, 106);
      }
      // assume it is normal contract address.
      return _short_address;
    } catch (error) {
      // not on-chain, asume it is  eoa address
      // which haven't create account on godwoken yet
      const query_callback = this.queryEthAddressByShortAddress
        ? this.queryEthAddressByShortAddress
        : this.defaultQueryEthAddressByShortAddress.bind(this);
      const eth_address = await query_callback(_short_address);
      // check address and short_address indeed matched.
      if (this.checkEthAddressIsEoa(eth_address, _short_address)) {
        return eth_address;
      } else {
        throw Error(
          `query result of eoa address ${_short_address} with ${_short_address} is not match!`
        );
      }
    }
  }

  // re-compute the eth address with code_hash info to make sure
  // it indeed match with short_address
  checkEthAddressIsEoa(
    eth_address: string,
    _target_short_address: string
  ): boolean {
    const source_short_address =
      this.computeShortAddressByEoaEthAddress(eth_address);
    console.log(source_short_address, _target_short_address);
    return (
      source_short_address.toLowerCase() === _target_short_address.toLowerCase()
    );
  }

  // default method
  async defaultQueryEthAddressByShortAddress(
    _short_address: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "poly_getEthAddressByGodwokenShortAddress",
        [_short_address],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(`unable to fetch eth address from ${_short_address}`)
            );
          return resolve(res.result);
        }
      );
    });
  }

  // default method
  async defaultSaveEthAddressShortAddressMapping(
    _eth_address: string,
    _short_address: string
  ) {
    return new Promise((resolve, reject) => {
      this.client.request(
        "poly_saveEthAddressGodwokenShortAddressMapping",
        [_eth_address, _short_address],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result !== "ok")
            return reject(
              new Error(
                `unable to save eth address and short address in web3 server.`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async getNonce(account_id: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_nonce",
        [`0x${account_id.toString(16)}`],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `unable to fetch nonce, account_id:${account_id}, ${JSON.stringify(
                  res
                )}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async assembleRawL2Transaction(
    eth_tx: EthTransaction
  ): Promise<RawL2Transaction> {
    const from = await this.getAccountIdByEoaEthAddress(eth_tx.from);
    const to = await this.allTypeEthAddressToAccountId(eth_tx.to);
    const nonce = await this.getNonce(parseInt(from));
    const encodedArgs = this.encodeArgs(eth_tx);
    const tx: RawL2Transaction = {
      from_id: "0x" + BigInt(from).toString(16),
      to_id: "0x" + BigInt(to).toString(16),
      args: encodedArgs,
      nonce: "0x" + BigInt(nonce).toString(16),
    };
    return tx;
  }

  generateTransactionMessageToSign(
    tx: RawL2Transaction,
    sender_script_hash: string,
    receiver_script_hash: string,
    is_add_prefix_in_signing_message: boolean = false
  ) {
    return this.godwkenUtils.generateTransactionMessageToSign(
      tx,
      sender_script_hash,
      receiver_script_hash,
      is_add_prefix_in_signing_message
    );
  }

  async generateMessageFromEthTransaction(tx: EthTransaction) {
    const { from, to } = tx;

    const to_id = await this.allTypeEthAddressToAccountId(to);
    const sender_script_hash = this.computeScriptHashByEoaEthAddress(from);
    const receiver_script_hash = await this.getScriptHashByAccountId(
      parseInt(to_id)
    );

    const polyjuice_tx = await this.assembleRawL2Transaction(tx);
    const message = this.generateTransactionMessageToSign(
      polyjuice_tx,
      sender_script_hash,
      receiver_script_hash,
      true // with personal sign prefixed
    );
    return message;
  }

  serializeL2Transaction(tx: L2Transaction) {
    const _tx = NormalizeL2Transaction(tx);
    return new Reader(SerializeL2Transaction(_tx)).serializeJson();
  }

  serializeRawL2Transaction(tx: RawL2Transaction) {
    const _tx = NormalizeRawL2Transaction(tx);
    return new Reader(SerializeRawL2Transaction(_tx)).serializeJson();
  }

  async gw_executeL2Tranaction(
    raw_tx: RawL2Transaction,
    signature: HexString
  ): Promise<string> {
    const l2_tx = { raw: raw_tx, signature: signature };
    const serialize_tx = this.serializeL2Transaction(l2_tx);
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_execute_l2_tranaction",
        [serialize_tx],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `failed to send gw_executeL2Tranaction rpc, ${JSON.stringify(
                  res
                )}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async gw_executeRawL2Transaction(raw_tx: RawL2Transaction): Promise<any> {
    const serialize_tx = this.serializeRawL2Transaction(raw_tx);
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_execute_raw_l2transaction",
        [serialize_tx],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `failed to send gw_executeRawL2Tranaction rpc, ${JSON.stringify(
                  res
                )}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async gw_submitL2Transaction(
    raw_tx: RawL2Transaction,
    signature: HexString
  ): Promise<string> {
    const l2_tx = { raw: raw_tx, signature: signature };
    const serialize_tx = this.serializeL2Transaction(l2_tx);
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_submit_l2transaction",
        [serialize_tx],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `failed to send gw_submitL2Transaction rpc, ${JSON.stringify(
                  res
                )}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async gw_submitSerializedL2Transaction(
    serialize_tx: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_submit_l2transaction",
        [serialize_tx],
        (err: any, res: any) => {
          if (err) return reject(err);
          if (!res || res.result === undefined || res.result === null)
            return reject(
              new Error(
                `failed to send gw_submitL2Transaction rpc, ${JSON.stringify(
                  res
                )}`
              )
            );
          return resolve(res.result);
        }
      );
    });
  }

  async gw_getTransactionReceipt(tx_hash: Hash): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "gw_get_transaction_receipt",
        [tx_hash],
        (err: any, res: any) => {
          if (err) return reject(err);
          //if(!res || res.result === undefined || res.result === null) resolve( Error(`failed to send gw_getTransactionReceipt rpc, ${JSON.stringify(res)}`);
          return resolve(res.result);
        }
      );
    });
  }

  async getPolyjuiceCreatorAccountId(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request("poly_getCreatorId", [], (err: any, res: any) => {
        if (err) return reject(err);
        return resolve(res.result);
      });
    });
  }

  async getPolyjuiceDefaultFromAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "poly_getDefaultFromAddress",
        [],
        (err: any, res: any) => {
          if (err) return reject(err);
          return resolve(res.result);
        }
      );
    });
  }

  async eth_getTransactionReceipt(tx_hash: Hash): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        "eth_getTransactionReceipt",
        [tx_hash],
        (err: any, res: any) => {
          if (err) return reject(err);
          //if(!res || res.result === undefined || res.result === null) resolve( Error(`failed to send gw_getTransactionReceipt rpc, ${JSON.stringify(res)}`);
          return resolve(res.result);
        }
      );
    });
  }

  // todo: timeout should be set with > 5 blocks long, may change in mainnet.
  async waitForTransactionReceipt(tx_hash: Hash, timeout: number = 225, loopInterval = 3) {
    for (let index = 0; index < timeout; index += loopInterval) {
      const tx_receipt = await this.eth_getTransactionReceipt(
        tx_hash
      );
      console.log(`keep fetching tx_receipt with ${tx_hash}, waited for ${index} seconds`);

      await this.asyncSleep(loopInterval * 1000);

      if (tx_receipt !== null) {
        return;
      }
    }
    throw new Error(`tx might be failed: cannot fetch tx_receipt with tx ${tx_hash} in ${timeout} seconds`);
  }

  asyncSleep(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async allTypeEthAddressToAccountId(_address: HexString): Promise<HexNumber> {
    // todo: support create2 address in such case that it haven't create real contract yet.
    const address = Buffer.from(_address.slice(2), "hex");
    if (address.byteLength !== 20)
      throw new Error(`Invalid eth address length: ${address.byteLength}`);

    if (address.equals(Buffer.from(Array(20).fill(0))))
      // special-case: meta-contract address should return creator id
      return await this.getPolyjuiceCreatorAccountId();

    try {
      // assume it is normal contract address, thus an godwoken-short-address
      const script_hash = await this.getScriptHashByShortAddress(_address);
      return await this.getAccountIdByScriptHash(script_hash);
    } catch (error) {
      if (
        !JSON.stringify(error).includes(
          "unable to fetch script hash from short address"
        )
      )
        throw error;

      // otherwise, assume it is EOA address
      const script_hash = this.computeScriptHashByEoaEthAddress(_address);
      const accountId = await this.getAccountIdByScriptHash(script_hash);
      return accountId;
    }
  }

  encodeArgs(_tx: EthTransaction) {
    const { to, gasPrice, gas: gasLimit, value, data } = _tx;

    // header
    const args_0_7 =
      "0x" +
      Buffer.from("FFFFFF", "hex").toString("hex") +
      Buffer.from("POLY", "utf8").toString("hex");

    // gas limit
    const args_8_16 = this.UInt64ToLeBytes(BigInt(gasLimit));
    // gas price
    const args_16_32 = this.UInt128ToLeBytes(
      gasPrice === "0x" ? BigInt(0) : BigInt(gasPrice)
    );
    // value
    const args_32_48 = this.UInt128ToLeBytes(
      value === "0x" ? BigInt(0) : BigInt(value)
    );

    const dataByteLength = Buffer.from(data.slice(2), "hex").length;
    // data length
    const args_48_52 = this.UInt32ToLeBytes(dataByteLength);
    // data
    const args_data = data;

    let args_7 = "";
    if (to === DEFAULT_EMPTY_ETH_ADDRESS || to === "0x" || to === "0x0") {
      args_7 = "0x03";
    } else {
      args_7 = "0x00";
    }

    const args =
      "0x" +
      args_0_7.slice(2) +
      args_7.slice(2) +
      args_8_16.slice(2) +
      args_16_32.slice(2) +
      args_32_48.slice(2) +
      args_48_52.slice(2) +
      args_data.slice(2);

    return args;
  }

  // todo: move to another file
  UInt32ToLeBytes(num: number): HexString {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(+num, 0);
    return "0x" + buf.toString("hex");
  }

  UInt64ToLeBytes(num: bigint): HexString {
    num = BigInt(num);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(num);
    return `0x${buf.toString("hex")}`;
  }

  UInt128ToLeBytes(u128: bigint): HexString {
    if (u128 < U128_MIN) {
      throw new Error(`u128 ${u128} too small`);
    }
    if (u128 > U128_MAX) {
      throw new Error(`u128 ${u128} too large`);
    }
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64LE(u128 & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
    buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
    return "0x" + buf.toString("hex");
  }

  LeBytesToUInt32(hex: HexString): number {
    const buf = Buffer.from(hex.slice(2), "hex");
    return buf.readUInt32LE();
  }
}

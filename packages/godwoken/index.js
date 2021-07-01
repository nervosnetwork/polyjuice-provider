const { RPC, Reader } = require("ckb-js-toolkit");
const { utils } = require("@ckb-lumos/base");
const keccak256 = require("keccak256");
const {
  NormalizeL2Transaction,
  NormalizeRawL2Transaction,
  NormalizeCreateAccount,
  NormalizeWithdrawalRequest,
  NormalizeRawWithdrawalRequest,
} = require("./lib/normalizer");
const normalizer = require("./lib/normalizer");
const core = require("./schemas");

function numberToUInt32LE(value) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return `0x${buf.toString("hex")}`;
}

function UInt32LEToNumber(hex) {
  const buf = Buffer.from(hex.slice(2, 10), "hex");
  return buf.readUInt32LE(0);
}

function u32ToHex(value) {
  return `0x${value.toString(16)}`;
}
function hexToU32(hex) {
  return parseInt(hex.slice(2), "hex");
}

function toBuffer(ab) {
  var buf = Buffer.alloc(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}
function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

class Godwoken {
  constructor(url) {
    this.rpc = new RPC(url);
    this.utils = new GodwokenUtils();
  }

  async _send(l2tx, method) {
    const data = new Reader(
      core.SerializeL2Transaction(NormalizeL2Transaction(l2tx))
    ).serializeJson();
    return await method(data);
  }

  async ping() {
    return await this.rpc.ping();
  }

  async getTipBlockHash() {
    return await this.rpc.get_tip_block_hash();
  }

  async getBlockHash(block_number) {
    return await this.rpc.get_block_hash(block_number);
  }

  async getBlock(block_hash) {
    return await this.rpc.get_block(block_hash);
  }

  async getBlockByNumber(block_number) {
    return await this.rpc.get_block_by_number(block_number);
  }

  async executeL2Transaction(l2tx) {
    return this._send(l2tx, this.rpc.execute_l2transaction);
  }
  async submitL2Transaction(l2tx) {
    return this._send(l2tx, this.rpc.submit_l2transaction);
  }
  async submitWithdrawalRequest(request) {
    const data = new Reader(
      core.SerializeWithdrawalRequest(NormalizeWithdrawalRequest(request))
    ).serializeJson();
    return await this.rpc.submit_withdrawal_request(data);
  }
  async getBalance(sudt_id, account_id) {
    // TODO: maybe swap params later?
    console.log("0x" + account_id.toString(16), "0x" + sudt_id.toString(16));
    const hex = await this.rpc.get_balance(
      "0x" + account_id.toString(16),
      "0x" + sudt_id.toString(16)
    );
    return BigInt(hex);
  }
  async getStorageAt(account_id, key) {
    return await this.rpc.get_storage_at(account_id, key);
  }
  async getAccountIdByScriptHash(script_hash) {
    return await this.rpc.get_account_id_by_script_hash(script_hash);
  }
  async getNonce(account_id) {
    console.log(account_id.toString(16));
    return await this.rpc.get_nonce("0x" + account_id.toString(16));
  }
  async getScript(script_hash) {
    return await this.rpc.get_script(script_hash);
  }
  async getScriptHash(account_id) {
    return await this.rpc.get_script_hash("0x" + account_id.toString(16));
  }
  async getData(data_hash) {
    return await this.rpc.get_data(data_hash);
  }
}

class GodwokenUtils {
  constructor(rollup_type_hash) {
    this.rollup_type_hash = rollup_type_hash;
  }

  generateTransactionMessageToSign(
    raw_l2tx,
    _sender_scirpt_hash,
    _receiver_script_hash,
    add_prefix = true
  ) {
    const raw_tx_data = core.SerializeRawL2Transaction(
      NormalizeRawL2Transaction(raw_l2tx)
    );
    const rollup_type_hash = Buffer.from(this.rollup_type_hash.slice(2), "hex");
    const sender_scirpt_hash = Buffer.from(_sender_scirpt_hash.slice(2), "hex");
    const receiver_script_hash = Buffer.from(
      _receiver_script_hash.slice(2),
      "hex"
    );

    const data = toArrayBuffer(
      Buffer.concat([
        rollup_type_hash,
        sender_scirpt_hash,
        receiver_script_hash,
        toBuffer(raw_tx_data),
      ])
    );
    const message = utils.ckbHash(data).serializeJson();

    if (add_prefix === false) {
      // do not add `\x19Ethereum Signed Message:\n32` prefix when generating message
      // set true when you want to pass message for metamask signing,
      // metamask will add this automattically.

      return message;
    }

    const prefix_buf = Buffer.from(`\x19Ethereum Signed Message:\n32`);
    const buf = Buffer.concat([
      prefix_buf,
      Buffer.from(message.slice(2), "hex"),
    ]);
    return `0x${keccak256(buf).toString("hex")}`;
  }

  generateWithdrawalMessageToSign(raw_request) {
    const raw_request_data = core.SerializeRawWithdrawalRequest(
      NormalizeRawWithdrawalRequest(raw_request)
    );
    const rollup_type_hash = Buffer.from(this.rollup_type_hash.slice(2), "hex");
    const data = toArrayBuffer(
      Buffer.concat([rollup_type_hash, toBuffer(raw_request_data)])
    );
    const message = utils.ckbHash(data).serializeJson();
    const prefix_buf = Buffer.from(`\x19Ethereum Signed Message:\n32`);
    const buf = Buffer.concat([
      prefix_buf,
      Buffer.from(message.slice(2), "hex"),
    ]);
    return `0x${keccak256(buf).toString("hex")}`;
  }

  static createAccountRawL2Transaction(from_id, nonce, script) {
    const create_account = {
      script,
      fee: {
        sudt_id: "0x1",
        amount: "0x0",
      },
    };
    const enum_tag = "0x00000000";
    const create_account_part = new Reader(
      core.SerializeCreateAccount(NormalizeCreateAccount(create_account))
    ).serializeJson();
    const args = enum_tag + create_account_part.slice(2);
    return {
      from_id: u32ToHex(from_id),
      to_id: u32ToHex(0),
      nonce: u32ToHex(nonce),
      args,
    };
  }

  static createRawWithdrawalRequest(
    nonce,
    capacity,
    amount,
    sudt_script_hash,
    account_script_hash,
    sell_amount,
    sell_capacity,
    owner_lock_hash,
    payment_lock_hash
  ) {
    return {
      nonce: "0x" + BigInt(nonce).toString(16),
      capacity: "0x" + BigInt(capacity).toString(16),
      amount: "0x" + BigInt(amount).toString(16),
      sudt_script_hash: sudt_script_hash,
      account_script_hash: account_script_hash,
      sell_amount: "0x" + BigInt(sell_amount).toString(16),
      sell_capacity: "0x" + BigInt(sell_capacity).toString(16),
      owner_lock_hash: owner_lock_hash,
      payment_lock_hash: payment_lock_hash,
    };
  }
}

module.exports = {
  Godwoken,
  GodwokenUtils,
  numberToUInt32LE,
  UInt32LEToNumber,
  u32ToHex,
  hexToU32,
  toBuffer,
  core,
  normalizer,
};

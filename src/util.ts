import '@babel/polyfill';

import { Script, Hash, utils, HexNumber, HexString } from "@ckb-lumos/base";

import { GodwokenUtils, RawL2Transaction, L2Transaction } from "./godwoken";
import { SerializeL2Transaction, Uint32 } from "./godwoken/schemas";
import { NormalizeL2Transaction} from "./godwoken/normalizer";

import { Reader } from "ckb-js-toolkit";

const jaysonBrowserClient = require('jayson/lib/client/browser');

export type EthTransaction = {
    from: HexString 
    to: HexString
    gas?: HexNumber
    value: HexNumber
    data: HexString
    nonce?: HexNumber
}

export type L2TransactionArgs = {
    to_id: number,
    value: bigint,
    data: HexString
}

export type GodwokerOption = {
  godwoken: {
    rollup_type_hash: Hash
    eth_account_lock: Omit<Script, 'args'> 
  }
  request_option?: object
}

export class Godwoker {
    private eth_account_lock: Omit<Script, 'args'>;
    private rollup_type_hash: string;
    private client: any;
    private godwkenUtils: GodwokenUtils;

    constructor (host: string, option: GodwokerOption) {
        const callServer = function(request: any, callback: any) {
            const opt = option.request_option || {
              method: 'POST',
              body: request,
              headers: {
                'Content-Type': 'application/json',
              }
            };
            fetch(host, opt)
              .then(function(res) { return res.text(); })
              .then(function(text) { callback(null, text); })
              .catch(function(err) { callback(err); });
        };
        this.client = jaysonBrowserClient(callServer);
        this.godwkenUtils = new GodwokenUtils(option.godwoken.rollup_type_hash);
        this.eth_account_lock = option.godwoken.eth_account_lock;
        this.rollup_type_hash = option.godwoken.rollup_type_hash;
    }

    packSignature(_signature: Hash): Hash{
      let v = Number.parseInt(_signature.slice(-2), 16);
      if (v >= 27) v -= 27;
      const signature = _signature.slice(0, -2) + v.toString(16).padStart(2, "0");
      return signature;
    }

    getScriptHashByEthAddress(eth_address: string): string{
      const layer2_lock: Script = {
        code_hash: this.eth_account_lock.code_hash,
        hash_type: this.eth_account_lock.hash_type as "type" | "data",
        args:  this.rollup_type_hash + eth_address.slice(2)
      }
      const lock_hash = utils.computeScriptHash(layer2_lock); 
      return lock_hash;
    }

    async getScriptHashByAccountId(account_id: number): Promise<string>{
      return new Promise(resolve => {
        this.client.request("eth_gw_getScriptHashByAccountId", [`${account_id.toString(16)}`], (err: any, res: any) => {
            if(err) throw err;
            if(res.result === undefined || res.result === null) throw Error(`unable to fetch account script hash from ${account_id}`);
            resolve(res.result);
        });
      })
    }

    async getAccountId (eth_address: string): Promise<string> {
        const layer2_lock: Script = {
            code_hash: this.eth_account_lock.code_hash,
            hash_type: this.eth_account_lock.hash_type as "type" | "data",
            args:  this.rollup_type_hash + eth_address.slice(2)
        }
        const lock_hash = utils.computeScriptHash(layer2_lock);
        return new Promise(resolve => {
            this.client.request("eth_gw_getAccountIdByScriptHash", [lock_hash], (err: any, res: any) => {
                if(err) throw err;
                if(res.result === undefined || res.result === null) throw Error(`unable to fetch account id from ${eth_address}, lock_hash is ${lock_hash}`);
                resolve(res.result);
            });
        })
    }

    async getNonce (account_id: number): Promise<string> {
      return new Promise(resolve => {
          this.client.request("eth_gw_getNonce", [`0x${account_id.toString(16)}`], (err: any, res: any) => {
              if(err) throw err;
              if(res.result === undefined || res.result === null) throw Error(`unable to fetch nonce, account_id:${account_id}, ${JSON.stringify(res)}`);
              resolve(res.result);
          });
      })
    }

    async assembleRawL2Transaction (eth_tx: EthTransaction): Promise<RawL2Transaction> {
        const from = await this.getAccountId(eth_tx.from); 
        const to = await this.extractTo(eth_tx.to);
        const nonce = await this.getNonce(parseInt(from));
        const args: L2TransactionArgs = {
            to_id: parseInt(to, 16),
            data: eth_tx.data,
            value: BigInt(eth_tx.value)
        }
        const encodedArgs = this.encodeArgs(args);
        const tx: RawL2Transaction = {
            from_id: '0x' + BigInt(from).toString(16),
            to_id: '0x' + BigInt(to).toString(16),
            args: encodedArgs,
            nonce: '0x' + BigInt(nonce).toString(16),
        };
        return tx;
    }

    generateTransactionMessageToSign (tx: RawL2Transaction, sender_script_hash: string, receiver_script_hash: string) {
      const add_prefix_in_signing_message = false;
      return this.godwkenUtils.generateTransactionMessageToSign(tx, sender_script_hash, receiver_script_hash, add_prefix_in_signing_message);
    }

    serializeL2Transaction (tx: L2Transaction) {
      const _tx = NormalizeL2Transaction(tx);
      return new Reader(
        SerializeL2Transaction(_tx)
      ).serializeJson();
    }

    async gw_executeL2Tranaction (raw_tx: RawL2Transaction, signature: HexString) {
      const l2_tx = {raw: raw_tx, signature: signature};
      console.log(JSON.stringify(l2_tx, null, 2));
      const serialize_tx = this.serializeL2Transaction(l2_tx); 
      return new Promise(resolve => {
        this.client.request("eth_gw_executeL2Tranaction", [serialize_tx], (err: any, res: any) => {
            if(err) throw err;
            if(res.result === undefined || res.result === null) throw Error(`failed to send gw_executeL2Tranaction rpc, ${JSON.stringify(res)}`);
            resolve(res.result);
        });
      }) 
    }

    async gw_submitL2Transaction (raw_tx: RawL2Transaction, signature: HexString) {
      const l2_tx = {raw: raw_tx, signature: signature};
      const serialize_tx = this.serializeL2Transaction(l2_tx); 
      return new Promise(resolve => {
        this.client.request("eth_gw_submitL2Transaction", [serialize_tx], (err: any, res: any) => {
            if(err) throw err;
            if(res.result === undefined || res.result === null) throw Error(`failed to send gw_submitL2Transaction rpc, ${JSON.stringify(res)}`);
            resolve(res.result);
        });
      }) 
    }

    async gw_getTransactionReceipt (tx_hash: Hash) {
      return new Promise(resolve => {
        this.client.request("eth_gw_getTransactionReceipt", [tx_hash], (err: any, res: any) => {
            if(err) throw err;
            //if(res.result === undefined || res.result === null) throw Error(`failed to send gw_getTransactionReceipt rpc, ${JSON.stringify(res)}`);
            resolve(res.result);
        });
      }) 
    }

    async waitForTransactionReceipt(tx_hash: Hash){
      while (true) {
        await this.asyncSleep(3000);
        const tx_receipt = await this.gw_getTransactionReceipt(
          tx_hash
        );
        console.log(`keep waitting for tx_receipt: ${JSON.stringify(tx_receipt)}`);
  
        if (tx_receipt) {
          break;
        }
      }
      return;
    }

    asyncSleep(ms = 0) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async extractTo (address: HexString) {
      if(address.slice(2).substring(8, 40) === '0'.repeat(32) ) { // contract address, encoded with polyuice method: see accountIdToEthAddr and ethAddrToAccountId 
        return this.ethAddrToAccountId(address);
      }

      // account address, fetch id from rpc
      const account_id = await this.getAccountId(address);
      return account_id;
    }

    /* 
       polyjuice account_id vs eth_address convert rule.
       see: https://github.com/nervosnetwork/godwoken-polyjuice/blob/v0.1.4/polyjuice-tests/src/helper.rs#L70-L88
    */
    accountIdToEthAddr (_id: HexNumber, _ethabi?: boolean): HexString{
      const ethabi = _ethabi === true ? _ethabi : false;
      const offset = ethabi ? 12 : 0;
      var data = new Uint8Array(offset + 20);
      const id_u32 = new Uint32(this.numberToArrayBuffer(parseInt(_id, 16), 4))
      var id = Buffer.from(this.numberToArrayBuffer(id_u32.toLittleEndianUint32(), 4));

      data[offset] = id[0];
      data[offset+1] = id[1];
      data[offset+2] = id[2];
      data[offset+3] = id[3];       
      
      return '0x' + Buffer.from(data).toString('hex');
    }

    ethAddrToAccountId (_address: HexString): HexNumber {
      const address = Buffer.from(_address.slice(2), "hex");
      if( address.byteLength !== 20 )
        throw new Error(`Invalid eth address length: ${address.byteLength}`);
      if( !address.slice(4, 20).equals(Buffer.from(Array(16).fill(0))) ) 
        throw new Error(`Invalid eth address data: ${JSON.stringify(address.slice(4,20))}, ${JSON.stringify(Buffer.from(Array(16).fill(0)))}`);

      const _id = new Uint32(this.numberToArrayBuffer(parseInt(address.slice(0, 4).toString('hex'), 16), 4)).toLittleEndianUint32();
      const id = Buffer.from(this.numberToArrayBuffer(_id, 4));
      return '0x' + parseInt(id.toString('hex'), 16).toString(16);
    }

    numberToArrayBuffer(value: number, length: number) {
      const view = new DataView(new ArrayBuffer(length))
      for (var index = length - 1; index >= 0; --index) {
        view.setUint8(index, value % 256)
        value = value >> 8;
      }
      return view.buffer;
    }

    // {gas_limit: u64, gas_price: u128, value: u128}
    encodeArgs( args: L2TransactionArgs) {
      const {to_id, value, data}  = args;
      const gas_limit = 21000000n; // todo remove: hard-code
      const gas_price = 50n; // todo remove: hard-code
      const call_kind = to_id > 0 ? 0 : 3;
      const data_buf = Buffer.from(data.slice(2), "hex");
    
      const gas_limit_buf = Buffer.alloc(8);
      gas_limit_buf.writeBigUInt64LE(gas_limit);
    
      const gas_price_buf = Buffer.alloc(16);
      gas_price_buf.writeBigUInt64LE(gas_price & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
      gas_price_buf.writeBigUInt64LE(gas_price >> BigInt(64), 8);
    
      const value_buf = Buffer.alloc(32);
      value_buf.writeBigUInt64BE(value & BigInt("0xFFFFFFFFFFFFFFFF"), 24);
      value_buf.writeBigUInt64BE(value >> BigInt(64), 16);
    
      const data_size_buf = Buffer.alloc(4);
      data_size_buf.writeUInt32LE(data_buf.length);
      const total_size = 62 + data_buf.length;
    
      const buf = Buffer.alloc(total_size);
    
      buf[0] = call_kind;
      // not static call
      buf[1] = 0;
      gas_limit_buf.copy(buf, 2);
      gas_price_buf.copy(buf, 10);
      value_buf.copy(buf, 26);
      data_size_buf.copy(buf, 58);
      data_buf.copy(buf, 62);
      return `0x${buf.toString("hex")}`;
    }
    
}
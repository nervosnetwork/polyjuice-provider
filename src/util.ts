import '@babel/polyfill';

import { Script, Hash, utils, HexNumber, HexString } from "@ckb-lumos/base";

import { GodwokenUtils, RawL2Transaction, L2Transaction } from "./godwoken";
import { SerializeL2Transaction } from "./godwoken/schemas";
import { NormalizeL2Transaction} from "./godwoken/normalizer";

import { Reader } from "ckb-js-toolkit";
import createKeccakHash from "keccak";
//import keccak256 from "keccak256";

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
    layer2_lock: Omit<Script, 'args'>
  }
  request_option?: object
}

export class Godwoker {
    private layer2_lock: Omit<Script, 'args'>;
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
        this.layer2_lock = option.godwoken.layer2_lock
    }

    async getAccountId (eth_address: string): Promise<string> {
        const layer2_lock: Script = {
            code_hash: this.layer2_lock.code_hash,
            hash_type: this.layer2_lock.hash_type,
            args: eth_address
        }
        const lock_hash = utils.computeScriptHash(layer2_lock);
        return new Promise(resolve => {
            this.client.request("gw_getAccountIdByScriptHash", [lock_hash], (err: any, res: any) => {
                if(err) throw err;
                if(res.result === undefined || res.result === null) throw Error(`unable to fetch account id from ${eth_address}, lock_hash is ${lock_hash}`);
                resolve(res.result);
            });
        })
    }

    async getNonce (account_id: number): Promise<string> {
      return new Promise(resolve => {
          this.client.request("gw_getNonce", [account_id], (err: any, res: any) => {
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

    generateTransactionMessageToSign (tx: RawL2Transaction) {
      return this.godwkenUtils.generateTransactionMessageToSign(tx);
    }

    serializeL2Transaction (tx: L2Transaction) {
      const _tx = NormalizeL2Transaction(tx);
      return new Reader(
        SerializeL2Transaction(_tx)
      ).serializeJson();
    }

    async gw_executeL2Tranaction (raw_tx: RawL2Transaction, signature: HexString) {
      const l2_tx = {raw: raw_tx, signature: signature};
      const serialize_tx = this.serializeL2Transaction(l2_tx); 
      return new Promise(resolve => {
        this.client.request("gw_executeL2Tranaction", [serialize_tx], (err: any, res: any) => {
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
        this.client.request("gw_submitL2Transaction", [serialize_tx], (err: any, res: any) => {
            if(err) throw err;
            if(res.result === undefined || res.result === null) throw Error(`failed to send gw_submitL2Transaction rpc, ${JSON.stringify(res)}`);
            resolve(res.result);
        });
      }) 
    }

    async extractTo (address: HexString) {
      if(address.slice(2).substring(0, 32) === '0'.repeat(32) ) { // contract address, encoded with our simple method: see encodeContractAddr
        return this.decodeContractAddr(address);
      }

      // account address, fetch id from rpc
      const account_id = await this.getAccountId(address);
      return account_id;
    }

    encodeContractAddr (account_id: HexNumber) {
      if( BigInt(account_id) > BigInt('0x'+'f'.repeat(8)) ) throw Error(`the max account id is 0xfffffffff, received ${account_id}`);

      // encode rule: 
      //  1. total fixed-length 42 (20 bytes) start with '0x'
      //  2. last 8 length is the HexNumber of account_id
      //  3. first 32 after '0x' is all zero
      const tail = ( '0'.repeat(10) + account_id.slice(2) ).slice(-8);
      const head = '0'.repeat(32);
      return this.toChecksumAddress('0x' + head + tail);
    }

    decodeContractAddr (address: HexString) {
        return '0x' + BigInt(address).toString(16);
    }

    // make a hexString meets the requirement of eth address checksum
    // copy from https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md
    toChecksumAddress (address: HexString) {
      address = address.toLowerCase().replace('0x', '')
      var hash = createKeccakHash('keccak256').update(address).digest('hex');
      //var hash = keccak256(address).toString("hex")
      var ret = '0x'
    
      for (var i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
          ret += address[i].toUpperCase()
        } else {
          ret += address[i]
        }
      }
    
      return ret
    }

    encodeArgs(args: L2TransactionArgs) {
        const {to_id, value, data}  = args;
        const call_kind = to_id > 0 ? 0 : 3;
        const data_buf = Buffer.from(data.slice(2), "hex");

        const value_buf = Buffer.alloc(32);
        value_buf.writeBigUInt64BE(value & BigInt("0xFFFFFFFFFFFFFFFF"), 24);
        value_buf.writeBigUInt64BE(value >> BigInt(64), 16);
      
        const data_size_buf = Buffer.alloc(4);
        data_size_buf.writeUInt32LE(data_buf.length, 0);
        const total_size = 40 + data_buf.length;
      
        const buf = Buffer.alloc(total_size);
      
        // depth = 0
        buf[0] = 0;
        buf[1] = 0;
        // call kind
        buf[2] = call_kind;
        // not static call
        buf[3] = 0;
        value_buf.copy(buf, 4);
        data_size_buf.copy(buf, 36);
        data_buf.copy(buf, 40);
        return `0x${buf.toString("hex")}`;
    }
    
}
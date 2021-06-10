const HttpProvider = require('web3-providers-http');
const { Godwoker } = require('./util');

class PolyjuiceHttpProvider extends HttpProvider {
    
    constructor (host, godwoken_config, option) {
        super(host, option);
        this.godwoker = new Godwoker(host, godwoken_config);
    }

    async send (payload, callback) {
        const { method, params } = payload;

        switch (method) {

            case 'eth_sendTransaction':
                    
                if (!window.ethereum) {
                    alert('PolyjuiceHttpProvider needs a wallet provider such as metamask!');
                    break;
                }

                try {
                    const { from, gas, gasPrice, value, data, to } = params[0];
                    const t = {
                        from: from || window.ethereum.selectedAddress,
                        to: to,
                        value: value || 0,
                        data: data || '',
                        gas: gas,
                        gasPrice: gasPrice
                    }

                    const to_id = this.godwoker.allTypeEthAddressToAccountId(to);
                    const sender_script_hash = this.godwoker.getScriptHashByEoaEthAddress(from);
                    const receiver_script_hash = await this.godwoker.getScriptHashByAccountId(to_id);

                    const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
                    const message = this.godwoker.generateTransactionMessageToSign(polyjuice_tx, sender_script_hash, receiver_script_hash);
                    const _signature = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [message, window.ethereum.selectedAddress],
                    });
                    const signature = this.godwoker.packSignature(_signature);
                    const tx_hash = await this.godwoker.gw_submitL2Transaction(polyjuice_tx, signature);
                    await this.godwoker.waitForTransactionReceipt(tx_hash);
                    const run_result = await this.godwoker.gw_getTransactionReceipt(tx_hash);
                    console.log(`runResult: ${JSON.stringify(run_result, null, 2)}`);
                    break;
                } catch (error) {
                    this.connected = false;
                    throw error;
                }


           default:

               try {
                   super.send(payload, callback);
                   break;
               } catch(error) {
                   this.connected = false;
                   throw error;
               }
        } 
    }
}

module.exports = PolyjuiceHttpProvider

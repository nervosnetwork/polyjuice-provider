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

            case 'eth_call':

                if (!window.ethereum) {
                    alert('PolyjuiceHttpProvider needs a wallet provider such as metamask!');
                    break;
                }

                try {
                    const { from, gas, value, data, to } = params[0];
                    const t = {
                        from: from || window.ethereum.selectedAddress,
                        to: to,
                        value: value || 0,
                        data: data || '',
                        gas: gas 
                    }
                    const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
                    const message = this.godwoker.generateTransactionMessageToSign(polyjuice_tx);
                    const signature = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [message, window.ethereum.selectedAddress],
                    })
                    const run_result = await this.godwoker.gw_executeL2Tranaction(polyjuice_tx, signature);
                    console.log(`runResult: ${JSON.stringify(run_result, null, 2)}`);
                    break;
                } catch(error) {
                    this.connected = false;
                    throw error;
                }
            
            case 'eth_sendTransaction':
                    
                if (!window.ethereum) {
                    alert('PolyjuiceHttpProvider needs a wallet provider such as metamask!');
                    break;
                }

                try {
                    const { from, gas, value, data, to } = params[0];
                    const t = {
                        from: from || window.ethereum.selectedAddress,
                        to: to,
                        value: value || 0,
                        data: data || '',
                        gas: gas 
                    }
                    const polyjuice_tx = await this.godwoker.assembleRawL2Transaction(t);
                    const message = this.godwoker.generateTransactionMessageToSign(polyjuice_tx);
                    const signature = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [message, window.ethereum.selectedAddress],
                    });
                    const run_result = await this.godwoker.gw_submitL2Transaction(polyjuice_tx, signature);
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

    // convert polyjuice-contract-account-id to ethAddress-compaitable string
    // eg: 
    //    ```
    //        const contractInstance = new web3.eth.Contract(abi, <used in here...>);
    //    ```
    encodeContractAddr (account_id) {
        return this.godwoker.encodeContractAddr(account_id);
    }
}

module.exports = PolyjuiceHttpProvider
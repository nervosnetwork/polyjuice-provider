const test = require("ava");
const PolyjuiceHttpProvider = require('../lib/node/polyjuice_provider.js');

var util;
var eth_address;

test.before(t => {
    // init provider and web3
    const godwoken_rpc_url = 'http://127.0.0.1:8119';
    const provider_config =  {
        godwoken: {
            rollup_type_hash: "0x0cafffe5a6049ee107a3c9f83c68984806028b4cf196d841739ba92e31e5288f",
            layer2_lock: {
                code_hash: "0x0000000000000000000000000000000000000000000000000000000000000001",
                hash_type: "data"
            }
        }
    }
    const provider = new PolyjuiceHttpProvider(godwoken_rpc_url, provider_config);
    util = provider.godwoker;
})

test.serial("account_id to eth address", (t) => {
    eth_address = util.accountIdToEthAddr('0x6');
    t.is(eth_address, '0x0600000000000000000000000000000000000000');
});

test.serial("eth address to account_id", (t) => {
    t.is(util.ethAddrToAccountId(eth_address), '0x6');
});


#!/bin/bash

s=$(curl $WEB3_URL -s --retry 3 --retry-connrefused -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBalance","params": ["'$TEST_ETH_ADDRESS'", "latest"],"id":1}')
if [[ $s =~ '"jsonrpc":"2.0"' ]]; then
        :
else echo "call getBalance rpc failed" && exit 137
fi

if [[ $s =~ "{"jsonrpc":"2.0","id":1,"result":"0x0"}" ]]; then
        curl $POLYJUICE_URL/deposit?eth_address=$TEST_ETH_ADDRESS
else echo "account already initialed. skip. getBalance Result: $s."
fi
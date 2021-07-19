DEFAULT_WEB3_RPC=http://localhost:8024

prepare_env_files(){
  filePath=./.test.env
  generate_test_env $filePath
  paste_env_file_to_all_workspaces $filePath
}

generate_test_env(){
    printf '%b\n' "=== Polyjuice Config ==="
    printf '%b\n'
    printf "Rollup type hash: ";
    read;
    rollupTypeHash=${REPLY}

    printf "Eth account lock code hash: ";
    read;
    ethAccountLockCodeHash=${REPLY}

    printf "(development-only) Private key: ";
    read -s;
    printf '%b\n'
    privateKey=${REPLY}

    node ./scripts/util.js privateKeyToEthAddress ${privateKey}
    ethAddress=$(printf '%b\n' "$(node ./scripts/util.js privateKeyToEthAddress ${privateKey})")

    printf "Web3 rpc url: ";
    read;
    [ -z "$REPLY" ] && web3RpcUrl=${DEFAULT_WEB3_RPC} || web3RpcUrl=${REPLY}

    printf "SimpleStorageV2 contract address: ";
    read;
    exampleContractAddress=${REPLY}
    
    cat > $1 <<EOF
WEB3_JSON_RPC=${web3RpcUrl}
ROLLUP_TYPE_HASH=${rollupTypeHash}
ETH_ACCOUNT_LOCK_CODE_HASH=${ethAccountLockCodeHash}
EXAMPLE_CONTRACT_ADDRESS=${exampleContractAddress}
PRIVATE_KEY=${privateKey}
ETH_ADDRESS=${ethAddress}
EOF
   printf '%b\n'
   printf '%b\n' "generating env file ${filePath} in project root."
}

paste_env_file_to_all_workspaces(){
  [[ -f $1 ]] || { printf '%b\n' "$1 is not a file." >&2;return 1;}
  cp $1 packages/godwoken/
  cp $1 packages/base/
  cp $1 packages/web3/
  cp $1 packages/ethers/
  cp $1 packages/truffle/

  printf '%b\n' "paste ${filePath} files to all worksapces."
}

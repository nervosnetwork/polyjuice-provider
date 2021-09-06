# Polyjuice-Provider APIs

Given that some Apis might changed following the development of this project, it is necessary to keep track of the current interface in one place. that way, developes can have a quick look when they face some break change from version upgrade.

`Note: we won't include everything in here, only for those which most likely to be used by developers.`

## Basic Type and Methods

Most useful common Types/Methods/Class are located in ***"@polyjuice-provider/base"*** package. if you can't find something, this is a good place to checkout first.

for all the following properties, you can import like:

```ts
import { SOME_NAME } from "@polyjuice-provider/base";
```

### types

```ts
type PolyjuiceConfig = {
  rollupTypeHash?: string;
  ethAccountLockCodeHash?: string;
  abiItems?: AbiItems;
  web3Url?: string;
};

type GodwokerOption = {
    godwoken?: {
        rollup_type_hash?: Hash;
        eth_account_lock?: Omit<Script, "args">;
    };
    queryEthAddressByShortAddress?: (short_address: string) => string;
    saveEthAddressShortAddressMapping?: (eth_address: string, short_address: string) => void;
    request_option?: object;
};

type AbiItems = AbiItem[];

enum ShortAddressType {
  eoaAddress,
  contractAddress,
  notExistEoaAddress,
  notExistContractAddress, // create2 contract which haven't really created, currently provider can't distinguish this type of address.
  creatorAddress, // special case: 0x00000...
}

interface ShortAddress {
  value: HexString;
  type: ShortAddressType;
}
```

### Methods

```ts
function serializeAddressMapping(addressMapping: AddressMapping): HexString;
function deserializeAddressMapping(value: HexString): AddressMapping;
function serializeRawL2TransactionWithAddressMapping(rawL2TransactionWithAddressMapping: RawL2TransactionWithAddressMapping): HexString;
function deserializeRawL2TransactionWithAddressMapping(value: HexString): RawL2TransactionWithAddressMapping;
function serializeL2TransactionWithAddressMapping(l2TransactionWithAddressMapping: L2TransactionWithAddressMapping): HexString;
function deserializeL2TransactionWithAddressMapping(value: HexString): L2TransactionWithAddressMapping;
function buildL2TransactionWithAddressMapping(tx: L2Transaction, addressMappingItemVec: AddressMappingItem[], abiItem?: HexString): L2TransactionWithAddressMapping;
function buildRawL2TransactionWithAddressMapping(tx: RawL2Transaction, addressMappingItemVec: AddressMappingItem[], abiItem?: HexString): RawL2TransactionWithAddressMapping;
function serializeL2Transaction(tx: L2Transaction): HexString;
function serializeRawL2Transaction(tx: RawL2Transaction): HexString;

function decodeArgs(_args: HexString): {
    header: string;
    type: string;
    gas_limit: string;
    gas_price: string;
    value: string;
    data_length: string;
    data: string;
};
function encodeArgs(_tx: EthTransaction): string;

class Godwoker {
    private eth_account_lock;
    private rollup_type_hash;
    private client;
    private godwokenUtils;
    private queryEthAddressByShortAddress;
    private saveEthAddressShortAddressMapping;
    constructor(host: string, option?: GodwokerOption);
    init(): Promise<void>;
    initSync(): Promise<void>;
    packSignature(_signature: HexString): HexString;
    jsonRPC(method: string, params: any[], _errMsgWhenNoResult?: string | null, requireResult?: RequireResult): Promise<any>;
    computeScriptHashByEoaEthAddress(eth_address: string): HexString;
    getScriptByScriptHash(_script_hash: string): Promise<Script>;
    getScriptHashByAccountId(account_id: number): Promise<HexString>;
    getAccountIdByScriptHash(script_hash: string): Promise<HexNumber>;
    getAccountIdByEoaEthAddress(eth_address: string): Promise<HexNumber>;
    getScriptHashByShortAddress(_address: string, requireResult?: RequireResult): Promise<HexString>;
    computeShortAddressByEoaEthAddress(_address: string): HexString;
    getShortAddressByAllTypeEthAddress(_address: string): Promise<ShortAddress>;
    getEthAddressByAllTypeShortAddress(_short_address: HexString): Promise<HexString>;
    isShortAddressOnChain(short_address: HexString): Promise<boolean>;
    checkEthAddressIsEoa(eth_address: string, _target_short_address: string): boolean;
    defaultQueryEthAddressByShortAddress(_short_address: string): Promise<HexString>;
    getNonce(account_id: number): Promise<HexNumber>;
    assembleRawL2Transaction(eth_tx: EthTransaction): Promise<RawL2Transaction>;
    generateTransactionMessageToSign(tx: RawL2Transaction, sender_script_hash: string, receiver_script_hash: string, is_add_prefix_in_signing_message?: boolean): string;
    generateMessageFromEthTransaction(tx: EthTransaction, msg_type?: SigningMessageType): Promise<string>;
    serializeL2Transaction(tx: L2Transaction): HexString;
    serializeRawL2Transaction(tx: RawL2Transaction): HexString;
    serializeL2TransactionWithAddressMapping(tx: L2TransactionWithAddressMapping): HexString;
    serializeRawL2TransactionWithAddressMapping(tx: RawL2TransactionWithAddressMapping): HexString;
    gw_executeL2Transaction(raw_tx: RawL2Transaction, signature: HexString): Promise<RunResult>;
    gw_executeRawL2Transaction(raw_tx: RawL2Transaction): Promise<RunResult>;
    poly_executeRawL2Transaction(raw_tx: RawL2TransactionWithAddressMapping): Promise<RunResult>;
    gw_submitL2Transaction(raw_tx: RawL2Transaction, signature: HexString): Promise<Hash>;
    gw_submitSerializedL2Transaction(serialize_tx: HexString): Promise<Hash>;
    poly_submitL2Transaction(l2_tx: L2TransactionWithAddressMapping): Promise<Hash>;
    poly_submitSerializedL2Transaction(serialize_tx: HexString): Promise<Hash>;
    gw_getTransactionReceipt(tx_hash: Hash): Promise<GwTransactionReceipt | null>;
    getRollupTypeHash(): Promise<HexString>;
    getEthAccountLockHash(): Promise<HexString>;
    getContractValidatorHash(): Promise<HexString>;
    getPolyjuiceCreatorAccountId(): Promise<HexNumber>;
    getPolyjuiceDefaultFromAddress(): Promise<HexString>;
    eth_getTransactionReceipt(tx_hash: Hash): Promise<EthTransactionReceipt | null>;
    waitForTransactionReceipt(tx_hash: Hash, timeout?: number, loopInterval?: number): Promise<void>;
    asyncSleep(ms?: number): Promise<unknown>;
    allTypeEthAddressToAccountId(_address: HexString): Promise<HexNumber>;
}

function serializeAbiItem(_abiItem: AbiItem): HexString;
function deserializeBoolFromByteOpt(value: ByteOpt): boolean | undefined;
function deserializeUtf8Bytes(value: Bytes): string;
function deserializeAbiType(value: number): AbiType;
function deserializeStateMutabilityType(value: number): StateMutabilityType;
function deserializeAbiItem(value: HexString): AbiItem;
function decodeInputDataByAbi(data: HexString, abiItem: AbiItem): DecodedMethod;
function filterInterestedInput(data: HexString, abiItem: AbiItem): DecodedMethodParam[];
function getAddressesFromInputDataByAbi(data: HexString, abiItem: AbiItem): string[];

class Abi {
    private abi_items;
    private interested_methods;
    private interested_method_ids;
    constructor(_abi_items: AbiItem[]);
    get_method_ids(_abi_items: AbiItem[]): MethodIDs;
    filter_interested_methods(_abi_items: AbiItem[]): AbiItem[];
    filter_interested_inputs(_abiItem: AbiItem): AbiInput[];
    filter_interested_outputs(_abiItem: AbiItem): AbiOutput[];
    get_interested_methods(): AbiItem[];
    get_abi_items(): AbiItem[];
    decode_method(data: string): DecodedMethod;
    get_interested_abi_item_by_encoded_data(data: string): AbiItem | undefined;
    refactor_data_with_short_address(data: string, calculate_short_address: (addr: string) => Promise<ShortAddress>, _mapping_callback?: (data: AddressMappingItem[]) => any): Promise<string>;
    refactor_return_value_with_short_address(return_value: string, abi_item: AbiItem, calculate_origin_eth_address: (_short_addr: string) => Promise<HexString>): Promise<any>;
    read_abi_from_json_file(): void;
}
```

## @polyjuice-provider/ethers

```ts
class PolyjuiceJsonRpcProvider extends providers.JsonRpcProvider {
    abi: Abi;
    godwoker: Godwoker;
    constructor(polyjuice_config: PolyjuiceConfig, url?: ConnectionInfo | string, network?: Networkish);
    setAbi(abiItems: AbiItems): void;
    sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>;
    send(method: string, params: Array<any>): Promise<any>;
    prepareRequest(method: string, params: any): [string, Array<any>];
}

interface PolyjuiceWebsocketProvider extends providers.WebSocketProvider {
    constructor(polyjuiceConfig: PolyjuiceConfig, url: string, network?: Networkish): any;
}

class PolyjuiceWebsocketProvider extends providers.WebSocketProvider {
    abi: Abi;
    godwoker: Godwoker;
    constructor(polyjuiceConfig: PolyjuiceConfig, url: string, network?: Networkish);
    setAbi(abiItems: AbiItems): void;
    sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>;
    prepareRequest(method: string, params: any): [string, Array<any>];
    send(method: string, params?: Array<any>): Promise<any>;
}

class PolyjuiceWallet extends Wallet {
    godwoker: Godwoker;
    abi: Abi;
    constructor(privateKey: BytesLike | ExternallyOwnedAccount | SigningKey, polyjuiceConfig: PolyjuiceConfig, provider?: providers.JsonRpcProvider);
    setAbi(abiItems: AbiItems): void;
    signTransaction(transaction: TransactionRequest): Promise<string>;
}
```

## @polyjuice-provider/web3

```ts
class PolyjuiceHttpProvider {
    signer: Signer;
    godwoker: Godwoker;
    abi: Abi;
    constructor(host: string, polyjuice_config: PolyjuiceConfig, options?: HttpProviderOptions);
    setAbi(abiItems: AbiItems): void;
    send(payload: any, callback?: (error: Error | null, result: JsonRpcResponse | undefined) => void):Promise<void>;
}

class PolyjuiceHttpProviderCli extends PolyjuiceHttpProvider {
    constructor(host: string, polyjuice_config: PolyjuiceConfig, private_key: string, _options?: HttpProviderOptions);
    send(payload: any, callback?: (error: Error | null, result: JsonRpcResponse | undefined) => void): Promise<void>;
}

class PolyjuiceWebsocketProvider extends Web3WsProvider {
    godwoker: Godwoker;
    abi: Abi;
    signer: Signer;
    requestQueue: Map<number | string, RequestItem>;
    responseQueue: Map<number | string, RequestItem>;
    constructor(host: string, polyjuiceConfig: PolyjuiceConfig, option?: WebsocketProviderOptions);
    setAbi(abiItems: AbiItems): void;
    simulateWebsocketResponse(result: JsonRpcResponse, id: string | number): void;
}

class PolyjuiceAccounts extends Accounts {
    godwoker: Godwoker;
    abi: Abi;
    constructor(polyjuiceConfig: PolyjuiceConfig, provider?: provider);
    setAbi(abiItems: AbiItems): void;
    signTransaction(_tx: TransactionConfig, privateKey: string, callback?: (error: Error, signedTransaction?: SignedTransaction) => void): Promise<SignedTransaction>;
}
```

## @polyjuice-provider/truffle

```ts
class PolyjuiceHDWalletProvider extends HDWalletProvider {
    abi: Abi;
    godwoker: Godwoker;
    constructor(args: ConstructorArguments, polyjuiceConfig: PolyjuiceConfig);
}
```

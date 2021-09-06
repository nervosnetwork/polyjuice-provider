import { HexNumber, HexString } from "@ckb-lumos/base";

interface RawL2Transaction {
  from_id: HexNumber;
  to_id: HexNumber;
  nonce: HexNumber;
  args: HexString;
}
interface L2Transaction {
  raw: RawL2Transaction;
  signature: HexString;
}

// eth eoa address vs godwoken short address mapping
export interface AddressMappingItem {
  eth_address: HexString;
  gw_short_address: HexString;
}

export interface AddressMapping {
  length: HexNumber;
  data: AddressMappingItem[];
}

export interface RawL2TransactionWithAddressMapping {
  raw_tx: RawL2Transaction;
  addresses: AddressMapping;
  extra: HexString;
}

export interface L2TransactionWithAddressMapping {
  tx: L2Transaction;
  addresses: AddressMapping;
  extra: HexString;
}

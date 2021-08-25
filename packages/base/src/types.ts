import { HexString } from "@ckb-lumos/base";
import { AbiItem } from "web3-utils";

export type AbiItems = AbiItem[];

export type PolyjuiceConfig = {
  rollupTypeHash?: string;
  ethAccountLockCodeHash?: string;
  abiItems?: AbiItems;
  web3Url?: string;
};

export enum ShortAddressType {
  eoaAddress,
  contractAddress,
  notExistEoaAddress,
  notExistContractAddress, // create2 contract which haven't really created, currently provider can't distinguish this type of address.
}

export interface ShortAddress {
  value: HexString;
  type: ShortAddressType;
}

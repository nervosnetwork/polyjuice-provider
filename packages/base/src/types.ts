import { AbiItem } from "web3-utils";

export type AbiItems = AbiItem[];

export type PolyjuiceConfig = {
  rollupTypeHash?: string;
  ethAccountLockCodeHash?: string;
  abiItems?: AbiItems;
  web3Url?: string;
};

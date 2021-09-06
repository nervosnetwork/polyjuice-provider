// taken from https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-utils/types/index.d.ts#L215-L243

export type AbiType = "function" | "constructor" | "event" | "fallback";
export type StateMutabilityType = "pure" | "view" | "nonpayable" | "payable";

export interface AbiItem {
  anonymous?: boolean;
  constant?: boolean;
  inputs?: AbiInput[];
  name?: string;
  outputs?: AbiOutput[];
  payable?: boolean;
  stateMutability?: StateMutabilityType;
  type: AbiType;
  gas?: number;
}

export interface AbiInput {
  name: string;
  type: string;
  indexed?: boolean;
  components?: AbiInput[];
  internalType?: string;
}

export interface AbiOutput {
  name: string;
  type: string;
  components?: AbiOutput[];
  internalType?: string;
}

export interface CastToArrayBuffer {
  toArrayBuffer(): ArrayBuffer;
}

export type CanCastToArrayBuffer = ArrayBuffer | CastToArrayBuffer;

export interface CreateOptions {
  validate?: boolean;
}

export interface UnionType {
  type: string;
  value: any;
}

export function SerializeUint16(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint16 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  toBigEndianUint16(): number;
  toLittleEndianUint16(): number;
  static size(): Number;
}

export function SerializeUint32(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint32 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  toBigEndianUint32(): number;
  toLittleEndianUint32(): number;
  static size(): Number;
}

export function SerializeUint64(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint64 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  toBigEndianBigUint64(): bigint;
  toLittleEndianBigUint64(): bigint;
  static size(): Number;
}

export function SerializeUint128(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint128 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): Number;
}

export function SerializeByte20(value: CanCastToArrayBuffer): ArrayBuffer;
export class Byte20 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): Number;
}

export function SerializeByte32(value: CanCastToArrayBuffer): ArrayBuffer;
export class Byte32 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): Number;
}

export function SerializeUint256(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint256 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): Number;
}

export function SerializeBytes(value: CanCastToArrayBuffer): ArrayBuffer;
export class Bytes {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  length(): number;
}

export function SerializeBytesOpt(value: CanCastToArrayBuffer | null): ArrayBuffer;
export class BytesOpt {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  value(): Bytes;
  hasValue(): boolean;
}

export function SerializeBytesVec(value: Array<CanCastToArrayBuffer>): ArrayBuffer;
export class BytesVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): Bytes;
  length(): number;
}

export function SerializeByte32Vec(value: Array<CanCastToArrayBuffer>): ArrayBuffer;
export class Byte32Vec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): Byte32;
  length(): number;
}

export function SerializeRawL2Transaction(value: object): ArrayBuffer;
export class RawL2Transaction {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getFromId(): Uint32;
  getToId(): Uint32;
  getNonce(): Uint32;
  getArgs(): Bytes;
}

export function SerializeL2Transaction(value: object): ArrayBuffer;
export class L2Transaction {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getRaw(): RawL2Transaction;
  getSignature(): Bytes;
}

export function SerializeAddressMappingItem(value: object): ArrayBuffer;
export class AddressMappingItem {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getEthAddress(): Byte20;
  getGwShortAddress(): Byte20;
}

export function SerializeAddressMappingItemVec(value: Array<object>): ArrayBuffer;
export class AddressMappingItemVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): AddressMappingItem;
  length(): number;
}

export function SerializeAddressMapping(value: object): ArrayBuffer;
export class AddressMapping {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getLength(): Uint32;
  getData(): AddressMappingItemVec;
}

export function SerializeRawL2TransactionWithAddressMapping(value: object): ArrayBuffer;
export class RawL2TransactionWithAddressMapping {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getRawTx(): RawL2Transaction;
  getAddresses(): AddressMapping;
  getExtra(): Bytes;
}

export function SerializeL2TransactionWithAddressMapping(value: object): ArrayBuffer;
export class L2TransactionWithAddressMapping {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getTx(): L2Transaction;
  getAddresses(): AddressMapping;
  getExtra(): Bytes;
}


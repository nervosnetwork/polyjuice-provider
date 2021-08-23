(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.AddressCore = {}));
}(this, (function (exports) { 'use strict';

  function dataLengthError(actual, required) {
      throw new Error(`Invalid data length! Required: ${required}, actual: ${actual}`);
  }

  function assertDataLength(actual, required) {
    if (actual !== required) {
      dataLengthError(actual, required);
    }
  }

  function assertArrayBuffer(reader) {
    if (reader instanceof Object && reader.toArrayBuffer instanceof Function) {
      reader = reader.toArrayBuffer();
    }
    if (!(reader instanceof ArrayBuffer)) {
      throw new Error("Provided value must be an ArrayBuffer or can be transformed into ArrayBuffer!");
    }
    return reader;
  }

  function verifyAndExtractOffsets(view, expectedFieldCount, compatible) {
    if (view.byteLength < 4) {
      dataLengthError(view.byteLength, ">4");
    }
    const requiredByteLength = view.getUint32(0, true);
    assertDataLength(view.byteLength, requiredByteLength);
    if (requiredByteLength === 4) {
      return [requiredByteLength];
    }
    if (requiredByteLength < 8) {
      dataLengthError(view.byteLength, ">8");
    }
    const firstOffset = view.getUint32(4, true);
    if (firstOffset % 4 !== 0 || firstOffset < 8) {
      throw new Error(`Invalid first offset: ${firstOffset}`);
    }
    const itemCount = firstOffset / 4 - 1;
    if (itemCount < expectedFieldCount) {
      throw new Error(`Item count not enough! Required: ${expectedFieldCount}, actual: ${itemCount}`);
    } else if ((!compatible) && itemCount > expectedFieldCount) {
      throw new Error(`Item count is more than required! Required: ${expectedFieldCount}, actual: ${itemCount}`);
    }
    if (requiredByteLength < firstOffset) {
      throw new Error(`First offset is larger than byte length: ${firstOffset}`);
    }
    const offsets = [];
    for (let i = 0; i < itemCount; i++) {
      const start = 4 + i * 4;
      offsets.push(view.getUint32(start, true));
    }
    offsets.push(requiredByteLength);
    for (let i = 0; i < offsets.length - 1; i++) {
      if (offsets[i] > offsets[i + 1]) {
        throw new Error(`Offset index ${i}: ${offsets[i]} is larger than offset index ${i + 1}: ${offsets[i + 1]}`);
      }
    }
    return offsets;
  }

  function serializeTable(buffers) {
    const itemCount = buffers.length;
    let totalSize = 4 * (itemCount + 1);
    const offsets = [];

    for (let i = 0; i < itemCount; i++) {
      offsets.push(totalSize);
      totalSize += buffers[i].byteLength;
    }

    const buffer = new ArrayBuffer(totalSize);
    const array = new Uint8Array(buffer);
    const view = new DataView(buffer);

    view.setUint32(0, totalSize, true);
    for (let i = 0; i < itemCount; i++) {
      view.setUint32(4 + i * 4, offsets[i], true);
      array.set(new Uint8Array(buffers[i]), offsets[i]);
    }
    return buffer;
  }

  class Uint16 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 2);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    toBigEndianUint16() {
      return this.view.getUint16(0, false);
    }

    toLittleEndianUint16() {
      return this.view.getUint16(0, true);
    }

    static size() {
      return 2;
    }
  }

  function SerializeUint16(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 2);
    return buffer;
  }

  class Uint32 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 4);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    toBigEndianUint32() {
      return this.view.getUint32(0, false);
    }

    toLittleEndianUint32() {
      return this.view.getUint32(0, true);
    }

    static size() {
      return 4;
    }
  }

  function SerializeUint32(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 4);
    return buffer;
  }

  class Uint64 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 8);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    toBigEndianBigUint64() {
      return this.view.getBigUint64(0, false);
    }

    toLittleEndianBigUint64() {
      return this.view.getBigUint64(0, true);
    }

    static size() {
      return 8;
    }
  }

  function SerializeUint64(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 8);
    return buffer;
  }

  class Uint128 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 16);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 16;
    }
  }

  function SerializeUint128(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 16);
    return buffer;
  }

  class Byte20 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 20);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 20;
    }
  }

  function SerializeByte20(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 20);
    return buffer;
  }

  class Byte32 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 32);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 32;
    }
  }

  function SerializeByte32(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 32);
    return buffer;
  }

  class Uint256 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 32);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 32;
    }
  }

  function SerializeUint256(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 32);
    return buffer;
  }

  class Bytes {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
    }

    raw() {
      return this.view.buffer.slice(4);
    }

    indexAt(i) {
      return this.view.getUint8(4 + i);
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeBytes(value) {
    const item = assertArrayBuffer(value);
    const array = new Uint8Array(4 + item.byteLength);
    (new DataView(array.buffer)).setUint32(0, item.byteLength, true);
    array.set(new Uint8Array(item), 4);
    return array.buffer;
  }

  class BytesOpt {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.hasValue()) {
        this.value().validate(compatible);
      }
    }

    value() {
      return new Bytes(this.view.buffer, { validate: false });
    }

    hasValue() {
      return this.view.byteLength > 0;
    }
  }

  function SerializeBytesOpt(value) {
    if (value) {
      return SerializeBytes(value);
    } else {
      return new ArrayBuffer(0);
    }
  }

  class BytesVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      for (let i = 0; i < offsets.length - 1; i++) {
        new Bytes(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
      }
    }

    length() {
      if (this.view.byteLength < 8) {
        return 0;
      } else {
        return this.view.getUint32(4, true) / 4 - 1;
      }
    }

    indexAt(i) {
      const start = 4 + i * 4;
      const offset = this.view.getUint32(start, true);
      let offset_end = this.view.byteLength;
      if (i + 1 < this.length()) {
        offset_end = this.view.getUint32(start + 4, true);
      }
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeBytesVec(value) {
    return serializeTable(value.map(item => SerializeBytes(item)));
  }

  class Byte32Vec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() * Byte32.size() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
      for (let i = 0; i < 0; i++) {
        const item = this.indexAt(i);
        item.validate(compatible);
      }
    }

    indexAt(i) {
      return new Byte32(this.view.buffer.slice(4 + i * Byte32.size(), 4 + (i + 1) * Byte32.size()), { validate: false });
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeByte32Vec(value) {
    const array = new Uint8Array(4 + Byte32.size() * value.length);
    (new DataView(array.buffer)).setUint32(0, value.length, true);
    for (let i = 0; i < value.length; i++) {
      const itemBuffer = SerializeByte32(value[i]);
      array.set(new Uint8Array(itemBuffer), 4 + i * Byte32.size());
    }
    return array.buffer;
  }

  class RawL2Transaction {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Uint32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new Uint32(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new Uint32(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
      new Bytes(this.view.buffer.slice(offsets[3], offsets[4]), { validate: false }).validate();
    }

    getFromId() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getToId() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getNonce() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getArgs() {
      const start = 16;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeRawL2Transaction(value) {
    const buffers = [];
    buffers.push(SerializeUint32(value.from_id));
    buffers.push(SerializeUint32(value.to_id));
    buffers.push(SerializeUint32(value.nonce));
    buffers.push(SerializeBytes(value.args));
    return serializeTable(buffers);
  }

  class L2Transaction {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new RawL2Transaction(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new Bytes(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    }

    getRaw() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new RawL2Transaction(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getSignature() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeL2Transaction(value) {
    const buffers = [];
    buffers.push(SerializeRawL2Transaction(value.raw));
    buffers.push(SerializeBytes(value.signature));
    return serializeTable(buffers);
  }

  class AddressMappingItem {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Byte20(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new Byte20(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    }

    getEthAddress() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Byte20(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getGwShortAddress() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Byte20(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeAddressMappingItem(value) {
    const buffers = [];
    buffers.push(SerializeByte20(value.eth_address));
    buffers.push(SerializeByte20(value.gw_short_address));
    return serializeTable(buffers);
  }

  class AddressMappingItemVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      for (let i = 0; i < offsets.length - 1; i++) {
        new AddressMappingItem(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
      }
    }

    length() {
      if (this.view.byteLength < 8) {
        return 0;
      } else {
        return this.view.getUint32(4, true) / 4 - 1;
      }
    }

    indexAt(i) {
      const start = 4 + i * 4;
      const offset = this.view.getUint32(start, true);
      let offset_end = this.view.byteLength;
      if (i + 1 < this.length()) {
        offset_end = this.view.getUint32(start + 4, true);
      }
      return new AddressMappingItem(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeAddressMappingItemVec(value) {
    return serializeTable(value.map(item => SerializeAddressMappingItem(item)));
  }

  class AddressMapping {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Uint32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new AddressMappingItemVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    }

    getLength() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getData() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new AddressMappingItemVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeAddressMapping(value) {
    const buffers = [];
    buffers.push(SerializeUint32(value.length));
    buffers.push(SerializeAddressMappingItemVec(value.data));
    return serializeTable(buffers);
  }

  class RawL2TransactionWithAddressMapping {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new RawL2Transaction(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new AddressMapping(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new Bytes(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    }

    getRawTx() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new RawL2Transaction(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getAddresses() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new AddressMapping(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getExtra() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeRawL2TransactionWithAddressMapping(value) {
    const buffers = [];
    buffers.push(SerializeRawL2Transaction(value.raw_tx));
    buffers.push(SerializeAddressMapping(value.addresses));
    buffers.push(SerializeBytes(value.extra));
    return serializeTable(buffers);
  }

  class L2TransactionWithAddressMapping {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new L2Transaction(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new AddressMapping(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new Bytes(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    }

    getTx() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new L2Transaction(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getAddresses() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new AddressMapping(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getExtra() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeL2TransactionWithAddressMapping(value) {
    const buffers = [];
    buffers.push(SerializeL2Transaction(value.tx));
    buffers.push(SerializeAddressMapping(value.addresses));
    buffers.push(SerializeBytes(value.extra));
    return serializeTable(buffers);
  }

  exports.AddressMapping = AddressMapping;
  exports.AddressMappingItem = AddressMappingItem;
  exports.AddressMappingItemVec = AddressMappingItemVec;
  exports.Byte20 = Byte20;
  exports.Byte32 = Byte32;
  exports.Byte32Vec = Byte32Vec;
  exports.Bytes = Bytes;
  exports.BytesOpt = BytesOpt;
  exports.BytesVec = BytesVec;
  exports.L2Transaction = L2Transaction;
  exports.L2TransactionWithAddressMapping = L2TransactionWithAddressMapping;
  exports.RawL2Transaction = RawL2Transaction;
  exports.RawL2TransactionWithAddressMapping = RawL2TransactionWithAddressMapping;
  exports.SerializeAddressMapping = SerializeAddressMapping;
  exports.SerializeAddressMappingItem = SerializeAddressMappingItem;
  exports.SerializeAddressMappingItemVec = SerializeAddressMappingItemVec;
  exports.SerializeByte20 = SerializeByte20;
  exports.SerializeByte32 = SerializeByte32;
  exports.SerializeByte32Vec = SerializeByte32Vec;
  exports.SerializeBytes = SerializeBytes;
  exports.SerializeBytesOpt = SerializeBytesOpt;
  exports.SerializeBytesVec = SerializeBytesVec;
  exports.SerializeL2Transaction = SerializeL2Transaction;
  exports.SerializeL2TransactionWithAddressMapping = SerializeL2TransactionWithAddressMapping;
  exports.SerializeRawL2Transaction = SerializeRawL2Transaction;
  exports.SerializeRawL2TransactionWithAddressMapping = SerializeRawL2TransactionWithAddressMapping;
  exports.SerializeUint128 = SerializeUint128;
  exports.SerializeUint16 = SerializeUint16;
  exports.SerializeUint256 = SerializeUint256;
  exports.SerializeUint32 = SerializeUint32;
  exports.SerializeUint64 = SerializeUint64;
  exports.Uint128 = Uint128;
  exports.Uint16 = Uint16;
  exports.Uint256 = Uint256;
  exports.Uint32 = Uint32;
  exports.Uint64 = Uint64;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

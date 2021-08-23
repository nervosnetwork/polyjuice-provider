import test from "ava";
import {
  L2TransactionWithAddressMapping,
  RawL2TransactionWithAddressMapping,
} from "../../godwoken/src/addressTypes";
import {
  serializeRawL2TransactionWithAddressMapping,
  serializeL2TransactionWithAddressMapping,
  deserializeRawL2TransactionWithAddressMapping,
  deserializeL2TransactionWithAddressMapping,
} from "../lib/index";

test.serial("serialize raw-l2-tx-with-address-mapping", (t) => {
  const data: RawL2TransactionWithAddressMapping = {
    raw_tx: {
      from_id: "0x4",
      to_id: "0x1",
      nonce: "0x2",
      args: "0x1024",
    },
    addresses: {
      length: "0x1",
      data: [
        {
          eth_address: "0xfb2c72d3ffe10ef7c9960272859a23d24db9e04a",
          gw_short_address: "0x24f1de0c7084a2fb17a205282a8cd046e9fff047",
        },
      ],
    },
    extra: "0x11",
  };
  const serializeData = serializeRawL2TransactionWithAddressMapping(data);
  const deserializeData =
    deserializeRawL2TransactionWithAddressMapping(serializeData);
  t.deepEqual(deserializeData, data);
});

test.serial("serialize l2-tx-with-address-mapping", (t) => {
  const data: L2TransactionWithAddressMapping = {
    tx: {
      raw: {
        from_id: "0x4",
        to_id: "0x1",
        nonce: "0x2",
        args: "0x1024",
      },
      signature:
        "0xfea265627a7a7231582001528e3c7dc7db53b0fea265627a7a7231582001528efea265627a7a7231582001528e3c7dc7db53b0fea265627a7a7231582001528e88",
    },
    addresses: {
      length: "0x1",
      data: [
        {
          eth_address: "0xfb2c72d3ffe10ef7c9960272859a23d24db9e04a",
          gw_short_address: "0x24f1de0c7084a2fb17a205282a8cd046e9fff047",
        },
      ],
    },
    extra: "0x11",
  };
  const serializeData = serializeL2TransactionWithAddressMapping(data);
  const deserializeData =
    deserializeL2TransactionWithAddressMapping(serializeData);
  t.deepEqual(deserializeData, data);
});

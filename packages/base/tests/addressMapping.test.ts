import test from "ava";
import { RawL2TransactionWithAddressMapping } from "../../godwoken/src/addressTypes";
import {
  serializeRawL2TransactionWithAddressMapping,
  deserializeRawL2TransactionWithAddressMapping
} from "../lib/index";

test.serial("typescript-import-from-index", (t) => {
  const data: RawL2TransactionWithAddressMapping = {
	  raw_tx: {
		from_id: '0x4',
		to_id: '0x1',
		nonce: '0x2',
		args: '0x1024'
	  },
	  addresses: { 
		  length: '0x1',
		  data: [{
			eth_address: '0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A'.toLowerCase(),
			gw_short_address: '0xb2C72d3ffe10Ef7c9960272859a23D24db9e04AF'.toLowerCase(),
		  }]
	},
	extra: '0x11',
  }
  const serializeData = serializeRawL2TransactionWithAddressMapping(data);
  const deserializeData = deserializeRawL2TransactionWithAddressMapping(serializeData);
  t.deepEqual(deserializeData, data);
});

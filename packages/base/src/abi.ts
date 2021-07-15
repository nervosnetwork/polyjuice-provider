import { AbiOutput, AbiInput, AbiItem } from "web3-utils";
const Web3EthAbi = require("web3-eth-abi");

export type AbiItems = AbiItem[];

export interface MethodIDs {
  [method_id: string]: AbiItem;
}

export interface DecodedMethodParam extends AbiInput {
  value: string | string[];
}

export interface DecodedMethod {
  name: string;
  params: DecodedMethodParam[];
}

export const DEFAULT_ETH_ADDRESS = `0x${"0".repeat(40)}`;

export class Abi {
  private abi_items: AbiItem[] = [];
  private interested_methods: AbiItem[] = [];
  private interested_method_ids: MethodIDs = {};

  constructor(_abi_items: AbiItem[]) {
    this.abi_items = _abi_items;
    this.interested_methods = this.filter_interested_methods(this.abi_items);
    this.interested_method_ids = this.get_method_ids(this.interested_methods);
  }

  get_method_ids(_abi_items: AbiItem[]) {
    const method_ids: MethodIDs = {};
    for (let item of _abi_items) {
      const id = Web3EthAbi.encodeFunctionSignature(item).slice(2);
      method_ids[id] = item;
    }
    return method_ids;
  }

  filter_interested_methods(_abi_items: AbiItem[]): AbiItem[] {
    return _abi_items.filter(
      (item) =>
        item.type === "function" &&
        (this.filter_interested_inputs(item).length > 0 || // at least one param is eth-address
          this.filter_interested_outputs(item).length > 0) // at least one output return type is eth-address
    );
  }

  filter_interested_inputs(_abiItem: AbiItem): AbiInput[] {
    return _abiItem.inputs.filter(
      (input) => input.type === "address" || input.type === "address[]"
    );
  }

  filter_interested_outputs(_abiItem: AbiItem): AbiOutput[] {
    return _abiItem.outputs.filter(
      (output) => output.type === "address" || output.type === "address[]"
    );
  }

  get_interested_methods() {
    return this.interested_methods;
  }

  get_abi_items() {
    return this.abi_items;
  }

  decode_method(data: string) {
    const method_id = data.slice(2, 10);
    const abiItem = this.interested_method_ids[method_id];
    if (abiItem) {
      let decoded = Web3EthAbi.decodeParameters(
        abiItem.inputs,
        "0x" + data.slice(10)
      );
      let retData: DecodedMethod = {
        name: abiItem.name,
        params: [],
      };

      for (let i = 0; i < decoded.__length__; i++) {
        let param = decoded[i];
        let parsedParam = param;
        const isUint = abiItem.inputs[i].type.indexOf("uint") === 0;
        const isInt = abiItem.inputs[i].type.indexOf("int") === 0;
        const isAddress = abiItem.inputs[i].type.indexOf("address") === 0;

        if (isUint || isInt) {
          const isArray = Array.isArray(param);

          if (isArray) {
            parsedParam = param.map((val) => BigInt(val).toString());
          } else {
            parsedParam = BigInt(param).toString();
          }
        }

        // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
        if (isAddress) {
          const isArray = Array.isArray(param);

          if (isArray) {
            parsedParam = param.map((_) => _.toLowerCase());
          } else {
            parsedParam = param.toLowerCase();
          }
        }

        retData.params.push({
          name: abiItem.inputs[i].name,
          value: parsedParam,
          type: abiItem.inputs[i].type,
        });
      }

      return retData;
    }
  }

  // todo: use this func to remove all repeated code.
  // params: <data: eth tx's encode input data>
  get_intereted_abi_item_by_encoded_data(data: string) {
    const method_id = data.slice(2, 10);
    const abi_item = this.interested_method_ids[method_id];
    return abi_item;
  }

  // decode method data, if it is related with address type in inputs,
  // replace the address params with godwoken_short_address
  async refactor_data_with_short_address(
    data: string,
    calculate_short_address: (addr: string) => Promise<string>
  ) {
    const method_id = data.slice(2, 10);
    const abi_item = this.interested_method_ids[method_id];
    if (!abi_item) return data;

    const decode_data = this.decode_method(data);
    const new_decode_data = decode_data.params.map(async (p) => {
      if (p.type === "address" || p.type === "address[]") {
        if (p.value === DEFAULT_ETH_ADDRESS) {
          // special case: 0x0000...
          // todo: right now we keep the 0x00000.., later maybe should convert to polyjuice creator short address?
          return p;
        }

        p.value = Array.isArray(p.value)
          ? await Promise.all(
              p.value.map(async (v) => await calculate_short_address(v))
            )
          : await calculate_short_address(p.value);
        return p;
      } else {
        return p;
      }
    });
    const new_data = Web3EthAbi.encodeFunctionCall(
      abi_item,
      await Promise.all(new_decode_data.map(async (p) => (await p).value))
    );
    return new_data;
  }

  // decode the run_result return value, and check:
  // 	if it is related with address type, replace godwoken_short_address with eth_address.
  //
  // known-issue:
  // 	- when the return value is EOA address and when it haven't create account on godowken,
  //	  we query from web3 address mapping store layer to get the origin EOA address.
  //	  however, we do not support return address type with create2 contract address which not exist yet.
  async refactor_return_value_with_short_address(
    return_value: string,
    abi_item: AbiItem,
    calculate_short_address: (addr: string) => Promise<string>
  ) {
    const output_value_types = abi_item.outputs.map((item) => item.type);
    let decoded_values: object = Web3EthAbi.decodeParameters(
      output_value_types,
      return_value
    );
    const interested_value_indexs: number[] = output_value_types.reduce(
      (result, t, index) => {
        if (t === "address" || t === "address[]") {
          result.push(index);
        }

        return result;
      },
      []
    );
    for await (const index of interested_value_indexs) {
      if (decoded_values[index] === DEFAULT_ETH_ADDRESS) {
        // special case: 0x0000.. normally when calling an parameter which is un-init.
        continue;
      }

      decoded_values[index] = Array.isArray(decoded_values[index])
        ? await Promise.all(
            decoded_values[index].map(
              async (v) => await calculate_short_address(v)
            )
          )
        : await calculate_short_address(decoded_values[index]);
    }
    let decode_values_with_refactor = Object.values(decoded_values);
    decode_values_with_refactor = decode_values_with_refactor.slice(
      0,
      decode_values_with_refactor.length - 1
    );
    return Web3EthAbi.encodeParameters(
      output_value_types,
      decode_values_with_refactor
    );
  }

  // todo: support user providing an url path, and read the abi json from it
  read_abi_from_json_file() {}
}

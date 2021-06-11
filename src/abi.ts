import { toWei, AbiInput, AbiItem } from "web3-utils";
const Web3EthAbi = require("web3-eth-abi");

export interface MethodIDs {
  [method_id: string]: AbiItem;
}

export interface DecodedMethodParam extends AbiInput {
  value: string | string [];
}

export interface DecodedMethod {
  name: string;
  params: DecodedMethodParam[];
}

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
        this.filter_interested_inputs(item).length > 0 // at least one param is eth-address
    );
  }

  filter_interested_inputs(_abiItem: AbiItem): AbiInput[] {
    return _abiItem.inputs.filter((input) => input.type === "address" || input.type === "address[]");
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
      let decoded = Web3EthAbi.decodeParameters(abiItem.inputs, '0x'+data.slice(10));
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
        p.value = Array.isArray(p.value) ? await Promise.all(p.value.map(async v => await calculate_short_address(v))) : await calculate_short_address(p.value);
        return p;
      } else {
        return p;
      }
    });
    const new_data = Web3EthAbi.encodeFunctionCall(abi_item, await Promise.all(new_decode_data.map( async p => (await p).value)));
    return new_data;
  }

  // todo: support user providing an url path, and read the abi json from it
  read_abi_from_json_file() {}
}

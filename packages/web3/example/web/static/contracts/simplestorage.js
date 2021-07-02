const SimpleContract = {
  contractName: "SimpleStorageV2",
  abi: [
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "newValue",
          type: "address",
        },
      ],
      name: "set",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "get",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address[]",
          name: "newValue",
          type: "address[]",
        },
      ],
      name: "setArray",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "getArray",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ],
};

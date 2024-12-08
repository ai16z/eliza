export const ABI = [
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                name: "",
                type: "string",
                internalType: "string"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                name: "spender",
                type: "address",
                internalType: "address"
            },
            {
                name: "amount",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        name: "approve",
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                name: "from",
                type: "address",
                internalType: "address"
            },
            {
                name: "to",
                type: "address",
                internalType: "address"
            },
            {
                name: "amount",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        name: "transferFrom",
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [
            {
                name: "",
                type: "uint8",
                internalType: "uint8"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            }
        ],
        name: "balanceOf",
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                name: "",
                type: "string",
                internalType: "string"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                name: "to",
                type: "address",
                internalType: "address"
            },
            {
                name: "amount",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        name: "transfer",
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                name: "owner",
                type: "address",
                internalType: "address"
            },
            {
                name: "spender",
                type: "address",
                internalType: "address"
            }
        ],
        name: "allowance",
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                indexed: true,
                name: "owner",
                type: "address",
                internalType: "address"
            },
            {
                indexed: true,
                name: "spender",
                type: "address",
                internalType: "address"
            },
            {
                indexed: false,
                name: "value",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        name: "Approval",
        type: "event",
        anonymous: false
    },
    {
        inputs: [
            {
                indexed: true,
                name: "from",
                type: "address",
                internalType: "address"
            },
            {
                indexed: true,
                name: "to",
                type: "address",
                internalType: "address"
            },
            {
                indexed: false,
                name: "value",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        name: "Transfer",
        type: "event",
        anonymous: false
    }
];
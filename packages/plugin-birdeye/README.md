# Eliza Birdeye Plugin

A powerful plugin for Eliza that integrates with Birdeye's comprehensive DeFi and token analytics API. This plugin provides real-time access to blockchain data, token metrics, and DeFi analytics across multiple networks.

## Features

### Provider Featurs

- **Wallet Portfolio Provider**

    - If `BIRDEYE_WALLET_ADDR` is set, this provider will fetch the wallet's portfolio data from Birdeye and be able to respond to questions

- **Wallet Search Provider**

    - If the user mentions a wallet address, this provider will search for the address in Birdeye and be able to provide information about the wallet. This includes support for multiple addresses in the same message.

- **Symbol Search Provider**

    - If the user mentions a token symbol such as $SOL, $ETH or any random token symbol, this provider will search for the symbol in Birdeye and be able to provide information about the token. This includes support for multiple symbols in the same message.
        - i.e. "Tell me about $SOL and $PEPE"

- **Address Search Provider**

    - If the user mentions a token address, this provider will search for the address in Birdeye and be able to provide information about the token. This includes support for multiple addresses in the same message.
        - i.e. "Tell me about 0x1234567890 and 0x9876543210"

### Action Features

- **Report Token**

    - This action will report on the current details of the wallet specified in the `BIRDEYE_WALLET_ADDR` setting.

## API Reference

The plugin provides access to a subset of Birdeye API endpoints through structured interfaces. For detailed API documentation, visit [Birdeye's API Documentation](https://public-api.birdeye.so).

## License

See parent project for license information.

## Contributing

Contributions are welcome! See parent project for contribution guidelines.

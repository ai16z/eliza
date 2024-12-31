# Plugin TON

A plugin for handling TON (Telegram Open Network) blockchain operations, such as wallet management and transfers.

## Overview and Purpose

The Plugin TON provides a streamlined interface to interact with the TON blockchain. It simplifies wallet management and facilitates secure, efficient transfers while maintaining compatibility with TypeScript and modern JavaScript development practices.

## Installation

Install the plugin using npm:

```bash
npm install plugin-ton
```

## Configuration Requirements

Ensure your environment is set up with the necessary configuration files and environment variables. Update the `src/enviroment.ts` file or set environment variables directly for sensitive information.

### Environment Variables

| Variable Name            | Description                           |
| ------------------------ | ------------------------------------- |
| `TON_API_ENDPOINT`       | API endpoint for interacting with TON |
| `TON_WALLET_PRIVATE_KEY` | Private key for wallet operations     |

## Usage Examples

### Importing the Plugin

```typescript
import { WalletProvider, TransferAction } from 'plugin-ton';

// Initialize wallet provider
const wallet = new WalletProvider('YOUR_PRIVATE_KEY');

// Fetch wallet balance
const balance = await wallet.getBalance();
console.log('Wallet Balance:', balance);

// Transfer TON coins
const transfer = new TransferAction(wallet);
await transfer.execute({
  to: 'RECIPIENT_ADDRESS',
  amount: 10,
});
console.log('Transfer successful');
```

## API Reference

### WalletProvider

#### Methods:

- `constructor(privateKey: string)` - Initializes the wallet with a private key.
- `getBalance(): Promise<number>` - Retrieves the wallet balance.

### TransferAction

#### Methods:

- `constructor(wallet: WalletProvider)` - Initializes the transfer action.
- `execute({ to: string, amount: number }): Promise<void>` - Executes a transfer of TON coins.

## Common Issues/Troubleshooting

### Issue: Balance Fetching Failure

- **Cause**: Incorrect API endpoint or private key.
- **Solution**: Verify `TON_API_ENDPOINT` and private key in your configuration.

### Issue: Transfer Fails

- **Cause**: Insufficient balance or invalid recipient address.
- **Solution**: Ensure sufficient funds and a valid recipient address.

## Additional Documentation

### Examples Folder Documentation

The examples folder includes sample scripts demonstrating wallet initialization, balance checking, and transfers. Use these as a starting point for your integration.

### Testing Guide Expansion

Run tests using the following command:

```bash
npm test
```

The `src/tests/wallet.test.ts` file provides unit tests for wallet functionality. Add tests for additional features as needed.

### Plugin Development Guide

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Use `tsup` for building the project: `npm run build`.
4. Add new features in the `src` directory.

### Security Best Practices

- **Key Management**: Use environment variables for sensitive information like private keys.
- **Testing**: Validate all inputs to prevent injection attacks.
- **Dependencies**: Regularly update dependencies to patch vulnerabilities.

### Performance Optimization Guide

- Use efficient data structures for large transactions.
- Avoid unnecessary API calls by caching frequent responses.
- Use async/await for optimal asynchronous operations.

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

MIT

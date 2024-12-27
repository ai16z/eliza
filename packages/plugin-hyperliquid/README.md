<p align="center">
  <img src="assets/hyperliquid.png" alt="Hyperliquid Logo" width="600"/>
</p>

# Eliza Hyperliquid Plugin

A plugin for the Eliza framework that enables interaction with the Hyperliquid perpetual DEX. This plugin provides a comprehensive interface for trading, market data access, and WebSocket integrations.

## Important Note

⚠️ The testnet environment for Hyperliquid is currently not available. All tests and validations have been performed using the mainnet API with real credentials. Please ensure you use appropriate wallet addresses and manage your keys securely.

## Features

- 🔄 Real-time WebSocket Integration
  - Live orderbook updates
  - Connection management with auto-reconnect
  - Subscription handling
- 📊 Market Data Access
  - L2 orderbook data
  - Meta information
  - Price feeds
- 💹 Trading Operations
  - Place and cancel orders
  - Manage positions
  - Track fills
- 🔐 Secure Authentication
  - Wallet-based authentication
  - Message signing
  - Private key management
- 🛡️ Error Handling
  - Comprehensive error types
  - Detailed error messages
  - Automatic retry mechanisms

## Installation

```bash
pnpm add @elizaos/plugin-hyperliquid
```

## Environment Setup

Create a `.env` file in your project root with the following required variables:

```bash
# Required
HYPERLIQUID_PRIVATE_KEY=your_private_key_here
HYPERLIQUID_WALLET_ADDRESS=your_wallet_address_here

# Optional (defaults shown)
HYPERLIQUID_NETWORK=mainnet
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz/ws
```

## Available Actions

### WebSocket Actions

#### 1. Subscribe to Orderbook
```typescript
// Watch orderbook updates for a specific coin
{
  name: 'subscribeOrderbook',
  options: {
    coin: 'HYPE' // The coin to subscribe to
  }
}
```

#### 2. Unsubscribe from Orderbook
```typescript
// Stop watching orderbook updates
{
  name: 'unsubscribeOrderbook',
  options: {
    coin: 'HYPE'
  }
}
```

#### 3. Reconnect WebSocket
```typescript
// Reconnect the WebSocket connection
{
  name: 'reconnectWebSocket'
}
```

#### 4. Close WebSocket
```typescript
// Close the WebSocket connection
{
  name: 'closeWebSocket'
}
```

### Exchange Actions

#### 1. Place Order
```typescript
// Place a new order
{
  name: 'placeOrder',
  options: {
    request: {
      coin: 'HYPE',
      is_buy: true,
      sz: 100,
      limit_px: 0.5,
      reduce_only: false,
      order_type: {
        limit: {
          tif: 'Gtc'
        }
      }
    }
  }
}
```

#### 2. Cancel Order
```typescript
// Cancel an existing order
{
  name: 'cancelOrder',
  options: {
    request: {
      coin: 'HYPE',
      oid: '12345'
    }
  }
}
```

#### 3. Modify Order
```typescript
// Modify an existing order
{
  name: 'modifyOrder',
  options: {
    request: {
      coin: 'HYPE',
      oid: '12345',
      is_buy: true,
      sz: 100,
      limit_px: 0.6,
      reduce_only: false,
      order_type: {
        limit: {
          tif: 'Gtc'
        }
      }
    }
  }
}
```

#### 4. Get Order Status
```typescript
// Get status of a specific order
{
  name: 'getOrderStatus',
  options: {
    request: {
      coin: 'HYPE',
      oid: '12345'
    }
  }
}
```

### Information Actions

#### 1. Get Meta Information
```typescript
// Retrieve market metadata
{
  name: 'getMeta'
}
```

#### 2. Get Meta and Asset Contexts
```typescript
// Get detailed market contexts
{
  name: 'getMetaAndAssetCtxs'
}
```

#### 3. Get All Mids
```typescript
// Get current mid prices
{
  name: 'getAllMids'
}
```

#### 4. Get Clearing House State
```typescript
// Get user's clearing house state
{
  name: 'getClearingHouseState',
  options: {
    address: 'your_wallet_address'
  }
}
```

#### 5. Get Open Orders
```typescript
// Get user's open orders
{
  name: 'getOpenOrders',
  options: {
    address: 'your_wallet_address'
  }
}
```

#### 6. Get User Fills
```typescript
// Get user's trading fills
{
  name: 'getUserFills',
  options: {
    address: 'your_wallet_address'
  }
}
```

#### 7. Get User Fills By Time
```typescript
// Get user's trading fills within a time range
{
  name: 'getUserFillsByTime',
  options: {
    address: 'your_wallet_address',
    startTime: 1640995200000 // Unix timestamp in milliseconds
  }
}
```

## Usage Examples

### WebSocket Integration
```typescript
// Subscribe to HYPE orderbook
await agent.act('subscribeOrderbook', { coin: 'HYPE' });

// Handle incoming messages
agent.on('message', (message) => {
  console.log('Received update:', message);
});

// Unsubscribe when done
await agent.act('unsubscribeOrderbook', { coin: 'HYPE' });
```

### Trading Operations
```typescript
// Place a limit buy order
await agent.act('placeOrder', {
  coin: 'HYPE',
  is_buy: true,
  sz: 100,
  limit_px: 0.5,
  reduce_only: false,
  order_type: { limit: { tif: 'Gtc' } }
});

// Cancel an order
await agent.act('cancelOrder', {
  coin: 'HYPE',
  order_id: '12345'
});
```

### Market Data
```typescript
// Get market information
const meta = await agent.act('getMeta');

// Get current prices
const mids = await agent.act('getAllMids');
```

## Error Handling

The plugin provides detailed error messages and proper error handling:

```typescript
try {
  await agent.act('placeOrder', orderParams);
} catch (error) {
  if (error.message.includes('insufficient balance')) {
    console.error('Not enough funds to place order');
  }
}
```

## Testing

All tests are run against the mainnet API. To run the tests:

1. Set up your environment variables:
```bash
HYPERLIQUID_PRIVATE_KEY=your_private_key
HYPERLIQUID_WALLET_ADDRESS=your_wallet_address
```

2. Run the tests:
```bash
pnpm test
```

The test suite includes:
- HTTP Transport Tests
- WebSocket Transport Tests
- WebSocket Actions Tests
- Exchange Transport Tests

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
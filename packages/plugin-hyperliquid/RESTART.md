# Exchange Transport Test Fix - Restart Guide

## Project Context
- Working on fixing `exchange.transport.test.ts` in the Hyperliquid plugin
- Base path: `/Users/ilessio/dev-agents/Eliza-Projects/eliza_aiflow/packages/plugin-hyperliquid`
- Using real API data from environment variables (no mocking needed)

## Current State
- Issue: Price calculation in order placement is failing (getting NaN)
- Working on replicating working code from `order.management.test.ts`
- Need to handle `/exchange` endpoint properly for signed transactions

## Key Files
1. Main test file to fix:
   ```
   /test/integration/exchange.transport.test.ts
   ```

2. Reference files (working examples):
   ```
   /test/order.management.test.ts
   /test/spot.test.ts
   /test/order.flow.test.ts
   ```

3. Implementation files (not to be modified):
   ```
   /src/exchange.transport.ts
   /src/exchange.actions.ts
   ```

## Environment Setup
Required in `.env`:
```
HYPERLIQUID_PRIVATE_KEY=your_private_key
HYPERLIQUID_WALLET_ADDRESS=your_wallet_address
HYPERLIQUID_BASE_URL=https://api.hyperliquid.xyz
HYPERLIQUID_NETWORK=mainnet
```

## Current Progress
1. ✅ Added proper runtime mock with all IAgentRuntime properties
2. ✅ Added logging for debugging
3. ✅ Updated order request format to match working examples
4. ❌ Need to fix price calculation issue
5. ❌ Need to verify order placement works
6. ❌ Need to verify order cancellation works

## Order Request Format (from working examples)
```typescript
const orderRequest = {
    request: {
        coin: 'PURR',
        side: 'B',  // 'B' for buy, 'S' for sell
        sz: '1',
        limitPx: price.toFixed(8),
        reduceOnly: false,
        orderType: {
            limit: {
                tif: 'Gtc'
            }
        }
    }
};
```

## Cancel Request Format
```typescript
const cancelRequest = {
    request: {
        coin: order.coin,
        order_id: order.oid
    }
};
```

## Next Steps
1. Fix price calculation:
   - Debug why `mids[purrIndex]` is undefined
   - Add proper error handling for missing price
   - Ensure price formatting matches API requirements

2. Test order placement:
   - Use working example from `order.management.test.ts`
   - Verify order structure matches API requirements
   - Add proper logging for debugging

3. Test order cancellation:
   - Use working example from `order.management.test.ts`
   - Verify cancel request format
   - Add proper error handling

## Running Tests
```bash
cd /Users/ilessio/dev-agents/Eliza-Projects/eliza_aiflow/packages/plugin-hyperliquid
npx vitest exchange.transport.test.ts
```

## Important Notes
1. All transactions must be signed (handled by HyperliquidService)
2. Using real API data - ensure proper error handling
3. Minimum order value: $10 USD equivalent
4. Need proper price decimals (usually 5-6)
5. Wait for order processing (1s delay recommended)

## Debug Logs to Watch
1. Market info and prices:
   ```
   Getting market info...
   Getting current prices...
   PURR market info: {...}
   ```

2. Price calculation:
   ```
   Price calculation: {
       purrMid,
       price,
       adjustedPrice,
       finalPrice
   }
   ```

3. Order placement:
   ```
   Placing test order: {...}
   Place order result: {...}
   ```

4. Order cancellation:
   ```
   Cancelling order: {...}
   Cancel result: {...}
   ```

## Common Issues & Solutions
1. NaN price:
   - Ensure `mids` array has data
   - Verify `purrIndex` is correct
   - Check price number conversion

2. Order placement fails:
   - Verify order format matches API
   - Check minimum order value
   - Ensure price decimals are correct

3. Order cancellation fails:
   - Verify order exists
   - Check order ID format
   - Handle race conditions

## Reference Implementation
See `order.management.test.ts` for working examples of:
1. Price calculation and formatting
2. Order placement with proper structure
3. Order cancellation with proper format
4. Error handling and logging

## Testing Strategy
1. Start with price calculation
2. Move to order placement once price works
3. Test order cancellation last
4. Add comprehensive logging at each step
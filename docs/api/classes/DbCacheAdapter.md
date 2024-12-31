[@elizaos/core v0.1.7-alpha.1](../index.md) / DbCacheAdapter

# Class: DbCacheAdapter

## Implements

- [`ICacheAdapter`](../interfaces/ICacheAdapter.md)

## Constructors

### new DbCacheAdapter()

> **new DbCacheAdapter**(`db`, `agentId`): [`DbCacheAdapter`](DbCacheAdapter.md)

#### Parameters

• **db**: [`IDatabaseCacheAdapter`](../interfaces/IDatabaseCacheAdapter.md)

• **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

[`DbCacheAdapter`](DbCacheAdapter.md)

#### Defined in

[packages/core/src/cache.ts:70](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L70)

## Methods

### get()

> **get**(`key`): `Promise`\<`string`\>

#### Parameters

• **key**: `string`

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`ICacheAdapter`](../interfaces/ICacheAdapter.md).[`get`](../interfaces/ICacheAdapter.md#get)

#### Defined in

[packages/core/src/cache.ts:75](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L75)

***

### set()

> **set**(`key`, `value`): `Promise`\<`void`\>

#### Parameters

• **key**: `string`

• **value**: `string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ICacheAdapter`](../interfaces/ICacheAdapter.md).[`set`](../interfaces/ICacheAdapter.md#set)

#### Defined in

[packages/core/src/cache.ts:79](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L79)

***

### delete()

> **delete**(`key`): `Promise`\<`void`\>

#### Parameters

• **key**: `string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ICacheAdapter`](../interfaces/ICacheAdapter.md).[`delete`](../interfaces/ICacheAdapter.md#delete)

#### Defined in

[packages/core/src/cache.ts:83](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L83)

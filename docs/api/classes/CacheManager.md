[@elizaos/core v0.1.7-alpha.1](../index.md) / CacheManager

# Class: CacheManager\<CacheAdapter\>

## Type Parameters

• **CacheAdapter** *extends* [`ICacheAdapter`](../interfaces/ICacheAdapter.md) = [`ICacheAdapter`](../interfaces/ICacheAdapter.md)

## Implements

- [`ICacheManager`](../interfaces/ICacheManager.md)

## Constructors

### new CacheManager()

> **new CacheManager**\<`CacheAdapter`\>(`adapter`): [`CacheManager`](CacheManager.md)\<`CacheAdapter`\>

#### Parameters

• **adapter**: `CacheAdapter`

#### Returns

[`CacheManager`](CacheManager.md)\<`CacheAdapter`\>

#### Defined in

[packages/core/src/cache.ts:93](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L93)

## Properties

### adapter

> **adapter**: `CacheAdapter`

#### Defined in

[packages/core/src/cache.ts:91](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L91)

## Methods

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T`\>

#### Type Parameters

• **T** = `unknown`

#### Parameters

• **key**: `string`

#### Returns

`Promise`\<`T`\>

#### Implementation of

[`ICacheManager`](../interfaces/ICacheManager.md).[`get`](../interfaces/ICacheManager.md#get)

#### Defined in

[packages/core/src/cache.ts:97](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L97)

***

### set()

> **set**\<`T`\>(`key`, `value`, `opts`?): `Promise`\<`void`\>

#### Type Parameters

• **T**

#### Parameters

• **key**: `string`

• **value**: `T`

• **opts?**: [`CacheOptions`](../type-aliases/CacheOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ICacheManager`](../interfaces/ICacheManager.md).[`set`](../interfaces/ICacheManager.md#set)

#### Defined in

[packages/core/src/cache.ts:116](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L116)

***

### delete()

> **delete**(`key`): `Promise`\<`void`\>

#### Parameters

• **key**: `string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ICacheManager`](../interfaces/ICacheManager.md).[`delete`](../interfaces/ICacheManager.md#delete)

#### Defined in

[packages/core/src/cache.ts:123](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L123)

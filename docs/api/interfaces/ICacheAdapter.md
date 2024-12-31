[@elizaos/core v0.1.7-alpha.1](../index.md) / ICacheAdapter

# Interface: ICacheAdapter

## Methods

### get()

> **get**(`key`): `Promise`\<`string`\>

#### Parameters

• **key**: `string`

#### Returns

`Promise`\<`string`\>

#### Defined in

[packages/core/src/cache.ts:11](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L11)

***

### set()

> **set**(`key`, `value`): `Promise`\<`void`\>

#### Parameters

• **key**: `string`

• **value**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/cache.ts:12](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L12)

***

### delete()

> **delete**(`key`): `Promise`\<`void`\>

#### Parameters

• **key**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/cache.ts:13](https://github.com/elizaOS/eliza/blob/main/packages/core/src/cache.ts#L13)

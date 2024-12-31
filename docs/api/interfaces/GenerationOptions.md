[@elizaos/core v0.1.7-alpha.1](../index.md) / GenerationOptions

# Interface: GenerationOptions

Configuration options for generating objects with a model.

## Properties

### runtime

> **runtime**: [`IAgentRuntime`](IAgentRuntime.md)

#### Defined in

[packages/core/src/generation.ts:1266](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1266)

***

### context

> **context**: `string`

#### Defined in

[packages/core/src/generation.ts:1267](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1267)

***

### modelClass

> **modelClass**: [`ModelClass`](../enumerations/ModelClass.md)

#### Defined in

[packages/core/src/generation.ts:1268](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1268)

***

### schema?

> `optional` **schema**: `ZodSchema`

#### Defined in

[packages/core/src/generation.ts:1269](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1269)

***

### schemaName?

> `optional` **schemaName**: `string`

#### Defined in

[packages/core/src/generation.ts:1270](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1270)

***

### schemaDescription?

> `optional` **schemaDescription**: `string`

#### Defined in

[packages/core/src/generation.ts:1271](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1271)

***

### stop?

> `optional` **stop**: `string`[]

#### Defined in

[packages/core/src/generation.ts:1272](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1272)

***

### mode?

> `optional` **mode**: `"auto"` \| `"json"` \| `"tool"`

#### Defined in

[packages/core/src/generation.ts:1273](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1273)

***

### experimental\_providerMetadata?

> `optional` **experimental\_providerMetadata**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/core/src/generation.ts:1274](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L1274)

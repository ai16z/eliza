[@elizaos/core v0.1.7-alpha.1](../index.md) / Memory

# Interface: Memory

Represents a stored memory/message

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:333](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L333)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated user ID

#### Defined in

[packages/core/src/types.ts:336](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L336)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated agent ID

#### Defined in

[packages/core/src/types.ts:339](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L339)

***

### createdAt?

> `optional` **createdAt**: `number`

Optional creation timestamp

#### Defined in

[packages/core/src/types.ts:342](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L342)

***

### content

> **content**: [`Content`](Content.md)

Memory content

#### Defined in

[packages/core/src/types.ts:345](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L345)

***

### embedding?

> `optional` **embedding**: `number`[]

Optional embedding vector

#### Defined in

[packages/core/src/types.ts:348](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L348)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated room ID

#### Defined in

[packages/core/src/types.ts:351](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L351)

***

### unique?

> `optional` **unique**: `boolean`

Whether memory is unique

#### Defined in

[packages/core/src/types.ts:354](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L354)

***

### similarity?

> `optional` **similarity**: `number`

Embedding similarity score

#### Defined in

[packages/core/src/types.ts:357](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L357)

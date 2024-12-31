[@elizaos/core v0.1.7-alpha.1](../index.md) / Content

# Interface: Content

Represents the content of a message or communication

## Indexable

 \[`key`: `string`\]: `unknown`

## Properties

### text

> **text**: `string`

The main text content

#### Defined in

[packages/core/src/types.ts:13](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L13)

***

### action?

> `optional` **action**: `string`

Optional action associated with the message

#### Defined in

[packages/core/src/types.ts:16](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L16)

***

### source?

> `optional` **source**: `string`

Optional source/origin of the content

#### Defined in

[packages/core/src/types.ts:19](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L19)

***

### url?

> `optional` **url**: `string`

URL of the original message/post (e.g. tweet URL, Discord message link)

#### Defined in

[packages/core/src/types.ts:22](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L22)

***

### inReplyTo?

> `optional` **inReplyTo**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

UUID of parent message if this is a reply/thread

#### Defined in

[packages/core/src/types.ts:25](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L25)

***

### attachments?

> `optional` **attachments**: [`Media`](../type-aliases/Media.md)[]

Array of media attachments

#### Defined in

[packages/core/src/types.ts:28](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L28)

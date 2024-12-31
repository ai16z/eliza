[@elizaos/core v0.1.7-alpha.1](../index.md) / trimTokens

# Function: trimTokens()

> **trimTokens**(`context`, `maxTokens`, `model`): `string`

Truncate the context to the maximum length allowed by the model.

## Parameters

• **context**: `string`

The text to truncate

• **maxTokens**: `number`

Maximum number of tokens to keep

• **model**: `TiktokenModel`

The tokenizer model to use

## Returns

`string`

The truncated text

## Defined in

[packages/core/src/generation.ts:581](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L581)

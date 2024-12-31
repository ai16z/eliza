[@elizaos/core v0.1.7-alpha.1](../index.md) / composeActionExamples

# Function: composeActionExamples()

> **composeActionExamples**(`actionsData`, `count`): `string`

Composes a set of example conversations based on provided actions and a specified count.
It randomly selects examples from the provided actions and formats them with generated names.

## Parameters

• **actionsData**: [`Action`](../interfaces/Action.md)[]

An array of `Action` objects from which to draw examples.

• **count**: `number`

The number of examples to generate.

## Returns

`string`

A string containing formatted examples of conversations.

## Defined in

[packages/core/src/actions.ts:11](https://github.com/elizaOS/eliza/blob/main/packages/core/src/actions.ts#L11)

[@elizaos/core v0.1.7-alpha.1](../index.md) / getProviders

# Function: getProviders()

> **getProviders**(`runtime`, `message`, `state`?): `Promise`\<`string`\>

Formats provider outputs into a string which can be injected into the context.

## Parameters

• **runtime**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)

The AgentRuntime object.

• **message**: [`Memory`](../interfaces/Memory.md)

The incoming message object.

• **state?**: [`State`](../interfaces/State.md)

The current state object.

## Returns

`Promise`\<`string`\>

A string that concatenates the outputs of each provider.

## Defined in

[packages/core/src/providers.ts:10](https://github.com/elizaOS/eliza/blob/main/packages/core/src/providers.ts#L10)

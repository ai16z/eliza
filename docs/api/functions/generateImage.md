[@elizaos/core v0.1.7-alpha.1](../index.md) / generateImage

# Function: generateImage()

> **generateImage**(`data`, `runtime`): `Promise`\<`object`\>

## Parameters

• **data**

• **data.prompt**: `string`

• **data.width**: `number`

• **data.height**: `number`

• **data.count?**: `number`

• **data.negativePrompt?**: `string`

• **data.numIterations?**: `number`

• **data.guidanceScale?**: `number`

• **data.seed?**: `number`

• **data.modelId?**: `string`

• **data.jobId?**: `string`

• **data.stylePreset?**: `string`

• **data.hideWatermark?**: `boolean`

• **runtime**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)

## Returns

`Promise`\<`object`\>

### success

> **success**: `boolean`

### data?

> `optional` **data**: `string`[]

### error?

> `optional` **error**: `any`

## Defined in

[packages/core/src/generation.ts:926](https://github.com/elizaOS/eliza/blob/main/packages/core/src/generation.ts#L926)

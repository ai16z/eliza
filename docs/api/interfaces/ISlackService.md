[@elizaos/core v0.1.7-alpha.1](../index.md) / ISlackService

# Interface: ISlackService

## Extends

- [`Service`](../classes/Service.md)

## Properties

### client

> **client**: `any`

#### Defined in

[packages/core/src/types.ts:1258](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L1258)

## Accessors

### serviceType

#### Get Signature

> **get** **serviceType**(): [`ServiceType`](../enumerations/ServiceType.md)

##### Returns

[`ServiceType`](../enumerations/ServiceType.md)

#### Inherited from

[`Service`](../classes/Service.md).[`serviceType`](../classes/Service.md#serviceType-1)

#### Defined in

[packages/core/src/types.ts:1036](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L1036)

## Methods

### initialize()

> `abstract` **initialize**(`runtime`): `Promise`\<`void`\>

Add abstract initialize method that must be implemented by derived classes

#### Parameters

• **runtime**: [`IAgentRuntime`](IAgentRuntime.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`Service`](../classes/Service.md).[`initialize`](../classes/Service.md#initialize)

#### Defined in

[packages/core/src/types.ts:1041](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L1041)

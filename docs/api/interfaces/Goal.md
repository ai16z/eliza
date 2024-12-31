[@elizaos/core v0.1.7-alpha.1](../index.md) / Goal

# Interface: Goal

Represents a high-level goal composed of objectives

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:110](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L110)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Room ID where goal exists

#### Defined in

[packages/core/src/types.ts:113](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L113)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

User ID of goal owner

#### Defined in

[packages/core/src/types.ts:116](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L116)

***

### name

> **name**: `string`

Name/title of the goal

#### Defined in

[packages/core/src/types.ts:119](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L119)

***

### status

> **status**: [`GoalStatus`](../enumerations/GoalStatus.md)

Current status

#### Defined in

[packages/core/src/types.ts:122](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L122)

***

### objectives

> **objectives**: [`Objective`](Objective.md)[]

Component objectives

#### Defined in

[packages/core/src/types.ts:125](https://github.com/elizaOS/eliza/blob/main/packages/core/src/types.ts#L125)

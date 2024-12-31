[@elizaos/core v0.1.7-alpha.1](../index.md) / composeRandomUser

# Function: composeRandomUser()

> **composeRandomUser**(`template`, `length`): `string`

Generates a string with random user names populated in a template.

This function generates a specified number of random user names and populates placeholders
in the provided template with these names. Placeholders in the template should follow the format `{{userX}}`
where `X` is the position of the user (e.g., `{{user1}}`, `{{user2}}`).

## Parameters

• **template**: `string`

• **length**: `number`

## Returns

`string`

The template string with placeholders replaced by random user names.

## Example

```ts
// Given a template and a length
const template = "Hello, {{user1}}! Meet {{user2}} and {{user3}}.";
const length = 3;

// Composing the random user string will result in:
// "Hello, John! Meet Alice and Bob."
const result = composeRandomUser({ template, length });
```

## Defined in

[packages/core/src/context.ts:94](https://github.com/elizaOS/eliza/blob/main/packages/core/src/context.ts#L94)

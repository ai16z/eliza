[@elizaos/core v0.1.7-alpha.1](../index.md) / addHeader

# Function: addHeader()

> **addHeader**(`header`, `body`): `string`

Adds a header to a body of text.

This function takes a header string and a body string and returns a new string with the header prepended to the body.
If the body string is empty, the header is returned as is.

## Parameters

• **header**: `string`

The header to add to the body.

• **body**: `string`

The body to which to add the header.

## Returns

`string`

The body with the header prepended.

## Example

```ts
// Given a header and a body
const header = "Header";
const body = "Body";

// Adding the header to the body will result in:
// "Header\nBody"
const text = addHeader(header, body);
```

## Defined in

[packages/core/src/context.ts:70](https://github.com/elizaOS/eliza/blob/main/packages/core/src/context.ts#L70)

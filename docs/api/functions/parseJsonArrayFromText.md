[@elizaos/core v0.1.7-alpha.1](../index.md) / parseJsonArrayFromText

# Function: parseJsonArrayFromText()

> **parseJsonArrayFromText**(`text`): `any`[]

Parses a JSON array from a given text. The function looks for a JSON block wrapped in triple backticks
with `json` language identifier, and if not found, it searches for an array pattern within the text.
It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
is an array, it returns the array; otherwise, it returns null.

## Parameters

• **text**: `string`

The input text from which to extract and parse the JSON array.

## Returns

`any`[]

An array parsed from the JSON string if successful; otherwise, null.

## Defined in

[packages/core/src/parsing.ts:61](https://github.com/elizaOS/eliza/blob/main/packages/core/src/parsing.ts#L61)

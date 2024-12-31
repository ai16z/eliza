[@elizaos/core v0.1.7-alpha.1](../index.md) / parseJSONObjectFromText

# Function: parseJSONObjectFromText()

> **parseJSONObjectFromText**(`text`): `Record`\<`string`, `any`\> \| `null`

Parses a JSON object from a given text. The function looks for a JSON block wrapped in triple backticks
with `json` language identifier, and if not found, it searches for an object pattern within the text.
It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
is an object (but not an array), it returns the object; otherwise, it tries to parse an array if the result
is an array, or returns null if parsing is unsuccessful or the result is neither an object nor an array.

## Parameters

• **text**: `string`

The input text from which to extract and parse the JSON object.

## Returns

`Record`\<`string`, `any`\> \| `null`

An object parsed from the JSON string if successful; otherwise, null or the result of parsing an array.

## Defined in

[packages/core/src/parsing.ts:110](https://github.com/elizaOS/eliza/blob/main/packages/core/src/parsing.ts#L110)

import { ActionResponse } from "./types.ts";
const jsonBlockPattern = /```json\n([\s\S]*?)\n```/;

export const messageCompletionFooter = `\nResponse format should be formatted in a JSON block like this:
\`\`\`json
{ "user": "{{agentName}}", "text": "string", "action": "string" }
\`\`\``;

export const shouldRespondFooter = `The available options are [RESPOND], [IGNORE], or [STOP]. Choose the most appropriate option.
If {{agentName}} is talking too much, you can choose [IGNORE]

Your response must include one of the options.`;

export const parseShouldRespondFromText = (
    text: string
): "RESPOND" | "IGNORE" | "STOP" | null => {
    const match = text
        .split("\n")[0]
        .trim()
        .replace("[", "")
        .toUpperCase()
        .replace("]", "")
        .match(/^(RESPOND|IGNORE|STOP)$/i);
    return match
        ? (match[0].toUpperCase() as "RESPOND" | "IGNORE" | "STOP")
        : text.includes("RESPOND")
          ? "RESPOND"
          : text.includes("IGNORE")
            ? "IGNORE"
            : text.includes("STOP")
              ? "STOP"
              : null;
};

export const booleanFooter = `Respond with only a YES or a NO.`;

/**
 * Parses a string to determine its boolean equivalent.
 *
 * Recognized affirmative values: "YES", "Y", "TRUE", "T", "1", "ON", "ENABLE".
 * Recognized negative values: "NO", "N", "FALSE", "F", "0", "OFF", "DISABLE".
 *
 * @param {string} text - The input text to parse.
 * @returns {boolean|null} - Returns `true` for affirmative inputs, `false` for negative inputs, and `null` for unrecognized inputs or null/undefined.
 */
export const parseBooleanFromText = (text: string) => {
    if (!text) return null; // Handle null or undefined input

    const affirmative = ["YES", "Y", "TRUE", "T", "1", "ON", "ENABLE"];
    const negative = ["NO", "N", "FALSE", "F", "0", "OFF", "DISABLE"];

    const normalizedText = text.trim().toUpperCase();

    if (affirmative.includes(normalizedText)) {
        return true;
    } else if (negative.includes(normalizedText)) {
        return false;
    }

    return null; // Return null for unrecognized inputs
};

export const stringArrayFooter = `Respond with a JSON array containing the values in a JSON block formatted for markdown with this structure:
\`\`\`json
[
  'value',
  'value'
]
\`\`\`

Your response must include the JSON block.`;

/**
 * Parses a JSON array from a given text. The function looks for a JSON block wrapped in triple backticks
 * with `json` language identifier, and if not found, it searches for an array pattern within the text.
 * It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
 * is an array, it returns the array; otherwise, it returns null.
 *
 * @param text - The input text from which to extract and parse the JSON array.
 * @returns An array parsed from the JSON string if successful; otherwise, null.
 */
export function parseJsonArrayFromText(text: string) {
    let jsonData = null;

    // First try to parse with the original JSON format
    const jsonBlockMatch = text.match(jsonBlockPattern);

    if (jsonBlockMatch) {
        try {
            // Replace single quotes with double quotes before parsing
            const normalizedJson = jsonBlockMatch[1].replace(/'/g, '"');
            jsonData = JSON.parse(normalizedJson);
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    }

    // If that fails, try to find an array pattern
    if (!jsonData) {
        const arrayPattern = /\[\s*['"][^'"]*['"]\s*\]/;
        const arrayMatch = text.match(arrayPattern);

        if (arrayMatch) {
            try {
                // Replace single quotes with double quotes before parsing
                const normalizedJson = arrayMatch[0].replace(/'/g, '"');
                jsonData = JSON.parse(normalizedJson);
            } catch (e) {
                console.error("Error parsing JSON:", e);
            }
        }
    }

    if (Array.isArray(jsonData)) {
        return jsonData;
    }

    return null;
}

/**
 * Parses a JSON object from a given text. The function looks for a JSON block wrapped in triple backticks
 * with `json` language identifier, and if not found, it searches for an object pattern within the text.
 * It then attempts to parse the JSON string into a JavaScript object. If parsing is successful and the result
 * is an object (but not an array), it returns the object; otherwise, it tries to parse an array if the result
 * is an array, or returns null if parsing is unsuccessful or the result is neither an object nor an array.
 *
 * @param text - The input text from which to extract and parse the JSON object.
 * @returns An object parsed from the JSON string if successful; otherwise, null or the result of parsing an array.
 */
export function parseJSONObjectFromText(
    text: string
): Record<string, any> | null {
    let jsonData = null;

    const jsonBlockMatch = text.match(jsonBlockPattern);

    if (jsonBlockMatch) {
        try {
            jsonData = JSON.parse(jsonBlockMatch[1]);
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return null;
        }
    } else {
        const objectPattern = /{[\s\S]*?}/;
        const objectMatch = text.match(objectPattern);

        if (objectMatch) {
            try {
                jsonData = JSON.parse(objectMatch[0]);
            } catch (e) {
                console.error("Error parsing JSON:", e);
                return null;
            }
        }
    }

    if (
        typeof jsonData === "object" &&
        jsonData !== null &&
        !Array.isArray(jsonData)
    ) {
        return jsonData;
    } else if (typeof jsonData === "object" && Array.isArray(jsonData)) {
        return parseJsonArrayFromText(text);
    } else {
        return null;
    }
}

export const postActionResponseFooter = `Choose any combination of [LIKE], [RETWEET], [QUOTE], and [REPLY] that are appropriate. Each action must be on its own line. Your response must only include the chosen actions.`;

export const parseActionResponseFromText = (
    text: string
): { actions: ActionResponse } => {
    const actions: ActionResponse = {
        like: false,
        retweet: false,
        quote: false,
        reply: false,
    };

    // Regex patterns
    const likePattern = /\[LIKE\]/i;
    const retweetPattern = /\[RETWEET\]/i;
    const quotePattern = /\[QUOTE\]/i;
    const replyPattern = /\[REPLY\]/i;

    // Check with regex
    actions.like = likePattern.test(text);
    actions.retweet = retweetPattern.test(text);
    actions.quote = quotePattern.test(text);
    actions.reply = replyPattern.test(text);

    // Also do line by line parsing as backup
    const lines = text.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "[LIKE]") actions.like = true;
        if (trimmed === "[RETWEET]") actions.retweet = true;
        if (trimmed === "[QUOTE]") actions.quote = true;
        if (trimmed === "[REPLY]") actions.reply = true;
    }

    return { actions };
};

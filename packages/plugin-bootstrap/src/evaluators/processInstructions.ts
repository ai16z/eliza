import { composeContext, createGoal, elizaLogger, State } from "@elizaos/core";
import { generateObjectArray } from "@elizaos/core";
import {
    ActionExample,
    Content,
    IAgentRuntime,
    Memory,
    ModelClass,
    Evaluator,
} from "@elizaos/core";

export const formatFacts = (facts: Memory[]) => {
    const messageStrings = facts
        .reverse()
        .map((fact: Memory) => `${(fact.content as Content)?.content}`);
    const finalMessageStrings = messageStrings.join("\n");
    return finalMessageStrings;
};


// goals and knowledge

// make sure there's recently conversations with the operator from other rooms

// inject the old goals and knowledge

// make sure we only store new stuff that was not already known


const processInstructionsTemplate = `TASK: Extract Instructions from operator messages and format them as an array of instructions in JSON format.

# START OF EXAMPLES
These are examples of the expected output format:
{{evaluationExamples}}
# END OF EXAMPLES

# INSTRUCTIONS
Extract any knowledge or goals from the operator's messages and format them according to these rules:
- Use only straight double quotes (") for all JSON keys and string values
- Do not use smart/curly quotes (", ")
- Do not use apostrophes or possessives (use "Trumps presidency" instead of "Trump's presidency")
- Do not use internal quotation marks in text
- Keep all text values on a single line
- Use plain text without special characters
- For possessives, remove the apostrophe (Example: "Kamalas events" not "Kamala's events")

Recent Messages:
{{recentMessages}}

Response must be a JSON object inside a JSON markdown block with this exact structure:
\`\`\`json
[{
  "goals": [
    {
      "id": <goal uuid>, 
      "roomId": "default-room-{{agentId}}", 
      "userId": "{{agentId}}",
      "name": "string",
      "status": "IN_PROGRESS" | "DONE" | "FAILED",
      "objectives": {
        "description": ["string"],
        "completed": true | false
      }
    }
  ],
  "knowledge": ["string"]
}]
\`\`\`

Remove all single quotes in the response. 
Remove all double quotes in the response, except those wrapping keys and values.
`;

export const useProcessInstructionsTemplate = (runtime: IAgentRuntime) => {
    return runtime.character.templates?.processInstructionsTemplate || processInstructionsTemplate;
};

async function handler(runtime: IAgentRuntime, message: Memory, state?: State) {
    elizaLogger.log("Start handling instructions")
    state = await runtime.updateRecentMessageState(state);

    const context = composeContext({
        state,
        template: runtime.character.templates?.processInstructionsTemplate || processInstructionsTemplate,
    });
    
    const instructions = await generateObjectArray({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    const goals = instructions.flatMap(instruction => instruction.goals)
    const knowledge = instructions.flatMap(instruction => instruction.knowledge)

    elizaLogger.log(`Instruction generated ${goals.length} goals and ${knowledge.length} knowledge`)

    goals.forEach(async (goal) => {
        try {
            elizaLogger.log("About to create goals under instruction", goal)
            await createGoal({ runtime, goal });
        } catch (error) {
            elizaLogger.log("About to create goals but failed. Skip.", goal.name, error)
        }
        
    });

    knowledge.forEach(async (knowledge) => {
        elizaLogger.log("About to create memory under instruction", knowledge)
        await runtime.knowledgeManager.createMemory({
            content: knowledge,
            userId: message.userId,
            roomId: message.roomId,
            agentId: runtime.character.id,
        });
    });
}

export const processInstructionsEvaluator: Evaluator = {
    name: "PROCESS_INSTRUCTIONS",
    similes: [
        "GET_INSTRUCTIONS",
        "PROCESS_OPERATOR_INSTRUCTIONS",
        "GET_OPERATOR_INSTRUCTIONS",
    ],
    alwaysRun: true,
    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state?: State
    ): Promise<boolean> => {
        const character = runtime.character;

        if (!character.operators || character.operators.length === 0) {
            return false;
        }

        elizaLogger.log(`Validating ${character.operators.length} operators: ${character.operators.map(op => op.name).join(', ')}`)

        // get the name of the operator from the message
        const userId = message.userId;

        const account = await runtime.databaseAdapter.getAccountById(userId);

        elizaLogger.log(`Current account is ${account.username}. Message source is ${message.content.source}. Validate: ${character.operators.some(
            (operator) => operator.client.toLowerCase() === message?.content?.source?.toLowerCase() && operator.name.toLowerCase() === account?.username.toLowerCase()
        )}`)

        // Make sure this is correct
        return character.operators.some(
            (operator) => operator.client.toLowerCase() === message?.content?.source?.toLowerCase() && operator.name.toLowerCase() === account?.username.toLowerCase()
        );
    },
    description: "Process instructions from operators.",
    handler,
    examples: [
        {
            context: `Operators in the scene:
{{operator1}}: System administrator with full access rights
{{agent}}: AI assistant configured to follow operator instructions

Known Instructions:
- Greeting protocol updated to include user's name
- Response time limit set to 30 seconds`,
            messages: [
                {
                    user: "{{operator1}}",
                    content: {
                        text: "Update response format to include timestamps for all interactions"
                    },
                },
                {
                    user: "{{agent}}",
                    content: {
                        text: "Understood. I will now include timestamps in all interactions."
                    },
                }
            ] as ActionExample[],
            outcome: `\`\`\`json
[
  {
    "instruction": "Include timestamps in all interaction responses",
    "type": "format_update",
    "status": "active",
    "source": "{{operator1}}",
    "timestamp": "{{current_time}}"
  }
]
\`\`\``
        },
        {
            context: `Operators in the scene:
{{operator1}}: Content moderator with response modification rights
{{agent}}: AI assistant with content filtering enabled

Current Instructions:
- Content filtering level set to moderate
- Maximum response length: 500 words`,
            messages: [
                {
                    user: "{{operator1}}",
                    content: {
                        text: "Set content filtering to strict and reduce maximum response length to 300 words"
                    },
                },
                {
                    user: "{{agent}}",
                    content: {
                        text: "Updating content filtering to strict mode and setting 300 word limit for responses."
                    },
                }
            ] as ActionExample[],
            outcome: `\`\`\`json
[
  {
    "instruction": "Set content filtering level to strict",
    "type": "content_filter",
    "status": "active",
    "source": "{{operator1}}",
    "timestamp": "{{current_time}}"
  },
  {
    "instruction": "Set maximum response length to 300 words",
    "type": "response_limit",
    "status": "active",
    "source": "{{operator1}}",
    "timestamp": "{{current_time}}"
  }
]
\`\`\``
        },
        {
            context: `Operators in the scene:
{{operator1}}: System trainer with behavior modification access
{{agent}}: AI assistant in training mode

Active Instructions:
- Learning mode enabled
- Performance metrics tracking active`,
            messages: [
                {
                    user: "{{operator1}}",
                    content: {
                        text: "Enable advanced reasoning module and set decision confidence threshold to 0.85"
                    },
                },
                {
                    user: "{{agent}}",
                    content: {
                        text: "Enabling advanced reasoning and updating confidence threshold as specified."
                    },
                }
            ] as ActionExample[],
            outcome: `\`\`\`json
[
  {
    "instruction": "Enable advanced reasoning module",
    "type": "module_activation",
    "status": "active",
    "source": "{{operator1}}",
    "timestamp": "{{current_time}}"
  },
  {
    "instruction": "Set decision confidence threshold to 0.85",
    "type": "threshold_update",
    "status": "active",
    "source": "{{operator1}}",
    "timestamp": "{{current_time}}"
  }
]
\`\`\``
        }
    ],
};

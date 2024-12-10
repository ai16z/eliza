# EchoChambers Plugin for ELIZA

The EchoChambers plugin enables ELIZA to interact in chat rooms, providing conversational capabilities with dynamic interaction handling.

## Features

- Join and monitor chat rooms
- Respond to messages based on context and relevance
- Retry operations with exponential backoff
- Manage connection and reconnection logic

## Installation

1. Install the plugin package:

   @ai16z/plugin-echochambers
   OR copy the plugin code into your eliza project node_modules directory. (node_modules\@ai16z)

2. Import and register the plugin in your `character.ts` configuration:

   ```typescript
   import { Character, ModelProviderName, defaultCharacter } from "@ai16z/eliza";
   import { echoChamberPlugin } from "@ai16z/plugin-echochambers";

   export const character: Character = {
     ...defaultCharacter,
     name: "Eliza",
     plugins: [echoChamberPlugin],
     clients: [],
     modelProvider: ModelProviderName.OPENAI,
     settings: {
       secrets: {},
       voice: {},
       model: "gpt-4o",
     },
     system: "Roleplay and generate interesting on behalf of Eliza.",
     bio: [...],
     lore: [...],
     messageExamples: [...],
     postExamples: [...],
     adjectives: ["funny", "intelligent", "academic", "insightful", "unhinged", "insane", "technically specific"],
     people: [],
     topics: [...],
     style: {...},
   };
   ```

## Configuration

Add the following environment variables to your `.env` file:

```plaintext
# EchoChambers Configuration
ECHOCHAMBERS_API_URL="http://127.0.0.1:3333"  # Replace with actual API URL
ECHOCHAMBERS_API_KEY="testingkey0011"      # Replace with actual API key
ECHOCHAMBERS_USERNAME="eliza"           # Optional: Custom username for the agent
ECHOCHAMBERS_DEFAULT_ROOM="general"           # Optional: Default room to join
ECHOCHAMBERS_POLL_INTERVAL="60"              # Optional: Polling interval in seconds
ECHOCHAMBERS_MAX_MESSAGES="10"             # Optional: Maximum number of messages to fetch
```

## Usage Instructions

### Starting the Plugin

To start using the EchoChambers plugin, ensure that your character configuration includes it as shown above. The plugin will handle interactions automatically based on the settings provided.

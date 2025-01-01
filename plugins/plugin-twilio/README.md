# Plugin Twilio

A plugin for handling voice and text services using Twilio, ElevenLabs, and Deepgram.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file with your API keys:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

3. Build the project:
```bash
pnpm build
```

4. Run the test:
```bash
pnpm test
```


## Usage
```typescript
import { voiceTextPlugin } from 'plugin-twilio';
// Initialize the plugin
await voiceTextPlugin.initialize();
// Use the services
const twilioService = voiceTextPlugin.getService(ServiceType.TEXT_GENERATION);
await twilioService.sendMessage(to, message);
````

6. Create an index.ts file:
```typescript:plugin-twilio/src/index.ts
export from './voice-text-plugin';
export from './services/voice';
export from './services/twilio';
export from './services/transcription';
```



To implement these changes:

1. Create the new directory:
```bash
mkdir plugin-twilio
```

2. Copy the files to their new locations:
```bash
cp -r src test package.json tsconfig.json README.md plugin-twilio/
```

3. Install dependencies in the new directory:
```bash
cd plugin-twilio
pnpm install
```

4. Build and test:
```bash
pnpm build && pnpm test
```



Let me know if you need any adjustments to these files!
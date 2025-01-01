import { Plugin, ServiceType } from '@ai16z/eliza';
import { TranscriptionService } from './services/transcription';
import { VoiceService } from './services/voice';
import { TwilioService } from './services/twilio';

export const twilioPlugin: Plugin = {
  name: 'twilio',
  description: 'Plugin for voice and text interactions using Deepgram, ElevenLabs, and Twilio',
  services: [
    new TranscriptionService(),
    new VoiceService(),
    new TwilioService()
  ]
};

// Export service instances for direct use
export const transcriptionService = twilioPlugin.services?.find(
  s => s.serviceType === ServiceType.TRANSCRIPTION
) as TranscriptionService;

export const voiceService = twilioPlugin.services?.find(
  s => s.serviceType === ServiceType.SPEECH_GENERATION
) as VoiceService;

export const twilioService = twilioPlugin.services?.find(
  s => s.serviceType === ServiceType.TEXT_GENERATION
) as TwilioService;
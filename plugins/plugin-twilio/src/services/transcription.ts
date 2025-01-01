// /src/services/transcription.ts

import { Service, ServiceType } from '@ai16z/eliza';
import { createClient, DeepgramClient } from '@deepgram/sdk';

export class TranscriptionService extends Service {
  private deepgram: DeepgramClient;

  static get serviceType(): ServiceType {
    return ServiceType.TRANSCRIPTION;
  }

  constructor() {
    super();
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is required');
    }
    // Initialize with the new v3 format
    this.deepgram = createClient({ key: apiKey });
  }

  async initialize(): Promise<void> {
    // Simple validation - if the key is invalid, this will throw
    if (!this.deepgram) {
      throw new Error('Deepgram client not initialized');
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      // Using v3 API format
      const response = await this.deepgram.transcription.preRecorded(
        { buffer: audioBuffer, mimetype: 'audio/wav' },
        { smart_format: true, model: 'nova' }
      );

      return response.results?.channels[0]?.alternatives[0]?.transcript || '';
    } catch (error) {
      throw new Error('Transcription failed: ' + error);
    }
  }
} 
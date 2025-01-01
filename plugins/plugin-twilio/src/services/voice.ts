// /src/services/voice.ts

import { Service, ServiceType } from '@ai16z/eliza';
import axios from 'axios';

export class VoiceService extends Service {
  private apiKey: string;
  private voiceId: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  static get serviceType(): ServiceType {
    return ServiceType.SPEECH_GENERATION;
  }

  constructor() {
    super();
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is required and cannot be empty');
    }
    this.apiKey = apiKey;
    this.voiceId = ''; // Will be set during initialization
  }

  async initialize(): Promise<void> {
    try {
      // Make direct API call instead of using the SDK
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const voices = response.data.voices;
      
      if (!voices || !Array.isArray(voices)) {
        throw new Error('Unexpected response format from ElevenLabs API');
      }

      if (voices.length === 0) {
        throw new Error('No voices available in your ElevenLabs account');
      }

      // Get the first available voice ID
      const firstVoice = voices[0];
      const voiceId = firstVoice.voice_id;
      
      if (!voiceId) {
        throw new Error('Could not find a valid voice ID in the response');
      }

      this.voiceId = voiceId;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired ElevenLabs API key');
      }
      if (error.response?.data?.detail) {
        throw new Error(`ElevenLabs API error: ${error.response.data.detail}`);
      }
      const message = error.message || 'Unknown error occurred';
      throw new Error(`Failed to initialize ElevenLabs: ${message}`);
    }
  }

  async generateSpeech(text: string): Promise<Buffer> {
    if (!this.voiceId) {
      throw new Error('Voice service not properly initialized');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        { text },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      if (!response.data) {
        throw new Error('No audio data received from ElevenLabs');
      }

      return Buffer.from(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired ElevenLabs API key');
      }
      if (error.response?.data?.detail) {
        throw new Error(`ElevenLabs API error: ${error.response.data.detail}`);
      }
      throw new Error(`Speech generation failed: ${error.message || error}`);
    }
  }
} 
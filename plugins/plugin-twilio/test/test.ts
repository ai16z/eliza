import { ServiceType } from '@ai16z/eliza';
import { twilioPlugin } from '../src/twilio-plugin';
import { TwilioService } from '../src/services/twilio';
import { VoiceService } from '../src/services/voice';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function testTwilio() {
  console.log('\nTesting Twilio SMS...');
  try {
    const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'TEST_PHONE_NUMBER'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`⚠️  Skipping Twilio test - missing environment variables: ${missingVars.join(', ')}`);
      return;
    }

    const twilioService = twilioPlugin.services?.find(s => s.serviceType === ServiceType.TEXT_GENERATION) as TwilioService;
    await twilioService.initialize();
    
    await twilioService.sendMessage(
      process.env.TEST_PHONE_NUMBER!,
      'Test message from Eliza Twilio plugin'
    );
    console.log('✅ SMS sent successfully!');
  } catch (error) {
    console.error('❌ Twilio test failed:', error);
  }
}

async function testVoice() {
  console.log('\nTesting ElevenLabs voice generation...');
  try {
    if (!process.env.ELEVENLABS_API_KEY?.trim()) {
      console.log('⚠️  Skipping voice test - missing or empty ELEVENLABS_API_KEY');
      return;
    }
    
    const voiceService = twilioPlugin.services?.find(s => s.serviceType === ServiceType.SPEECH_GENERATION) as VoiceService;
    await voiceService.initialize();
    const speech = await voiceService.generateSpeech('Hello, this is a test message from Eliza Twilio plugin');
    
    await fs.writeFile('test-output.mp3', speech);
    console.log('✅ Voice generated and saved to test-output.mp3');
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail?.message || error.message || error;
    console.error('❌ Voice test failed:', errorMessage);
  }
}

async function test() {
  try {
    console.log('Starting tests...');
    await testTwilio();
    await testVoice();
    console.log('\nTests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

test().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
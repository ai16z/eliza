// /src/services/twilio.ts

import { Service, ServiceType } from '@ai16z/eliza';
import { Twilio } from 'twilio';

export class TwilioService extends Service {
  private client: Twilio;
  private fromNumber: string;

  static get serviceType(): ServiceType {
    return ServiceType.TEXT_GENERATION;
  }

  constructor() {
    super();
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are required');
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async initialize(): Promise<void> {
    try {
      // Verify credentials and phone number
      const numbers = await this.client.incomingPhoneNumbers.list({ limit: 1 });
      if (!numbers.length) {
        throw new Error('No phone numbers found in your Twilio account');
      }
    } catch (error) {
      throw new Error('Failed to initialize Twilio service: ' + error);
    }
  }

  async sendMessage(to: string, body: string): Promise<void> {
    if (!to) {
      throw new Error('Recipient phone number is required');
    }

    await this.client.messages.create({
      body,
      to,
      from: this.fromNumber
    });
  }
} 
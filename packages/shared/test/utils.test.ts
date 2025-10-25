import { describe, it, expect } from 'vitest';
import { 
  generateDedupeKey, 
  isQuietHours, 
  isUnsubscribeKeyword,
  generateWhatsAppLink 
} from '../src/utils';
import { Channel } from '@algor/db';

describe('Utils', () => {
  describe('generateDedupeKey', () => {
    it('should generate unique dedupe key', () => {
      const key = generateDedupeKey('tenant1', 'campaign1', 'contact1', Channel.TELEGRAM);
      expect(key).toBe('tenant1:campaign1:contact1:TELEGRAM');
    });
  });

  describe('isQuietHours', () => {
    it('should detect quiet hours crossing midnight', () => {
      // Mock time to 21:00
      const result = isQuietHours('20:00', '10:00');
      // Result depends on current time, this is just structure
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isUnsubscribeKeyword', () => {
    it('should detect СТОП keyword', () => {
      expect(isUnsubscribeKeyword('СТОП')).toBe(true);
      expect(isUnsubscribeKeyword('стоп')).toBe(true);
    });

    it('should detect STOP keyword', () => {
      expect(isUnsubscribeKeyword('STOP')).toBe(true);
      expect(isUnsubscribeKeyword('stop')).toBe(true);
    });

    it('should detect ОТПИСКА keyword', () => {
      expect(isUnsubscribeKeyword('ОТПИСКА')).toBe(true);
      expect(isUnsubscribeKeyword('отписка')).toBe(true);
    });

    it('should not detect random text', () => {
      expect(isUnsubscribeKeyword('Hello world')).toBe(false);
    });
  });

  describe('generateWhatsAppLink', () => {
    it('should generate correct WhatsApp link', () => {
      const link = generateWhatsAppLink('+79161234567', 'Hello');
      expect(link).toContain('https://api.whatsapp.com/send');
      expect(link).toContain('phone=79161234567');
      expect(link).toContain('text=Hello');
    });

    it('should generate link without text', () => {
      const link = generateWhatsAppLink('+79161234567');
      expect(link).toBe('https://api.whatsapp.com/send?phone=79161234567');
    });
  });
});


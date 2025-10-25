import { describe, it, expect } from 'vitest';
import { OrchestrationPolicySchema } from '../src/schemas';
import * as yaml from 'js-yaml';

describe('Orchestration Policy Schema', () => {
  it('should validate correct YAML policy', () => {
    const yamlPolicy = `
channels:
  priority: [whatsapp, telegram, vk, email, sms]
  quiet_hours:
    start: "20:00"
    end: "10:00"
    tz_by_contact: true
  promo_cadence:
    per_contact_hours: 48
    max_per_week: 2

whatsapp:
  mode: hybrid
  sender_pools:
    - id: pool-1
      max_rate_per_min: 60
      jitter_seconds: [2, 12]
  template_policy:
    require_approved_templates: true
    mix:
      value_first: 2
      offer: 1
  stop_triggers:
    complaint_rate: 0.003
    undelivered_rate: 0.08

compliance:
  require_opt_in: true
  ad_label_required: true
  global_suppress_on_stop: true
`;

    const policy = yaml.load(yamlPolicy);
    const result = OrchestrationPolicySchema.safeParse(policy);
    
    expect(result.success).toBe(true);
  });

  it('should reject invalid channel priority', () => {
    const policy = {
      channels: {
        priority: ['invalid_channel'],
        quiet_hours: { start: '20:00', end: '10:00' },
        promo_cadence: { per_contact_hours: 48, max_per_week: 2 },
      },
      compliance: {
        require_opt_in: true,
        ad_label_required: true,
        global_suppress_on_stop: true,
      },
    };

    const result = OrchestrationPolicySchema.safeParse(policy);
    expect(result.success).toBe(false);
  });

  it('should reject invalid quiet hours format', () => {
    const policy = {
      channels: {
        priority: ['telegram'],
        quiet_hours: { start: '25:00', end: '10:00' }, // Invalid hour
        promo_cadence: { per_contact_hours: 48, max_per_week: 2 },
      },
      compliance: {
        require_opt_in: true,
        ad_label_required: true,
        global_suppress_on_stop: true,
      },
    };

    const result = OrchestrationPolicySchema.safeParse(policy);
    expect(result.success).toBe(false);
  });
});


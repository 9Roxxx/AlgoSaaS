import { z } from 'zod';

// Zod schema для валидации YAML политики оркестрации

export const SenderPoolSchema = z.object({
  id: z.string(),
  max_rate_per_min: z.number().min(1).max(1000),
  jitter_seconds: z.tuple([z.number().min(0), z.number().max(60)]),
});

export const QuietHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  end: z.string().regex(/^\d{2}:\d{2}$/),
  tz_by_contact: z.boolean().optional().default(true),
});

export const PromoCadenceSchema = z.object({
  per_contact_hours: z.number().min(1),
  max_per_week: z.number().min(1),
});

export const ChannelPrioritySchema = z.array(
  z.enum(['whatsapp', 'telegram', 'vk', 'email', 'sms'])
);

export const TemplateMixSchema = z.object({
  value_first: z.number().min(0),
  offer: z.number().min(0),
});

export const StopTriggersSchema = z.object({
  complaint_rate: z.number().min(0).max(1),
  undelivered_rate: z.number().min(0).max(1),
});

export const WhatsAppPolicySchema = z.object({
  mode: z.enum(['click_to_wa', 'waba', 'hybrid']),
  sender_pools: z.array(SenderPoolSchema),
  template_policy: z.object({
    require_approved_templates: z.boolean(),
    mix: TemplateMixSchema,
  }),
  stop_triggers: StopTriggersSchema,
  fallback_after_minutes: z.number().optional(),
});

export const ChannelConfigSchema = z.object({
  sender_pools: z.array(SenderPoolSchema),
});

export const ComplianceSchema = z.object({
  require_opt_in: z.boolean(),
  ad_label_required: z.boolean(),
  global_suppress_on_stop: z.boolean(),
  consent_ledger_fields: z.array(z.string()).optional(),
});

export const OrchestrationPolicySchema = z.object({
  channels: z.object({
    priority: ChannelPrioritySchema,
    quiet_hours: QuietHoursSchema,
    promo_cadence: PromoCadenceSchema,
  }),
  whatsapp: WhatsAppPolicySchema.optional(),
  telegram: ChannelConfigSchema.optional(),
  vk: ChannelConfigSchema.optional(),
  email: ChannelConfigSchema.optional(),
  sms: ChannelConfigSchema.optional(),
  compliance: ComplianceSchema,
});

export type OrchestrationPolicy = z.infer<typeof OrchestrationPolicySchema>;
export type SenderPool = z.infer<typeof SenderPoolSchema>;
export type WhatsAppPolicy = z.infer<typeof WhatsAppPolicySchema>;


import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { SuppressionsModule } from './modules/suppressions/suppressions.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { QueueModule } from './modules/queue/queue.module';
import { RedirectModule } from './modules/redirect/redirect.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TenantsModule,
    ContactsModule,
    ConsentsModule,
    SuppressionsModule,
    TemplatesModule,
    CampaignsModule,
    SegmentsModule,
    OrchestrationModule,
    WebhooksModule,
    QueueModule,
    RedirectModule,
  ],
})
export class AppModule {}


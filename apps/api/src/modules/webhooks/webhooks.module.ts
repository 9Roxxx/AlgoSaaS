import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [SuppressionsModule, ContactsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}


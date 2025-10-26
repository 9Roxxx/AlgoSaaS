import { Module } from '@nestjs/common';
import { HealthController } from './modules/health/health.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { TestController } from './modules/test/test.controller';
import { DemoController } from './modules/demo/demo.controller';
import { MessagesController } from './modules/messages/simple-messages.controller';

@Module({
  imports: [],
  controllers: [HealthController, AuthController, TestController, DemoController, MessagesController],
  providers: [AuthService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SmtpModule } from './smtp/smtp.module';

@Module({
  imports: [ConfigModule.forRoot(), SmtpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

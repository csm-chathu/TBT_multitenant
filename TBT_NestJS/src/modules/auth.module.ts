import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { LocalStrategy } from '../strategies/local.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { JWT_SECRET } from '../config/constants';
import { RealtimeService } from '../services/realtime.service';
import { PusherService } from '../services/pusher.service';
import { NotificationService } from '../services/notification.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { EmailService } from '../services/email.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserService,
    PusherService,
    RealtimeService,
    NotificationService,
    NotificationRepository,
    EmailService,
  ],
  exports: [EmailService],
})
export class AuthModule {} 
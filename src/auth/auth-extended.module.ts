import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthExtendedController } from './auth-extended.controller';
import { AuthExtendedService } from './auth-extended.service';
import { AuthModule } from './auth.module';
import { Customer } from '../entities/customer.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { Otp } from '../entities/otp.entity';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([
      Customer,
      PasswordReset,
      Otp,
    ]),
  ],
  controllers: [AuthExtendedController],
  providers: [AuthExtendedService],
  exports: [AuthExtendedService],
})
export class AuthExtendedModule {}

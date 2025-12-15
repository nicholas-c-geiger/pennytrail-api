import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VerifyJwtGuard } from '../auth/verify-jwt.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, VerifyJwtGuard],
  exports: [UsersService], // export if other modules need it
})
export class UsersModule {}

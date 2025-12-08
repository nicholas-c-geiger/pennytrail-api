import {
  Controller,
  Get,
  UseGuards,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  HttpCode,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
// Create is handled via PUT/:id (client-provided id) — DTO import removed from controller
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, description: 'List of users', type: User, isArray: true })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Returns user profile.', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'if-none-match',
    required: false,
    description: 'Use "*" to indicate create-only (optional).',
  })
  @ApiExtraModels(CreateUserDto, UpdateUserDto)
  @ApiBody({
    description:
      'When creating a user with client-chosen id send CreateUserDto with header `if-none-match: *`. Otherwise send UpdateUserDto for partial updates.',
    schema: {
      oneOf: [{ $ref: getSchemaPath(CreateUserDto) }, { $ref: getSchemaPath(UpdateUserDto) }],
    },
  })
  @ApiOperation({ summary: 'Add or update a user' })
  @ApiResponse({ status: 200, description: 'User updated.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() raw: UpdateUserDto,
    @Headers('if-none-match') ifNoneMatch?: string
  ): Promise<User> {
    const createOnly = ifNoneMatch === '*';

    if (createOnly) {
      const dto = plainToInstance(CreateUserDto, (raw ?? {}) as Record<string, unknown>);
      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed');
      }
      const updateDto: UpdateUserDto = { name: dto.name } as UpdateUserDto;
      return this.usersService.update(id, updateDto, true);
    }

    const updateDto: UpdateUserDto = raw as UpdateUserDto;
    return this.usersService.update(id, updateDto, false);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a user' })
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'User deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}

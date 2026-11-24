import { Controller, Get, Post, Put, Delete, Param, Body, UsePipes, ValidationPipe, UseGuards, Req, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { BaseUserDto, UpdateUserDto } from '../dto/user/user.dto';
import * as bcrypt from 'bcrypt';
import { UserAttributes } from 'src/intertfaces/user.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getUser(@Req() req): Promise<UserAttributes> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    const user = await this.authService.getCurrentUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get('all')
  async findAll(): Promise<UserAttributes[]> {
    const users = await this.userService.findAll();
    return users.map(user => {
      // Always use .get({ plain: true }) if available, else fallback to user object
      const plainUser = typeof user.get === 'function' ? user.get({ plain: true }) : user;
      // Remove password property if it exists
      const { password, ...userData } = plainUser as Record<string, any>;
      return userData as UserAttributes;
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<UserAttributes> {
    const user = await this.userService.findOneById(id);
    if (!user) throw new Error('User not found');
    const { password, ...userData } = user.get({ plain: true });
    // Ensure 'id' is always present and not undefined
    if (userData.id === undefined) {
      throw new Error('User id is missing');
    }
    return userData as UserAttributes;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: BaseUserDto): Promise<UserAttributes> {
    const plainPassword = (createUserDto as any).password;
    if (!plainPassword) {
      throw new Error('Password is required');
    }
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const user = await this.userService.create({ ...createUserDto, password: hashedPassword });
    const { password, ...userData } = user.get({ plain: true });
    // Ensure 'id' is always present and not undefined
    if (userData.id === undefined) {
      throw new Error('User id is missing');
    }
    return userData as UserAttributes;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserAttributes> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    await this.userService.update(id, updateUserDto);
    const user = await this.userService.findOneById(id);
    if (!user) throw new Error('User not found');
    const { password, ...userData } = user.get({ plain: true });
    // Ensure 'id' is always present and not undefined
    if (userData.id === undefined) {
      throw new Error('User id is missing');
    }
    return userData as UserAttributes;
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Body('reason') reason?: string): Promise<{ deleted: boolean }> {
    // prefer using remove so we can store a delete reason when provided
    const removed = await this.userService.remove(id, reason);
    return { deleted: !!removed };
  }
} 
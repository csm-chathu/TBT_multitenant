import { Controller, Post, Body, Req, UseGuards, Get, NotFoundException, UnauthorizedException, Param, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags, ApiParam } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { FacebookAuthGuard } from '../guards/facebook-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAttributes } from '../intertfaces/user.interface';
import { LoginDto } from '../dto/auth/login.dto';
import { ForgotPasswordDto, ResetForgotPasswordDto } from '../dto/auth/forgot-password.dto';
import { ResetPasswordDto } from 'src/dto/auth/reset-password.dto';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
 
  constructor(private readonly authService: AuthService) {}
 
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto, description: 'User credentials payload' })
  async login(@Body() _loginDto: LoginDto, @Req() req) {
    return this.authService.login(req.user);
  }
 
  @Post('forgot-password')
  @ApiBody({ type: ForgotPasswordDto, description: 'Request password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message:
        'If an account matches that email, password reset instructions have been sent.',
    };
  }
 
  // Legacy-compatible endpoint name
  @Post('send-password-recovery-email')
  @ApiBody({ type: ForgotPasswordDto, description: 'Request password reset link' })
  async sendPasswordRecoveryEmail(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message:
        'If an account matches that email, password reset instructions have been sent.',
    };
  }
 
  @Get('validate-reset-token/:token')
  @ApiParam({ name: 'token', description: 'Password reset token' })
  async validateResetToken(@Param('token') token: string) {
    const isValid = await this.authService.validateResetToken(token);
    return {
      valid: isValid,
    };
  }
 
  @Post('reset-forgot-password')
  @ApiBody({ type: ResetForgotPasswordDto, description: 'Reset password using token' })
  async resetPassword(@Body() dto: ResetForgotPasswordDto) {
    const success = await this.authService.resetPasswordWithToken(dto.token, dto.password);
    if (!success) {
      throw new BadRequestException('Invalid or expired token');
    }
    return { success: true, message: 'Password has been reset successfully.' };
  }
 
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}
 
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req) {
    return this.authService.login(req.user);
  }
 
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {}
 
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthRedirect(@Req() req) {
    return this.authService.login(req.user);
  }
 
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  async getCurrentUser(@Req() req): Promise<UserAttributes> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    const user = await this.authService.getCurrentUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Include numeric `user_id` field for frontend compatibility
    const userWithId: UserAttributes = {
      ...user,
      user_id: Number(user.id ?? userId),
    };
    return userWithId;
  }
 
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto, description: 'Old and new password payload' })
  async resetCurrentPassword(@Req() req, @Body() dto: ResetPasswordDto) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
 
    this.logger.log(`Password reset request for user ${userId}`, 'AuthController');
    try {
      const result = await this.authService.resetCurrentPassword(
        userId,
        dto.oldPassword,
        dto.newPassword,
      );
      this.logger.log(`Password reset success for user ${userId}`, 'AuthController');
      return result;
    } catch (err: any) {
      this.logger.error(`Password reset failed for user ${userId}`, err?.stack, 'AuthController');
      throw err;
    }
  }
}
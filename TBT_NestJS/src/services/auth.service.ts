import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../models/user';
import { Role } from '../models/role';
import { UserAttributes } from '../intertfaces/user.interface';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    // Compare password
    const userData = user.get({ plain: true });
    if (!userData.password) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return null;
    }
    // Return user object without password
    const { password: _password, ...userWithoutPassword } = userData;
    return userWithoutPassword;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    // Remove password from user object before sending to frontend
    const { password, ...userWithoutPassword } = user;
    const result = {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };

    return result;
  }

  /**
   * Initiates password recovery for a user. Mirrors legacy Sails behavior:
   * - Silently succeeds even if the email does not exist
   * - Generates a random token and expiry
   * - Persists token on the user record
   * - Sends reset instructions via email
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    // Don't reveal whether the user exists
    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('base64url');
    const ttlMs =
      Number(this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL') || 0) || 1000 * 60 * 60; // default 1h

    await User.update(
      {
        passwordResetToken: token,
        passwordResetTokenExpiresAt: Date.now() + ttlMs,
      },
      { where: { id: user.id } },
    );

    try {
      await this.emailService.sendPasswordResetEmail({
        to: email,
        fullName: user.get('name'),
        token,
        baseUrl: this.configService.get<string>('CORS_ORIGIN'),
      });
    } catch (err) {
      // Do not leak email send failures to the client; log for operators.
      this.logger.warn(`Password reset email send failed: ${err?.message || err}`);
    }
  }


  /**
   * Validates a password reset token
   * Checks if:
   * 1. Token exists in database
   * 2. Token hasn't expired
   * 3. User exists for that token
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      if (!token || token.trim() === '') {
        return false;
      }

      const user = await User.findOne({
        where: {
          passwordResetToken: token,
        },
      });

      if (!user) {
        this.logger.warn(`Password reset token not found: ${token.substring(0, 8)}...`);
        return false;
      }

      const userData = user.get({ plain: true });
      const expiresAt = userData.passwordResetTokenExpiresAt;

      if (!expiresAt) {
        this.logger.warn(`Password reset token has no expiry for user: ${userData.id}`);
        return false;
      }

      // Check if token has expired
      const now = Date.now();
      if (now > expiresAt) {
        this.logger.warn(`Password reset token expired for user: ${userData.id}`);
        return false;
      }

      // Token is valid
      this.logger.log(`Password reset token validated successfully for user: ${userData.id}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error validating reset token: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Resets password if token is valid; clears reset token afterwards.
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    try {
      if (!token || token.trim() === '') {
        return false;
      }

      const user = await User.findOne({
        where: {
          passwordResetToken: token,
        },
      });

      if (!user) {
        this.logger.warn(`Password reset token not found: ${token.substring(0, 8)}...`);
        return false;
      }

      const userData = user.get({ plain: true });
      const expiresAt = userData.passwordResetTokenExpiresAt;

      if (!expiresAt) {
        this.logger.warn(`Password reset token has no expiry for user: ${userData.id}`);
        return false;
      }

      const now = Date.now();
      if (now > expiresAt) {
        this.logger.warn(`Password reset token expired for user: ${userData.id}`);
        return false;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.update(
        {
          password: hashedPassword,
          // clear reset token fields after successful reset
          passwordResetToken: undefined,
          passwordResetTokenExpiresAt: undefined,
          isPasswordSet: true,
        },
        { where: { id: userData.id } },
      );

      this.logger.log(`Password reset successfully for user: ${userData.id}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error resetting password: ${error.message}`, error.stack);
      return false;
    }
  }

  async getCurrentUser(userId: number): Promise<UserAttributes | null> {
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }, // Exclude join table attributes
        attributes: ['id', 'name', 'label']
      }]
    });
    if (!user) {
      return null;
    }
    const { password, ...userData } = user.get({ plain: true });
    return userData as UserAttributes;
  }

  async resetCurrentPassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userData = user.get({ plain: true });
    if (!userData.password) {
      throw new BadRequestException('User does not have a password set');
    }

    const isMatch = await bcrypt.compare(oldPassword, userData.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.isPasswordSet = true;
    await user.save();

    return { success: true };
  }
} 
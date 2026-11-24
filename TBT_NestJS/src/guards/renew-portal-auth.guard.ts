import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthKey } from '../models/auth_key';

@Injectable()
export class RenewPortalAuthGuard implements CanActivate {
  private readonly logger = new Logger(RenewPortalAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract private key from headers
    // Supports: x-api-key, x-private-key, x-renew-key, or Authorization: Bearer <key>
    const headerKey =
      request.headers['x-api-key'] ||
      request.headers['x-private-key'] ||
      request.headers['x-renew-key'];

    let providedKey =
      typeof headerKey === 'string' ? headerKey.trim() : undefined;

    if (!providedKey) {
      const authHeader = request.headers['authorization'];
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.slice(7).trim();
      }
    }

    if (!providedKey) {
      this.logger.warn(
        'Access denied to Renew Portal endpoint: Missing private key in request headers',
      );
      throw new UnauthorizedException(
        'Missing private key. Please provide your private key in the "x-api-key" header or as "Authorization: Bearer <key>".',
      );
    }

    // 1. Check against environment variable (RENEW_PORTAL_PRIVATE_KEY or RENEW_PORTAL_API_KEY)
    const envKey =
      process.env.RENEW_PORTAL_PRIVATE_KEY ||
      process.env.RENEW_PORTAL_API_KEY;

    if (envKey && providedKey === envKey.trim()) {
      return true;
    }

    // 2. Check against active keys in database auth_keys table
    try {
      const activeKey = await AuthKey.findOne({
        where: { secret_key: providedKey, status: true },
      });
      if (activeKey) {
        return true;
      }
    } catch (e: any) {
      this.logger.error(
        `Error verifying key against auth_keys table: ${e?.message || e}`,
      );
    }

    this.logger.warn(
      'Access denied to Renew Portal endpoint: Invalid private key provided',
    );
    throw new UnauthorizedException('Invalid private key provided.');
  }
}

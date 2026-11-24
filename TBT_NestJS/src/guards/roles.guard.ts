import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../models/user';
import { Role } from '../models/role';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) throw new ForbiddenException('Not authenticated');

    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'roles' }],
    });

    if (!user) throw new ForbiddenException('User not found');

    const userRoleNames: string[] = ((user as any).roles || []).map((r: Role) => r.name);
    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}

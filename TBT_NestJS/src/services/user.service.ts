import { Injectable } from '@nestjs/common';
import { User } from '../models/user';

@Injectable()
export class UserService {
  async findAll(): Promise<User[]> {
    return User.findAll();
  }

  async findOneById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async create(userData: any): Promise<User> {
    return User.create(userData);
  }

  async update(id: number, updateData: any): Promise<[number, User[]]> {
    return User.update(updateData, { where: { id }, returning: true });
  }

  async delete(id: number): Promise<number> {
    // Use paranoid soft-delete: find instance, optionally set deletedReason, then destroy()
    const user = await User.findByPk(id);
    if (!user) return 0;
    try {
      // If caller passed reason via service layer in future, they should call remove with reason.
    } catch (err) {
      // ignore
    }
    await (user as any).destroy();
    return 1;
  }

  async remove(id: number, reason?: string): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    if (reason) {
      try {
        await (user as any).update({ deletedReason: reason });
      } catch (err) {
        // ignore update error and proceed to destroy
      }
    }
    await (user as any).destroy();
    return user;
  }
} 
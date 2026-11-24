import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { UserController } from 'src/controllers/user.controller';
import { UserService } from 'src/services/user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { BaseUserDto } from 'src/dto/user/user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUserService = {
  findAll: jest.fn(),
  findOneById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const makeUser = (plain: Record<string, any>) => ({
  get: jest.fn(() => plain),
});

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('lists users and strips password when get available', async () => {
    mockUserService.findAll.mockResolvedValue([
      makeUser({ id: 1, email: 'a@b.com', password: 'secret' }),
    ]);

    const result = await controller.findAll();
    expect(result).toEqual([{ id: 1, email: 'a@b.com' }]);
  });

  it('lists users handling plain objects', async () => {
    mockUserService.findAll.mockResolvedValue([
      { id: 2, email: 'plain', password: 'hidden' },
    ]);

    const result = await controller.findAll();
    expect(result).toEqual([{ id: 2, email: 'plain' }]);
  });

  it('returns a single user', async () => {
    const user = makeUser({ id: 3, email: 'c@d.com', password: 'secret' });
    mockUserService.findOneById.mockResolvedValue(user);

    const result = await controller.findOne(3 as any);
    expect(result).toEqual({ id: 3, email: 'c@d.com' });
  });

  it('throws when user not found', async () => {
    mockUserService.findOneById.mockResolvedValue(null);

    await expect(controller.findOne(3 as any)).rejects.toThrow('User not found');
  });

  it('throws when created user lacks id', async () => {
    mockUserService.findOneById.mockResolvedValue(makeUser({ id: undefined }));

    await expect(controller.findOne(3 as any)).rejects.toThrow('User id is missing');
  });

  it('creates user hashing password', async () => {
    const created = makeUser({ id: 5, email: 'e@f.com', password: 'hashed' });
    mockUserService.create.mockResolvedValue(created);

    const result = await controller.create({ email: 'e@f.com', password: 'plain' } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
    expect(mockUserService.create).toHaveBeenCalledWith({ email: 'e@f.com', password: 'hashed' });
    expect(result).toEqual({ id: 5, email: 'e@f.com' });
  });

  it('throws on create when password missing', async () => {
    await expect(controller.create({ email: 'x@x.com' } as any)).rejects.toThrow('Password is required');
  });

  it('updates user hashing password when provided', async () => {
    mockUserService.update.mockResolvedValue(undefined);
    mockUserService.findOneById.mockResolvedValue(makeUser({ id: 7, email: 'new', password: 'hashed' }));

    const result = await controller.update(7 as any, { password: 'updated' } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('updated', 10);
    expect(mockUserService.update).toHaveBeenCalledWith(7, { password: 'hashed' });
    expect(result).toEqual({ id: 7, email: 'new' });
  });

  it('throws when updated user not found', async () => {
    mockUserService.update.mockResolvedValue(undefined);
    mockUserService.findOneById.mockResolvedValue(undefined);

    await expect(controller.update(7 as any, {} as any)).rejects.toThrow('User not found');
  });

  it('deletes user and returns boolean flag', async () => {
    mockUserService.delete.mockResolvedValue(1);

    await expect(controller.delete(9 as any)).resolves.toEqual({ deleted: true });
    expect(mockUserService.delete).toHaveBeenCalledWith(9);
  });

  it('returns false deleted flag when removal unsuccessful', async () => {
    mockUserService.delete.mockResolvedValue(0);

    await expect(controller.delete(9 as any)).resolves.toEqual({ deleted: false });
  });

  describe('email validation', () => {
    const validationMetadata: ArgumentMetadata = { type: 'body', metatype: BaseUserDto };
    const basePayload = {
      status: 'ACTIVE',
      hash: 'sample-hash',
      password: 'plain-text-password',
    };
    const invalidEmails = [
      'plainaddress',
      '@missing-local.com',
      'user@.invalid.com',
      'user@domain..com',
      'user@@domain.com',
    ];
    const validEmails = [
      'primary.user@example.com',
      'support+alerts@tbt.io',
      'first.last@company.co.uk',
    ];
    let validationPipe: ValidationPipe;

    beforeEach(() => {
      validationPipe = new ValidationPipe();
    });

    it.each(invalidEmails)('rejects invalid email "%s"', async invalidEmail => {
      await expect(
        validationPipe.transform({ ...basePayload, email: invalidEmail }, validationMetadata),
      ).rejects.toThrow(BadRequestException);
    });

    it.each(validEmails)('accepts valid email "%s"', async validEmail => {
      await expect(
        validationPipe.transform({ ...basePayload, email: validEmail }, validationMetadata),
      ).resolves.toEqual(expect.objectContaining({ email: validEmail }));
    });
  });
});

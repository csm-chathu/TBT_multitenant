import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { GoogleAuthGuard } from 'src/guards/google-auth.guard';
import { FacebookAuthGuard } from 'src/guards/facebook-auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockAuthService = {
  login: jest.fn(),
  getCurrentUser: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GoogleAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(FacebookAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('logs in with local strategy', async () => {
    mockAuthService.login.mockResolvedValue({ token: 'jwt' });

    await expect(controller.login({ user: { id: 1 } })).resolves.toEqual({ token: 'jwt' });
    expect(mockAuthService.login).toHaveBeenCalledWith({ id: 1 });
  });

  it('handles google auth callback', async () => {
    mockAuthService.login.mockResolvedValue({ token: 'google' });

    await expect(controller.googleAuthRedirect({ user: { id: 2 } })).resolves.toEqual({ token: 'google' });
    expect(mockAuthService.login).toHaveBeenCalledWith({ id: 2 });
  });

  it('handles facebook auth callback', async () => {
    mockAuthService.login.mockResolvedValue({ token: 'fb' });

    await expect(controller.facebookAuthRedirect({ user: { id: 3 } })).resolves.toEqual({ token: 'fb' });
    expect(mockAuthService.login).toHaveBeenCalledWith({ id: 3 });
  });

  it('returns current user when available', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue({ id: 1 });

    await expect(controller.getCurrentUser({ user: { userId: 1 } })).resolves.toEqual({ id: 1 });
    expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(1);
  });

  it('throws Unauthorized when token missing userId', async () => {
    await expect(controller.getCurrentUser({ user: {} })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws NotFound when user not located', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(undefined);

    await expect(controller.getCurrentUser({ user: { userId: 1 } })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

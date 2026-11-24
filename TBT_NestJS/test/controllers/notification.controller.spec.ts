import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from 'src/controllers/notification.controller';
import { NotificationService } from 'src/services/notification.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockService = {
  listRecent: jest.fn(),
};

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    jest.clearAllMocks();
  });

  it('returns default payload when userId missing', async () => {
    await expect(controller.list()).resolves.toEqual({ notifications: [], errors: [], id: 1 });
    expect(mockService.listRecent).not.toHaveBeenCalled();
  });

  it('returns default payload when userId invalid', async () => {
    await expect(controller.list('abc')).resolves.toEqual({ notifications: [], errors: [], id: 1 });
    expect(mockService.listRecent).not.toHaveBeenCalled();
  });

  it('returns notifications for valid userId', async () => {
    const notifications = [{ id: 1 } as any];
    mockService.listRecent.mockResolvedValue(notifications);

    await expect(controller.list('42')).resolves.toEqual({ notifications, errors: [], id: 1 });
    expect(mockService.listRecent).toHaveBeenCalledWith(42);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationController } from 'src/controllers/application.controller';
import { ApplicationService } from 'src/services/application.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockApplicationService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ApplicationController', () => {
  let controller: ApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [{ provide: ApplicationService, useValue: mockApplicationService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApplicationController>(ApplicationController);
    jest.clearAllMocks();
  });

  it('should return all applications', async () => {
    const apps = [{ id: 1 } as any];
    mockApplicationService.findAll.mockResolvedValue(apps);

    await expect(controller.findAll()).resolves.toBe(apps);
    expect(mockApplicationService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return a single application when found', async () => {
    const app = { id: 2 } as any;
    mockApplicationService.findOne.mockResolvedValue(app);

    await expect(controller.findOne(2)).resolves.toBe(app);
    expect(mockApplicationService.findOne).toHaveBeenCalledWith(2);
  });

  it('should throw NotFound when application missing', async () => {
    mockApplicationService.findOne.mockResolvedValue(undefined);

    await expect(controller.findOne(10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should create new application', async () => {
    const dto = { name: 'App' } as any;
    const created = { id: 3, ...dto } as any;
    mockApplicationService.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toBe(created);
    expect(mockApplicationService.create).toHaveBeenCalledWith(dto);
  });

  it('should update application', async () => {
    const dto = { description: 'Updated' } as any;
    const updated = { id: 9, ...dto } as any;
    mockApplicationService.update.mockResolvedValue(updated);

    await expect(controller.update(9, dto)).resolves.toBe(updated);
    expect(mockApplicationService.update).toHaveBeenCalledWith(9, dto);
  });

  it('should remove application', async () => {
    mockApplicationService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(4)).resolves.toEqual({ deleted: true });
    expect(mockApplicationService.remove).toHaveBeenCalledWith(4);
  });
});

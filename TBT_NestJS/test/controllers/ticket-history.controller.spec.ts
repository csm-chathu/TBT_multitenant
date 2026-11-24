import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TicketHistoryController } from 'src/controllers/ticket-history.controller';
import { TicketHistoryService } from 'src/services/ticket-history.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('TicketHistoryController', () => {
  let controller: TicketHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketHistoryController],
      providers: [{ provide: TicketHistoryService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketHistoryController>(TicketHistoryController);
    jest.clearAllMocks();
  });

  it('should list history records', async () => {
    const history = [{ id: 1 } as any];
    mockService.findAll.mockResolvedValue(history);

    await expect(controller.findAll()).resolves.toBe(history);
  });

  it('should get history by id', async () => {
    const record = { id: 2 } as any;
    mockService.findOne.mockResolvedValue(record);

    await expect(controller.findOne(2)).resolves.toBe(record);
    expect(mockService.findOne).toHaveBeenCalledWith(2);
  });

  it('should throw when history missing', async () => {
    mockService.findOne.mockResolvedValue(undefined);

    await expect(controller.findOne(9)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should create history record', async () => {
    const dto = { ticket_id: 1 } as any;
    const created = { id: 3 } as any;
    mockService.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toBe(created);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('should update history record', async () => {
    const dto = { changes: 'Updated' } as any;
    const updated = { id: 4 } as any;
    mockService.update.mockResolvedValue(updated);

    await expect(controller.update(4, dto)).resolves.toBe(updated);
    expect(mockService.update).toHaveBeenCalledWith(4, dto);
  });

  it('should remove history record', async () => {
    mockService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(5)).resolves.toEqual({ deleted: true });
    expect(mockService.remove).toHaveBeenCalledWith(5);
  });
});

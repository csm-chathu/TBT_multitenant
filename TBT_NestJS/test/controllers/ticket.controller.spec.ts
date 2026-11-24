import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TicketController } from 'src/controllers/ticket.controller';
import { TicketService } from 'src/services/ticket.service';
import { AgentService } from 'src/services/agent.service';
import { ApplicationService } from 'src/services/application.service';
import { InventoryItemLocationService } from 'src/services/inventory-item-location.service';
import { InventoryItemService } from 'src/services/inventory-item.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockTicketService = {
  findAll: jest.fn(),
  findAllEnriched: jest.fn(),
  findOneEnriched: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  createWithFiles: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAgentService = { findAll: jest.fn() };
const mockApplicationService = { findAll: jest.fn() };
const mockInventoryItemLocationService = { findAll: jest.fn() };
const mockInventoryItemService = { findAll: jest.fn() };

describe('TicketController', () => {
  let controller: TicketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        { provide: TicketService, useValue: mockTicketService },
        { provide: AgentService, useValue: mockAgentService },
        { provide: ApplicationService, useValue: mockApplicationService },
        { provide: InventoryItemLocationService, useValue: mockInventoryItemLocationService },
        { provide: InventoryItemService, useValue: mockInventoryItemService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketController>(TicketController);
    jest.clearAllMocks();
  });

  it('should list tickets with optional filters', async () => {
    const tickets = [{ id: 1 } as any];
    mockTicketService.findAll.mockResolvedValue(tickets);

    await expect(controller.findAll({ startDate: '2024-01-01', endDate: '2024-01-31' })).resolves.toBe(
      tickets,
    );
    expect(mockTicketService.findAll).toHaveBeenCalledWith(
      '2024-01-01',
      '2024-01-31',
      ...Array(14).fill(undefined)
    );
  });

  it('should list tickets without filters', async () => {
    mockTicketService.findAll.mockResolvedValue([]);

    await expect(controller.findAll({})).resolves.toEqual([]);
    expect(mockTicketService.findAll).toHaveBeenCalledWith(...Array(16).fill(undefined));
  });

  it('should list enriched tickets', async () => {
    const enriched = [{ id: 3 } as any];
    mockTicketService.findAllEnriched.mockResolvedValue(enriched);

    await expect(controller.findAllEnriched({})).resolves.toBe(enriched);
    expect(mockTicketService.findAllEnriched).toHaveBeenCalledWith(
      ...Array(12).fill(undefined),
    );
  });

  it('should get enriched ticket by id', async () => {
    const enriched = { id: 4 } as any;
    mockTicketService.findOneEnriched.mockResolvedValue(enriched);

    await expect(controller.findOneEnriched(4)).resolves.toBe(enriched);
    expect(mockTicketService.findOneEnriched).toHaveBeenCalledWith(4);
  });

  it('should throw when enriched ticket not found', async () => {
    mockTicketService.findOneEnriched.mockResolvedValue(null);

    await expect(controller.findOneEnriched(9)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should get ticket by id', async () => {
    const ticket = { id: 5 } as any;
    mockTicketService.findOne.mockResolvedValue(ticket);

    await expect(controller.findOne(5)).resolves.toBe(ticket);
    expect(mockTicketService.findOne).toHaveBeenCalledWith(5);
  });

  it('should throw when ticket not found', async () => {
    mockTicketService.findOne.mockResolvedValue(undefined);

    await expect(controller.findOne(20)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should create ticket', async () => {
    const dto = { subject: 'Issue' } as any;
    const created = { id: 10 } as any;
    mockTicketService.create.mockResolvedValue(created);

    await expect(controller.create(dto, { user: { userId: 1 } })).resolves.toBe(created);
    expect(mockTicketService.create).toHaveBeenCalledWith(dto, 1);
  });

  it('should create ticket with files', async () => {
    const dto = { subject: 'Issue' } as any;
    const files = [{ originalname: 'file.txt' }] as any;
    const created = { id: 11 } as any;
    mockTicketService.createWithFiles.mockResolvedValue(created);

    await expect(controller.createWithFiles(dto, files, { user: { userId: 1 } })).resolves.toBe(created);
    expect(mockTicketService.createWithFiles).toHaveBeenCalledWith(dto, files, 1);
  });

  it('should update ticket', async () => {
    const dto = { status: 'closed' } as any;
    const updated = { id: 12 } as any;
    mockTicketService.update.mockResolvedValue(updated);

    await expect(controller.update(12, dto, { user: { userId: 1 } })).resolves.toBe(updated);
    expect(mockTicketService.update).toHaveBeenCalledWith(12, dto, 1);
  });

  it('should remove ticket', async () => {
    mockTicketService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(8)).resolves.toEqual({ deleted: true });
    expect(mockTicketService.remove).toHaveBeenCalledWith(8);
  });

  it('should pass sorting parameters to findAll', async () => {
    const tickets = [{ id: 1 } as any];
    mockTicketService.findAll.mockResolvedValue(tickets);

    await expect(controller.findAll({ sortBy: 'id', sortOrder: 'asc' })).resolves.toBe(tickets);
    expect(mockTicketService.findAll).toHaveBeenCalledWith(
      ...Array(10).fill(undefined),
      'id',
      'asc',
      ...Array(4).fill(undefined)
    );
  });

  it('should pass sorting parameters to findAllEnriched', async () => {
    const enriched = [{ id: 3 } as any];
    mockTicketService.findAllEnriched.mockResolvedValue(enriched);

    await expect(controller.findAllEnriched({ sortBy: 'priority', sortOrder: 'desc' })).resolves.toBe(enriched);
    expect(mockTicketService.findAllEnriched).toHaveBeenCalledWith(
      ...Array(10).fill(undefined),
      'priority',
      'desc'
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TicketCommentController } from 'src/controllers/ticket-comment.controller';
import { TicketCommentService } from 'src/services/ticket-comment.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockService = {
  listForTicket: jest.fn(),
  addForTicket: jest.fn(),
};

describe('TicketCommentController', () => {
  let controller: TicketCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketCommentController],
      providers: [{ provide: TicketCommentService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketCommentController>(TicketCommentController);
    jest.clearAllMocks();
  });

  it('lists comments for ticket', async () => {
    const comments = [{ id: 1 } as any];
    mockService.listForTicket.mockResolvedValue(comments);

    await expect(controller.list(5)).resolves.toBe(comments);
    expect(mockService.listForTicket).toHaveBeenCalledWith(5);
  });

  it('adds comment for ticket', async () => {
    const dto = { comment: 'Hello' } as any;
    const req = { user: { userId: 10 } } as any;
    const saved = { id: 2 } as any;
    mockService.addForTicket.mockResolvedValue(saved);

    await expect(controller.create(7, dto, req)).resolves.toBe(saved);
    expect(dto.from).toBe(10);
    expect(mockService.addForTicket).toHaveBeenCalledWith(7, dto, undefined);
  });

  it('adds comment for ticket with files', async () => {
    const dto = { comment: 'Hello' } as any;
    const req = { user: { userId: 10 } } as any;
    const files = [{ originalname: 'test.jpg' }] as any[];
    const saved = { id: 3 } as any;
    mockService.addForTicket.mockResolvedValue(saved);

    await expect(controller.create(7, dto, req, files)).resolves.toBe(saved);
    expect(mockService.addForTicket).toHaveBeenCalledWith(7, dto, files);
  });
});


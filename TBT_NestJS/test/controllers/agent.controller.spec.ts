import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AgentController } from 'src/controllers/agent.controller';
import { AgentService } from 'src/services/agent.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockAgentService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  assignTeam: jest.fn(),
};

describe('AgentController', () => {
  let controller: AgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [{ provide: AgentService, useValue: mockAgentService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AgentController>(AgentController);
    jest.clearAllMocks();
  });

  it('should delegate findAll to service', async () => {
    const agents = [{ id: 1 } as any];
    mockAgentService.findAll.mockResolvedValue(agents);

    await expect(controller.findAll()).resolves.toBe(agents);
    expect(mockAgentService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return a single agent when found', async () => {
    const agent = { id: 1 } as any;
    mockAgentService.findOne.mockResolvedValue(agent);

    await expect(controller.findOne(1)).resolves.toBe(agent);
    expect(mockAgentService.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw when agent not found', async () => {
    mockAgentService.findOne.mockResolvedValue(undefined);

    await expect(controller.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should create a new agent', async () => {
    const dto = { name: 'Agent Smith' } as any;
    const created = { id: 11, ...dto } as any;
    mockAgentService.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toBe(created);
    expect(mockAgentService.create).toHaveBeenCalledWith(dto);
  });

  it('should update an agent', async () => {
    const dto = { name: 'Updated' } as any;
    const updated = { id: 7, ...dto } as any;
    mockAgentService.update.mockResolvedValue(updated);

    await expect(controller.update(7, dto)).resolves.toBe(updated);
    expect(mockAgentService.update).toHaveBeenCalledWith(7, dto);
  });

  it('should remove an agent', async () => {
    mockAgentService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(4)).resolves.toEqual({ deleted: true });
    expect(mockAgentService.remove).toHaveBeenCalledWith(4);
  });

  it('should assign a team to an agent', async () => {
    const payload = { team_id: 3 } as any;
    const result = { id: 1 } as any;
    mockAgentService.assignTeam.mockResolvedValue(result);

    await expect(controller.assignTeam(5, payload)).resolves.toBe(result);
    expect(mockAgentService.assignTeam).toHaveBeenCalledWith(5, payload);
  });
});

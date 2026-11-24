import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentMetadata, BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { TeamController } from 'src/controllers/team.controller';
import { TeamService } from 'src/services/team.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { BaseTeamDto } from 'src/dto/team/team.dto';

const mockTeamService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  createWithAgents: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('TeamController', () => {
  let controller: TeamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [{ provide: TeamService, useValue: mockTeamService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TeamController>(TeamController);
    jest.clearAllMocks();
  });

  it('should return all teams', async () => {
    const teams = [{ id: 1 } as any];
    mockTeamService.findAll.mockResolvedValue(teams);

    await expect(controller.findAll()).resolves.toBe(teams);
    expect(mockTeamService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return one team', async () => {
    const team = { id: 2 } as any;
    mockTeamService.findOne.mockResolvedValue(team);

    await expect(controller.findOne(2)).resolves.toBe(team);
    expect(mockTeamService.findOne).toHaveBeenCalledWith(2);
  });

  it('should throw NotFound when team missing', async () => {
    mockTeamService.findOne.mockResolvedValue(null);

    await expect(controller.findOne(9)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should create a team', async () => {
    const dto = { name: 'Team' } as any;
    const created = { id: 5 } as any;
    mockTeamService.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toBe(created);
    expect(mockTeamService.create).toHaveBeenCalledWith(dto);
  });

  it('should create a team with agents', async () => {
    const dto = { name: 'Team', agents: [] } as any;
    const created = { id: 6 } as any;
    mockTeamService.createWithAgents.mockResolvedValue(created);

    await expect(controller.createWithAgents(dto)).resolves.toBe(created);
    expect(mockTeamService.createWithAgents).toHaveBeenCalledWith(dto);
  });

  it('should throw error when createWithAgents fails', async () => {
    const dto = { name: 'Team', agents: [] } as any;
    mockTeamService.createWithAgents.mockResolvedValue(undefined);

    await expect(controller.createWithAgents(dto)).rejects.toThrow('Failed to create team with agents');
  });

  it('should update a team', async () => {
    const dto = { description: 'updated' } as any;
    const updated = { id: 7 } as any;
    mockTeamService.update.mockResolvedValue(updated);

    await expect(controller.update(7, dto)).resolves.toBe(updated);
    expect(mockTeamService.update).toHaveBeenCalledWith(7, dto);
  });

  it('should remove a team', async () => {
    mockTeamService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(4)).resolves.toEqual({ deleted: true });
    expect(mockTeamService.remove).toHaveBeenCalledWith(4);
  });

  describe('email validation', () => {
    const metadata: ArgumentMetadata = { type: 'body', metatype: BaseTeamDto };
    const basePayload = {
      name: 'Support Team',
      status: 'ACTIVE',
      hash: 'support-hash',
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

    it.each(invalidEmails)('rejects invalid team email "%s"', async invalidEmail => {
      await expect(
        validationPipe.transform({ ...basePayload, email: invalidEmail }, metadata),
      ).rejects.toThrow(BadRequestException);
    });

    it.each(validEmails)('accepts valid team email "%s"', async validEmail => {
      await expect(
        validationPipe.transform({ ...basePayload, email: validEmail }, metadata),
      ).resolves.toEqual(expect.objectContaining({ email: validEmail }));
    });
  });
});

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseTeamDto, UpdateTeamDto, CreateTeamWithAgentsDto } from '../dto/team/team.dto';
import { TeamService } from 'src/services/team.service';
import { AgentService } from 'src/services/agent.service';
import { ApplicationService } from 'src/services/application.service';
import { TeamAttributes } from 'src/intertfaces/team.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
    private readonly agentService: AgentService,
    private readonly applicationService: ApplicationService,
  ) {}

  // GET /teams/create - Get form data for team creation
  @Get('create')
  async getCreateFormData() {
    const [agents, applications] = await Promise.all([
      this.agentService.findAll(),
      this.applicationService.findAll(),
    ]);

    return {
      agents,
      applications,
    };
  }

  // GET /teams/edit/:id - Get form data + selected team data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [agents, applications, team] = await Promise.all([
      this.agentService.findAll(),
      this.applicationService.findAll(),
      this.teamService.findOne(id),
    ]);

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return {
      agents,
      applications,
      selectedTeam: team,
    };
  }

  @Get()
  async findAll(): Promise<TeamAttributes[]> {
    return this.teamService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeamAttributes> {
    const team = await this.teamService.findOne(id);
    if (!team) {
      throw new NotFoundException(`team with ID ${id} not found`);
    }
    return team;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createTeamDto: BaseTeamDto): Promise<TeamAttributes> {
    return this.teamService.create(createTeamDto);
  }

  @Post('with-agents')
  @UsePipes(new ValidationPipe())
  async createWithAgents(@Body() createTeamDto: CreateTeamWithAgentsDto): Promise<TeamAttributes> {
    const result = await this.teamService.createWithAgents(createTeamDto);
    if (!result) {
      throw new Error('Failed to create team with agents');
    }
    return result;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<TeamAttributes> {
    return this.teamService.update(id, updateTeamDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ): Promise<{ deleted: boolean }> {
    try {
      await this.teamService.remove(id, reason);
      return { deleted: true };
    } catch (err: any) {
      const msg = err?.message || '';
      if (/not found/i.test(msg)) {
        throw new NotFoundException(msg);
      }
      if (/cannot be deleted|has assigned agents|assigned to/i.test(msg)) {
        throw new ConflictException(msg);
      }
      throw new InternalServerErrorException(msg);
    }
  }
}

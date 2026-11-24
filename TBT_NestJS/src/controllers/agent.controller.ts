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
import {  BaseAgentDto, UpdateAgentDto } from '../dto/agent/agent.dto';
import { AgentAttributes } from '../intertfaces/agent.interface';
import { AgentService } from '../services/agent.service';
import { CountryService } from '../services/country.service';
import { StateService } from '../services/state.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AssignTeamToAgentDto } from '../dto/team-agent/team-agent.dto';

@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
  ) {}

  // GET /agents/create - Get form data for agent creation
  @Get('create')
  async getCreateFormData() {
    const [countries, states] = await Promise.all([
      this.countryService.findAll(),
      this.stateService.findAll(),
    ]);

    return {
      countries,
      states,
    };
  }

  // GET /agents/edit/:id - Get form data + selected agent data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [countries, states, agent] = await Promise.all([
      this.countryService.findAll(),
      this.stateService.findAll(),
      this.agentService.findOne(id),
    ]);

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return {
      countries,
      states,
      selectedAgent: agent,
    };
  }

  @Get()
  async findAll(): Promise<AgentAttributes[]> {
    return this.agentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<AgentAttributes> {
    const agent = await this.agentService.findOne(+id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createAgentDto: BaseAgentDto,
  ): Promise<AgentAttributes> {
    return this.agentService.create(createAgentDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: number,
    @Body() updateAgentDto: UpdateAgentDto,
  ): Promise<AgentAttributes> {
    return this.agentService.update(id, updateAgentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Body('reason') reason?: string): Promise<{ deleted: boolean }> {
    try {
      await this.agentService.remove(id, reason);
      return { deleted: true };
    } catch (err: any) {
      const msg = err?.message || '';
      if (/not found/i.test(msg)) {
        throw new NotFoundException(msg);
      }
      if (/cannot be deleted|assigned to|has tickets/i.test(msg)) {
        throw new ConflictException(msg);
      }
      throw new InternalServerErrorException(msg);
    }
  }

  @Post(':id/teams')
  @UsePipes(new ValidationPipe())
  async assignTeam(
    @Param('id') id: number,
    @Body() body: AssignTeamToAgentDto,
  ) {
    return this.agentService.assignTeam(+id, body);
  }
}

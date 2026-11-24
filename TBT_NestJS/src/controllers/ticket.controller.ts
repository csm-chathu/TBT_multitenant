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
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Logger,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BaseTicketDto, UpdateTicketDto } from '../dto/ticket/ticket.dto';
import { EnrichedTicketResponseDto } from '../dto/ticket/enriched-ticket.dto';
import { CreateTicketWithFilesDto } from '../dto/ticket/create-ticket-with-files.dto';
import { CreatePublicTicketDto } from '../dto/ticket/public-ticket.dto';
import { CreateRenewPortalTicketDto } from '../dto/ticket/renew-portal-ticket.dto';
import { CreateZendeskTicketDto } from '../dto/ticket/zendesk-ticket.dto';
import { FilterTicketDto } from '../dto/ticket/filter-ticket.dto';
import { TicketService } from 'src/services/ticket.service';
import { TicketAttributes } from 'src/intertfaces/ticket.interface';
import { AgentService } from 'src/services/agent.service';
import { ApplicationService } from 'src/services/application.service';
import { InventoryItemLocationService } from 'src/services/inventory-item-location.service';
import { InventoryItemService } from 'src/services/inventory-item.service';
import { TICKET_PRIORITY } from 'src/config/ticket.constants';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RenewPortalAuthGuard } from '../guards/renew-portal-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { TicketActionType } from '../models';

// @UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(
    private readonly ticketService: TicketService,
    private readonly agentService: AgentService,
    private readonly applicationService: ApplicationService,
    private readonly inventoryItemLocationService: InventoryItemLocationService,
    private readonly inventoryItemService: InventoryItemService,
  ) {}

  // GET /tickets/public/track/:hash - Public view-only endpoint for ticket creator to track status
  @Get('public/track/:hash')
  async trackPublicTicket(@Param('hash') hash: string) {
    return this.ticketService.getPublicTicketTracking(hash);
  }

  // GET /tickets/public/:ticketRef/resources/:resourceId/download - Public redirect download
  @Get('public/:ticketRef/resources/:resourceId/download')
  async downloadPublicTicketResource(
    @Param('ticketRef') ticketRef: string,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Res() res: Response,
  ) {
    const downloadUrl = await this.ticketService.getPublicResourceDownloadUrl(ticketRef, resourceId);
    return res.redirect(downloadUrl);
  }

  // GET /tickets/public/options - Public endpoint to get form metadata for ticket creation
  @Get('public/options')
  async getPublicFormOptions() {
    const applications = await this.applicationService.findAll();
    return {
      applications: applications.map(app => ({
        id: app.id,
        name: app.name,
      })),
      priorities: [
        { value: 'Low', label: 'Low - Minor issue' },
        { value: 'Medium', label: 'Medium - Normal request' },
        { value: 'High', label: 'High - System impacted' },
        { value: 'Critical', label: 'Critical - System down' },
      ],
    };
  }

  // GET /tickets/counts - Lightweight counts by status & priority (replaces full ticket fetch for dashboard tiles)
  @Get('counts')
  async getTicketCounts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.ticketService.getTicketCounts(
      startDate,
      endDate,
      agentId ? Number(agentId) : undefined,
    );
  }

  // POST /tickets/public - Public ticket creation endpoint with optional file attachments
  @Post('public')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }
    },
  }))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPublic(
    @Body() createPublicTicketDto: CreatePublicTicketDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    this.logger.log(`Public ticket creation request for email: ${createPublicTicketDto.customer_email} with ${files?.length || 0} files`);
    return this.ticketService.createPublicTicket(createPublicTicketDto, files);
  }

  // POST /tickets/renew-portal or POST /tickets/renew
  @Post(['renew-portal', 'renew'])
  @UseGuards(RenewPortalAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async createFromRenewPortal(
    @Body() createRenewPortalTicketDto: CreateRenewPortalTicketDto,
  ) {
    this.logger.log(
      `Renew portal ticket request from ${createRenewPortalTicketDto.adminEmail} for ${createRenewPortalTicketDto.firstName} ${createRenewPortalTicketDto.lastName}`,
    );
    return this.ticketService.createRenewPortalTicket(createRenewPortalTicketDto);
  }

  // POST /tickets/zendesk or POST /tickets/zendesk-webhook (Public / Unauthenticated)
  @Post(['zendesk', 'zendesk-webhook', 'zendesk/webhook'])
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async createFromZendesk(
    @Body() createZendeskTicketDto: CreateZendeskTicketDto,
  ) {
    this.logger.log(
      `Zendesk ticket request for #${createZendeskTicketDto.ticket_id || 'N/A'}: "${createZendeskTicketDto.title || 'No Title'}" from ${createZendeskTicketDto.requester?.email || 'N/A'}`,
    );
    return this.ticketService.createZendeskTicket(createZendeskTicketDto);
  }

  // GET /tickets/create - Get form data for ticket creation
  @Get('create')
  async getCreateFormData() {
    const [agents, applications, locations, inventoryItems] = await Promise.all([
      this.agentService.findAll(),
      this.applicationService.findAll(),
      this.inventoryItemLocationService.findAll(),
      this.inventoryItemService.findAll(),
    ]);

    return {
      agents,
      applications,
      locations,
      inventoryItems,
      priorities: [
        { value: TICKET_PRIORITY.LOW, label: 'Low' },
        { value: TICKET_PRIORITY.MEDIUM, label: 'Medium' },
        { value: TICKET_PRIORITY.HIGH, label: 'High' },
        { value: TICKET_PRIORITY.CRITICAL, label: 'Critical' },
      ],
    };
  }

  // GET /tickets/edit/:id - Get form data + selected ticket data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [agents, applications, locations, inventoryItems, ticket, rawTicket] = await Promise.all([
      this.agentService.findAll(),
      this.applicationService.findAll(),
      this.inventoryItemLocationService.findAll(),
      this.inventoryItemService.findAll(),
      this.ticketService.findOneEnriched(id),
      this.ticketService.findOne(id),
    ]);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Get assigned agent ID and name from raw ticket data
    let assignedAgentId: number | undefined;
    let assignedAgentName: string | undefined;

    // Try to get agent_id from ticket or rawTicket
    const agentId = (rawTicket as any)?.agent_id || (ticket as any)?.agent_id || undefined;
    
    // Try to get agent from raw ticket (could be 'agent', 'Agent', or accessed via agent_id)
    const agent = rawTicket?.agent || rawTicket?.Agent || null;
    
    if (agent) {
      assignedAgentId = agent.id || agentId;
      assignedAgentName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.nickname || undefined;
    } else if (agentId) {
      // If we have agent_id but no agent object, try to find agent from the agents list
      assignedAgentId = agentId;
      const foundAgent = agents.find(a => a.id === assignedAgentId);
      if (foundAgent) {
        assignedAgentName = `${foundAgent.first_name || ''} ${foundAgent.last_name || ''}`.trim() || foundAgent.nickname || undefined;
      }
    } else if (ticket.agentFirst || ticket.agentLast) {
      // Fallback to enriched ticket data if raw ticket doesn't have agent
      assignedAgentName = `${ticket.agentFirst || ''} ${ticket.agentLast || ''}`.trim() || undefined;
    }

    // Add assigned agent ID and name to selectedTicket
    const selectedTicketWithAgent = {
      ...ticket,
      assignedAgentId,
      assignedAgentName,
    };

    return {
      agents,
      applications,
      locations,
      inventoryItems,
      priorities: [
        { value: TICKET_PRIORITY.LOW, label: 'Low' },
        { value: TICKET_PRIORITY.MEDIUM, label: 'Medium' },
        { value: TICKET_PRIORITY.HIGH, label: 'High' },
        { value: TICKET_PRIORITY.CRITICAL, label: 'Critical' },
      ],
      selectedTicket: selectedTicketWithAgent,
    };
  }

  // GET /tickets
  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(
    @Query() filterDto: FilterTicketDto,
    @Req() req: any = {},
  ): Promise<any> {
    const userId = req.user?.userId;
    return this.ticketService.findAll(
      filterDto.startDate,
      filterDto.endDate,
      filterDto.status,
      filterDto.priority,
      filterDto.agentId,
      filterDto.deviceId,
      filterDto.locationId,
      filterDto.page,
      filterDto.limit,
      filterDto.actionType,
      filterDto.sortBy,
      filterDto.sortOrder,
      userId,
      filterDto.search,
      filterDto.isUnread,
      filterDto.customerId,
    );
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<{ success: boolean }> {
    await this.ticketService.markTicketRead(id);
    return { success: true };
  }

  // GET /api/v1/tickets/enriched - Get all tickets with enriched data for frontend
  @Get('enriched')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAllEnriched(
    @Query() filterDto: FilterTicketDto,
  ): Promise<any> {
    return this.ticketService.findAllEnriched(
      filterDto.startDate,
      filterDto.endDate,
      filterDto.status,
      filterDto.priority,
      filterDto.agentId,
      filterDto.deviceId,
      filterDto.locationId,
      filterDto.page,
      filterDto.limit,
      filterDto.actionType,
      filterDto.sortBy,
      filterDto.sortOrder,
    );
  }

  // GET /api/v1/tickets/enriched/:id - Get single ticket with enriched data for frontend
  @Get('enriched/:id')
  async findOneEnriched(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnrichedTicketResponseDto> {
    const ticket = await this.ticketService.findOneEnriched(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  // GET /tickets/hash/:hash
  @Get('hash/:hash')
  async findByHash(@Param('hash') hash: string) {
    const ticket = await this.ticketService.findOneByHash(hash);
    if (!ticket) throw new NotFoundException(`Ticket with hash ${hash} not found`);
    return ticket;
  }

  // GET /tickets/:id
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TicketAttributes> {
    const ticket = await this.ticketService.findOne(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  // POST /tickets (global prefix applies)
  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createTicketDto: BaseTicketDto,
    @Req() req: any,
  ): Promise<TicketAttributes> {
    const userId = req.user?.userId;
    return this.ticketService.create(createTicketDto, userId);
  }

  // POST /tickets/with-files - Create ticket with file attachments
  @Post('with-files')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    },
    fileFilter: (req, file, cb) => {
      // Allow common file types
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }
    },
  }))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createWithFiles(
    @Body() createTicketDto: CreateTicketWithFilesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ): Promise<EnrichedTicketResponseDto> {
    this.logger.log(`Creating ticket with ${files?.length || 0} files`);
    const userId = req.user?.userId;
    return this.ticketService.createWithFiles(createTicketDto, files, userId);
  }

  // PUT /tickets/:id/assignees — update multiple assigned agents
  @Put(':id/assignees')
  async updateAssignees(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { agent_ids: number[] },
    @Req() req: any,
  ): Promise<any> {
    const agentIds = body?.agent_ids;
    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      throw new BadRequestException('agent_ids must be a non-empty array of agent IDs');
    }
    const invalidIds = agentIds.filter(v => typeof v !== 'number' || !Number.isInteger(v) || v < 1);
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid agent IDs: ${invalidIds.join(', ')}`);
    }
    const userId = req.user?.userId;
    return this.ticketService.updateAssignees(id, agentIds, userId);
  }

  // PUT /tickets/:id/action-types — update action types
  @Put(':id/action-types')
  async updateActionTypes(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { action_type_ids: number[] },
    @Req() req: any,
  ): Promise<any> {
    const actionTypeIds = body?.action_type_ids;
    if (!Array.isArray(actionTypeIds)) {
      throw new BadRequestException('action_type_ids must be an array of action type IDs');
    }
    const invalidIds = actionTypeIds.filter(v => typeof v !== 'number' || !Number.isInteger(v) || v < 1);
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid action type IDs: ${invalidIds.join(', ')}`);
    }
    const userId = req.user?.userId;
    return this.ticketService.updateActionTypes(id, actionTypeIds, userId);
  }

  // PUT /tickets/:id (global prefix applies)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: any,
  ): Promise<TicketAttributes> {
    const userId = req.user?.userId;
    return this.ticketService.update(id, updateTicketDto, userId);
  }

  // DELETE /tickets/:id (global prefix applies) — Super Admin only
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.ticketService.remove(id);
    return { deleted: true };
  }
}

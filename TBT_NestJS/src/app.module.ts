import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MigrateController } from './controllers/migrate.controller';
import { AgentController } from './controllers/agent.controller';
import { AgentService } from './services/agent.service';
import { AgentRepository } from './repositories/agent.repository';
import { ApplicationController } from './controllers/application.controller';
import { ApplicationService } from './services/application.service';
import { ApplicationRepository } from './repositories/application.repository';
import { TeamController } from './controllers/team.controller';
import { TeamService } from './services/team.service';
import { TeamRepository } from './repositories/team.repository';
import { TicketController } from './controllers/ticket.controller';
import { TicketService } from './services/ticket.service';
import { TicketRepository } from './repositories/ticket.repository';
import { ActionTypeController } from './controllers/action-type.controller';
import { TicketHistoryController } from './controllers/ticket-history.controller';
import { TicketHistoryService } from './services/ticket-history.service';
import { TicketHistoryRepository } from './repositories/ticket-history.repository';
import { InventoryItemBrandController } from './controllers/inventory-item-brand.controller';
import { InventoryItemBrandService } from './services/inventory-item-brand.service';
import { InventoryItemBrandRepository } from './repositories/inventory-item-brand.repository';
import { InventoryItemCategoryController } from './controllers/inventory-item-category.controller';
import { InventoryItemCategoryService } from './services/inventory-item-category.service';
import { InventoryItemCategoryRepository } from './repositories/inventory-item-category.repository';
import { InventoryItemLocationController } from './controllers/inventory-item-location.controller';
import { InventoryItemLocationService } from './services/inventory-item-location.service';
import { InventoryItemLocationRepository } from './repositories/inventory-item-location.repository';
import { CustomerController } from './controllers/customer.controller';
import { CustomerService } from './services/customer.service';
import { CustomerRepository } from './repositories/customer.repository';
import { InventoryItemController } from './controllers/inventory-item.controller';
import { InventoryItemService } from './services/inventory-item.service';
import { InventoryItemRepository } from './repositories/inventory-item.repository';
import { InventoryCsvService } from './services/inventory-csv.service';
import { SeederController } from './controllers/seeder.controller';
import { AuthModule } from './modules/auth.module';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationService } from './services/organization.service';
import { OrganizationRepository } from './repositories/organization.repository';
import { TeamAgentRepository } from './repositories/team-agent.repository';
import { CountryController } from './controllers/country.controller';
import { StateController } from './controllers/state.controller';
import { CountryService } from './services/country.service';
import { StateService } from './services/state.service';
import { CountryRepository } from './repositories/country.repository';
import { StateRepository } from './repositories/state.repository';
import { IncidentController } from './controllers/incident.controller';
import { IncidentService } from './services/incident.service';
import { IncidentRepository } from './repositories/incident.repository';
import { S3Service } from './services/s3.service';
import { TicketResourceRepository } from './repositories/ticket-resource.repository';
import { TicketResourceService } from './services/ticket-resource.service';
import { TicketResourceController } from './controllers/ticket-resource.controller';
import { TicketResourceUtilityController } from './controllers/ticket-resource-utility.controller';
import { TicketCommentController } from './controllers/ticket-comment.controller';
import { TicketCommentService } from './services/ticket-comment.service';
import { TicketCommentRepository } from './repositories/ticket-comment.repository';
import { SmsService } from './services/sms.service';
import { WhatsAppMetaService } from './services/whatsapp-meta.service';
import { MessageController, SmsWebhookController, MessageAliasController, WhatsAppMetaController } from './controllers/message.controller';
import { EsetController } from './controllers/eset.controller';
import { NotificationController } from './controllers/notification.controller';
import { FileController } from './controllers/file.controller';
import { NotificationService } from './services/notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { RealtimeController } from './controllers/realtime.controller';
import { PusherService } from './services/pusher.service';
import { RealtimeService } from './services/realtime.service';
import { TicketQueueService } from './services/ticket-queue.service';
import { MessageService } from './services/message.service';
import { MessageRepository } from './repositories/message.repository';
import { TicketSuggestionController } from './controllers/ticket-suggestion.controller';
import { TicketSuggestionService } from './services/ticket-suggestion.service';
import { TicketInvoiceController } from './controllers/ticket-invoice.controller';
import { TicketInvoiceService } from './services/ticket-invoice.service';
import { TicketInvoiceRepository } from './repositories/ticket-invoice.repository';
import { BackupController } from './controllers/backup.controller';
import { BackupService } from './services/backup.service';
import { EmailController } from './controllers/email.controller';
import { NoteController } from './controllers/note.controller';
import { NoteService } from './services/note.service';
import { NoteRepository } from './repositories/note.repository';
import { RenewPortalController } from './controllers/renew-portal.controller';
import { ZendeskController } from './controllers/zendesk.controller';
import { CannedReplyController } from './controllers/canned-reply.controller';
import { CannedReplyService } from './services/canned-reply.service';
import { CannedReplyRepository } from './repositories/canned-reply.repository';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    AppController,
    MigrateController,
    AgentController,
    ApplicationController,
    TeamController,
    TicketController,
    RenewPortalController,
    ZendeskController,
    TicketHistoryController,
    InventoryItemBrandController,
    InventoryItemCategoryController,
    InventoryItemLocationController,
    CustomerController,
    InventoryItemController,
    SeederController,
    OrganizationController,
    CountryController,
    StateController,
    IncidentController,
    TicketResourceController,
    TicketResourceUtilityController,
    TicketCommentController,
    MessageController,
    SmsWebhookController,
    MessageAliasController,
    WhatsAppMetaController,
    EsetController,
    NotificationController,
    FileController,
    RealtimeController,
    TicketSuggestionController,
    TicketInvoiceController,
    ActionTypeController,
    BackupController,
    EmailController,
    NoteController,
    CannedReplyController,
  ],
  providers: [
    AppService,
    AgentService,
    ApplicationService,
    TeamService,
    TicketService,
    TicketHistoryService,
    InventoryItemBrandService,
    InventoryItemCategoryService,
    InventoryItemLocationService,
    CustomerService,
    InventoryItemService,
    InventoryCsvService,
    OrganizationService,
    CountryService,
    StateService,
    IncidentService,
    AgentRepository,
    ApplicationRepository,
    TeamRepository,
    TicketRepository,
    TicketHistoryRepository,
    InventoryItemBrandRepository,
    InventoryItemCategoryRepository,
    InventoryItemLocationRepository,
    CustomerRepository,
    InventoryItemRepository,
    OrganizationRepository,
    TeamAgentRepository,
    CountryRepository,
    StateRepository,
    IncidentRepository,
    S3Service,
    TicketResourceRepository,
    TicketResourceService,
    TicketCommentRepository,
    TicketCommentService,
    SmsService,
    WhatsAppMetaService,
    MessageRepository,
    MessageService,
    NotificationService,
    NotificationRepository,
    PusherService,
    RealtimeService,
    TicketQueueService,
    TicketSuggestionService,
    TicketInvoiceService,
    TicketInvoiceRepository,
    BackupService,
    NoteService,
    NoteRepository,
    CannedReplyService,
    CannedReplyRepository,
  ],
})
export class AppModule {}

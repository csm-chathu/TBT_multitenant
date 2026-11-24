import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from 'src/services/message.service';
import { TicketRepository } from 'src/repositories/ticket.repository';
import { MessageRepository } from 'src/repositories/message.repository';
import { TicketCommentRepository } from 'src/repositories/ticket-comment.repository';
import { TicketResourceRepository } from 'src/repositories/ticket-resource.repository';
import { CustomerRepository } from 'src/repositories/customer.repository';
import { ApplicationRepository } from 'src/repositories/application.repository';
import { TeamRepository } from 'src/repositories/team.repository';
import { NotificationService } from 'src/services/notification.service';
import { PusherService } from 'src/services/pusher.service';
import { SmsService } from 'src/services/sms.service';
import { S3Service } from 'src/services/s3.service';
import { WhatsAppMetaService } from 'src/services/whatsapp-meta.service';
import { RealtimeService } from 'src/services/realtime.service';
import { Ticket } from 'src/models/ticket';

describe('MessageService - Ticket Creation & Message Handling', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: TicketRepository, useValue: {} },
        { provide: MessageRepository, useValue: {} },
        { provide: TicketCommentRepository, useValue: {} },
        { provide: TicketResourceRepository, useValue: {} },
        { provide: CustomerRepository, useValue: {} },
        { provide: ApplicationRepository, useValue: {} },
        { provide: TeamRepository, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: RealtimeService, useValue: {} },
        { provide: PusherService, useValue: {} },
        { provide: SmsService, useValue: {} },
        { provide: S3Service, useValue: {} },
        { provide: WhatsAppMetaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  describe('processTicketMessage logic', () => {
    it('should add comment to specified ticket when valid @ticket_id is present', async () => {
      const mockCustomer = { id: 10 } as any;
      const mockApp = { id: 1 } as any;
      const mockTeam = { id: 1 } as any;
      const mockInputs = { Body: 'Hello @105' } as any;
      const targetTicket = { id: 105, status: 'Assigned', customer_id: 10 } as any;

      jest.spyOn(service as any, 'findTicketByIdAndCustomer').mockResolvedValue(targetTicket);
      const handleExistingSpy = jest.spyOn(service as any, 'handleExistingTicket').mockResolvedValue({
        ticket: targetTicket,
        replyMsg: 'Comment added',
        addMsgTailPart: true,
      });
      const createTicketSpy = jest.spyOn(service as any, 'createNewTicket');

      const result = await (service as any).processTicketMessage(
        'Hello @105',
        mockCustomer,
        mockApp,
        mockTeam,
        mockInputs,
        null,
      );

      expect((service as any).findTicketByIdAndCustomer).toHaveBeenCalledWith(105, 10, null);
      expect(handleExistingSpy).toHaveBeenCalledWith(
        targetTicket,
        'Hello @105',
        mockCustomer,
        mockInputs,
        '@',
        expect.anything(),
        null,
      );
      expect(createTicketSpy).not.toHaveBeenCalled();
      expect(result.ticket).toBe(targetTicket);
    });

    it('should create a new ticket if customer has no previous ticket (no @ticket_id in msg)', async () => {
      const mockCustomer = { id: 10 } as any;
      const mockApp = { id: 1 } as any;
      const mockTeam = { id: 1 } as any;
      const mockInputs = { Body: 'Hello support' } as any;
      const newTicket = { id: 200, status: 'Assigned' } as any;

      jest.spyOn(service as any, 'findTicketByIdAndCustomer').mockResolvedValue(null);
      jest.spyOn(service as any, 'findMostRecentTicketByCustomer').mockResolvedValue(null);
      const handleExistingSpy = jest.spyOn(service as any, 'handleExistingTicket');
      const createTicketSpy = jest.spyOn(service as any, 'createNewTicket').mockResolvedValue({
        ticket: newTicket,
        replyMsg: 'Ticket created',
        addMsgTailPart: false,
      });

      const result = await (service as any).processTicketMessage(
        'Hello support',
        mockCustomer,
        mockApp,
        mockTeam,
        mockInputs,
        null,
      );

      expect(handleExistingSpy).not.toHaveBeenCalled();
      expect(createTicketSpy).toHaveBeenCalled();
      expect(result.ticket).toBe(newTicket);
    });

    it('should create a new ticket if customer previous ticket is closed', async () => {
      const mockCustomer = { id: 10 } as any;
      const mockApp = { id: 1 } as any;
      const mockTeam = { id: 1 } as any;
      const mockInputs = { Body: 'Need help again' } as any;
      const closedTicket = { id: 50, status: 'closed', createdAt: new Date() } as any;
      const newTicket = { id: 201, status: 'Assigned' } as any;

      jest.spyOn(service as any, 'findTicketByIdAndCustomer').mockResolvedValue(null);
      jest.spyOn(service as any, 'findMostRecentTicketByCustomer').mockResolvedValue(closedTicket);
      const handleExistingSpy = jest.spyOn(service as any, 'handleExistingTicket');
      const createTicketSpy = jest.spyOn(service as any, 'createNewTicket').mockResolvedValue({
        ticket: newTicket,
        replyMsg: 'Ticket created',
        addMsgTailPart: false,
      });

      const result = await (service as any).processTicketMessage(
        'Need help again',
        mockCustomer,
        mockApp,
        mockTeam,
        mockInputs,
        null,
      );

      expect(handleExistingSpy).not.toHaveBeenCalled();
      expect(createTicketSpy).toHaveBeenCalled();
      expect(result.ticket).toBe(newTicket);
    });

    it('should add comment to previous open ticket if created less than 24 hours ago', async () => {
      const mockCustomer = { id: 10 } as any;
      const mockApp = { id: 1 } as any;
      const mockTeam = { id: 1 } as any;
      const mockInputs = { Body: 'Any update?' } as any;
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
      const recentOpenTicket = { id: 88, status: 'In Progress', createdAt: tenHoursAgo } as any;

      jest.spyOn(service as any, 'findTicketByIdAndCustomer').mockResolvedValue(null);
      jest.spyOn(service as any, 'findMostRecentTicketByCustomer').mockResolvedValue(recentOpenTicket);
      const handleExistingSpy = jest.spyOn(service as any, 'handleExistingTicket').mockResolvedValue({
        ticket: recentOpenTicket,
        replyMsg: 'Comment added',
        addMsgTailPart: true,
      });
      const createTicketSpy = jest.spyOn(service as any, 'createNewTicket');

      const result = await (service as any).processTicketMessage(
        'Any update?',
        mockCustomer,
        mockApp,
        mockTeam,
        mockInputs,
        null,
      );

      expect(handleExistingSpy).toHaveBeenCalledWith(
        recentOpenTicket,
        'Any update?',
        mockCustomer,
        mockInputs,
        '@',
        null,
        null,
      );
      expect(createTicketSpy).not.toHaveBeenCalled();
      expect(result.ticket).toBe(recentOpenTicket);
    });

    it('should create a new ticket if previous open ticket was created 24 hours or more ago', async () => {
      const mockCustomer = { id: 10 } as any;
      const mockApp = { id: 1 } as any;
      const mockTeam = { id: 1 } as any;
      const mockInputs = { Body: 'Follow up message' } as any;
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const oldOpenTicket = { id: 88, status: 'In Progress', createdAt: twentyFiveHoursAgo } as any;
      const newTicket = { id: 202, status: 'Assigned' } as any;

      jest.spyOn(service as any, 'findTicketByIdAndCustomer').mockResolvedValue(null);
      jest.spyOn(service as any, 'findMostRecentTicketByCustomer').mockResolvedValue(oldOpenTicket);
      const handleExistingSpy = jest.spyOn(service as any, 'handleExistingTicket');
      const createTicketSpy = jest.spyOn(service as any, 'createNewTicket').mockResolvedValue({
        ticket: newTicket,
        replyMsg: 'Ticket created',
        addMsgTailPart: false,
      });

      const result = await (service as any).processTicketMessage(
        'Follow up message',
        mockCustomer,
        mockApp,
        mockTeam,
        mockInputs,
        null,
      );

      expect(handleExistingSpy).not.toHaveBeenCalled();
      expect(createTicketSpy).toHaveBeenCalled();
      expect(result.ticket).toBe(newTicket);
    });
  });
});

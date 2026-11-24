import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MessageController, SmsWebhookController, MessageAliasController } from 'src/controllers/message.controller';
import { MessageService } from 'src/services/message.service';
import { SmsService } from 'src/services/sms.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockMessageService = {
  findByTicketId: jest.fn(),
  findAll: jest.fn(),
  resolveSendContext: jest.fn(),
  logOutgoingForTicket: jest.fn(),
  logIncoming: jest.fn(),
};

const mockSmsService = {
  sendSms: jest.fn(),
};

const applicationFindOne = jest.fn();
const customerFindOne = jest.fn();

jest.mock('src/models', () => ({
  Application: { findOne: (...args: any[]) => applicationFindOne(...args) },
  Customer: { findOne: (...args: any[]) => customerFindOne(...args) },
  sequelize: { sync: jest.fn(), authenticate: jest.fn() },
}));

describe('Message controllers', () => {
  let messageController: MessageController;
  let aliasController: MessageAliasController;
  let webhookController: SmsWebhookController;

  beforeEach(async () => {
    applicationFindOne.mockReset();
    customerFindOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController, SmsWebhookController, MessageAliasController],
      providers: [
        { provide: MessageService, useValue: mockMessageService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    messageController = module.get<MessageController>(MessageController);
    aliasController = module.get<MessageAliasController>(MessageAliasController);
    webhookController = module.get<SmsWebhookController>(SmsWebhookController);
    jest.clearAllMocks();
  });

  describe('MessageController', () => {
    it('fetches messages for ticket', async () => {
      const messages = [{ id: 1 } as any];
      mockMessageService.findByTicketId.mockResolvedValue(messages);

      await expect(messageController.getForTicket(10)).resolves.toBe(messages);
      expect(mockMessageService.findByTicketId).toHaveBeenCalledWith(10);
    });

    it('wraps errors when fetching messages', async () => {
      mockMessageService.findByTicketId.mockRejectedValue(new Error('db failed'));

      await expect(messageController.getForTicket(10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('rejects send when destination missing', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({ to: undefined });

      await expect(
        messageController.sendForTicket(11, { message: 'hi' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('logs message without sending when send flag false', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({
        to: '+1123',
        from: '+1456',
        prefix: '[',
        suffix: ']'
      });
      mockMessageService.logOutgoingForTicket.mockResolvedValue({ id: 1 } as any);

      await messageController.sendForTicket(11, { message: 'hi', send: false } as any);

      expect(mockMessageService.logOutgoingForTicket).toHaveBeenCalledWith(11, '[hi]', {
        from: '+1456',
        to: '+1123',
        applicationId: undefined,
        customerId: undefined,
        type: 'sms',
        message_data: { skipped: true, reason: 'save_only' },
      });
      expect(mockSmsService.sendSms).not.toHaveBeenCalled();
    });

    it('sends sms and logs outgoing message', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({
        to: '+1123',
        from: '+1456',
        prefix: undefined,
        suffix: undefined,
        application: { id: 1 },
        customer: { id: 2 },
      });
      mockSmsService.sendSms.mockResolvedValue({ body: 'hi' });
      mockMessageService.logOutgoingForTicket.mockResolvedValue({ id: 2 } as any);

      await messageController.sendForTicket(11, { message: 'hi' } as any);

      expect(mockSmsService.sendSms).toHaveBeenCalledWith({
        to: '+1123',
        from: '+1456',
        message: 'hi',
        prefix: undefined,
        suffix: undefined,
      });
      expect(mockMessageService.logOutgoingForTicket).toHaveBeenCalledWith(11, 'hi', {
        from: '+1456',
        to: '+1123',
        applicationId: 1,
        customerId: 2,
        type: 'sms',
        message_data: { body: 'hi' },
      });
    });

    it('raises BadGateway when sms send rejects', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({ to: '+1', from: '+2' });
      mockSmsService.sendSms.mockRejectedValue(new Error('twilio down'));

      await expect(
        messageController.sendForTicket(1, { message: 'hi' } as any),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('raises BadGateway when sms send skipped', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({ to: '+1', from: '+2' });
      mockSmsService.sendSms.mockResolvedValue({ skipped: true, reason: 'opt-out' });

      await expect(
        messageController.sendForTicket(1, { message: 'hi' } as any),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('MessageAliasController', () => {
    it('lists all messages when no filter', async () => {
      const messages = [{ id: 1 } as any];
      mockMessageService.findAll.mockResolvedValue(messages);

      await expect(aliasController.findAll()).resolves.toBe(messages);
      expect(mockMessageService.findAll).toHaveBeenCalledTimes(1);
    });

    it('lists messages for specific ticket', async () => {
      const messages = [{ id: 1 } as any];
      mockMessageService.findByTicketId.mockResolvedValue(messages);

      await expect(aliasController.findAll('15')).resolves.toBe(messages);
      expect(mockMessageService.findByTicketId).toHaveBeenCalledWith(15);
    });

    it('falls back to listAll when ticketId filter invalid', async () => {
      const messages = [{ id: 1 } as any];
      mockMessageService.findAll.mockResolvedValue(messages);

      await expect(aliasController.findAll('not-a-number')).resolves.toBe(messages);
      expect(mockMessageService.findAll).toHaveBeenCalledTimes(1);
    });

    it('rejects missing ticket id when sending via alias', async () => {
      await expect(aliasController.sendViaBody({ message: 'hi' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('sends via alias respecting save-only flag', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({
        to: '+1',
        from: '+2',
        prefix: '(',
        suffix: ')',
      });
      mockMessageService.logOutgoingForTicket.mockResolvedValue({ id: 99 } as any);

      await aliasController.sendViaBody({ ticket_id: 1, message: 'hey', send: false } as any);

      expect(mockMessageService.logOutgoingForTicket).toHaveBeenCalledWith(
        1,
        '(hey)',
        expect.objectContaining({
          from: '+2',
          to: '+1',
          message_data: { skipped: true, reason: 'save_only' },
        }),
      );
      expect(mockSmsService.sendSms).not.toHaveBeenCalled();
    });

    it('throws BadGateway when alias sms fails', async () => {
      mockMessageService.resolveSendContext.mockResolvedValue({ to: '+1', from: '+2' });
      mockSmsService.sendSms.mockRejectedValue(new Error('fail'));

      await expect(
        aliasController.sendViaBody({ ticket_id: 1, message: 'hi' } as any),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('SmsWebhookController', () => {
    it('logs inbound message and returns receipt', async () => {
      mockMessageService.logIncoming.mockResolvedValue({ id: 33 } as any);
      applicationFindOne.mockResolvedValue({ id: 9 });
      customerFindOne.mockResolvedValue({ id: 7 });

      const result = await webhookController.twilioInbound({
        From: '+123',
        To: '+456',
        Body: 'Hello there',
        MessageSid: 'SM123',
      });

      expect(result).toEqual({ received: true, id: 33 });
      expect(mockMessageService.logIncoming).toHaveBeenCalledWith(expect.objectContaining({
        from: '+123',
        to: '+456',
        message: 'Hello there',
        applicationId: 9,
        customerId: 7,
      }));
    });

    it('does not derive ticket id with current regex implementation', async () => {
      mockMessageService.logIncoming.mockResolvedValue({ id: 44 } as any);
      applicationFindOne.mockResolvedValue(undefined);
      customerFindOne.mockResolvedValue(undefined);

      await webhookController.twilioInbound({
        From: '+123',
        To: '+456',
        Body: 'Update @77 completed',
      });

      const callArg = mockMessageService.logIncoming.mock.calls[0][0];
      expect(callArg.ticketId).toBeUndefined();
    });
  });
});

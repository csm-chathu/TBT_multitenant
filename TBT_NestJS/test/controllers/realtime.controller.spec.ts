import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RealtimeController } from 'src/controllers/realtime.controller';
import { RealtimeService } from 'src/services/realtime.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockRealtime = {
  getPusherConfig: jest.fn(),
  authorizeChannel: jest.fn(),
};

describe('RealtimeController', () => {
  let controller: RealtimeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealtimeController],
      providers: [{ provide: RealtimeService, useValue: mockRealtime }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RealtimeController>(RealtimeController);
    jest.clearAllMocks();
  });

  it('returns realtime config', () => {
    const config = { key: 'abc' };
    mockRealtime.getPusherConfig.mockReturnValue(config);

    expect(controller.getConfig()).toBe(config);
    expect(mockRealtime.getPusherConfig).toHaveBeenCalledTimes(1);
  });

  it('authorizes when socket and channel provided', () => {
    const payload = { socket_id: '1', channel_name: 'private-test' };
    const response = { auth: 'token' };
    mockRealtime.authorizeChannel.mockReturnValue(response);

    expect(controller.authorize(payload)).toBe(response);
    expect(mockRealtime.authorizeChannel).toHaveBeenCalledWith('1', 'private-test', undefined);
  });

  it('throws when socket id missing', () => {
    expect(() => controller.authorize({ channel_name: 'x' })).toThrow(BadRequestException);
  });

  it('throws when channel name missing', () => {
    expect(() => controller.authorize({ socket_id: 's' })).toThrow(BadRequestException);
  });

  it('wraps authorize errors as BadRequest', () => {
    mockRealtime.authorizeChannel.mockImplementation(() => {
      throw new Error('failure');
    });

    expect(() =>
      controller.authorize({ socket_id: '1', channel_name: 'room' }),
    ).toThrow(BadRequestException);
  });
});

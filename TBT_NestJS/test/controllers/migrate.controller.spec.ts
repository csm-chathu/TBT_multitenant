import { Test, TestingModule } from '@nestjs/testing';
import { MigrateController } from 'src/controllers/migrate.controller';

const syncMock = jest.fn();

jest.mock('src/models', () => ({
  sequelize: { sync: (...args: any[]) => syncMock(...args) },
}));

describe('MigrateController', () => {
  let controller: MigrateController;

  beforeEach(async () => {
    syncMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MigrateController],
    }).compile();

    controller = module.get<MigrateController>(MigrateController);
  });

  const createResponse = () => {
    const res: any = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    return res;
  };

  it('invokes sequelize.sync without alter flag by default', async () => {
    syncMock.mockResolvedValue(undefined);
    const res = createResponse();

    await controller.migrate(res);

    expect(syncMock).toHaveBeenCalledWith({ force: false, alter: false });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Database migrated successfully.',
      alter: false,
    });
  });

  it('sets alter flag when query param true', async () => {
    syncMock.mockResolvedValue(undefined);
    const res = createResponse();

    await controller.migrate(res, 'true');

    expect(syncMock).toHaveBeenCalledWith({ force: false, alter: true });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Database migrated successfully.',
      alter: true,
    });
  });

  it('returns error response when sync fails', async () => {
    syncMock.mockRejectedValue(new Error('failure'));
    const res = createResponse();

    await controller.migrate(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'failure' });
  });
});

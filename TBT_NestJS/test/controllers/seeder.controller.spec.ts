import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { SeederController } from 'src/controllers/seeder.controller';

const seedMock = jest.fn();

jest.mock('src/seeders/database.seeder', () => ({
  seed: (...args: any[]) => seedMock(...args),
}));

describe('SeederController', () => {
  let controller: SeederController;

  beforeEach(async () => {
    seedMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeederController],
    }).compile();

    controller = module.get<SeederController>(SeederController);
  });

  it('runs seeder and returns success payload', async () => {
    const result = await controller.runSeeder();

    expect(seedMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.message).toContain('completed successfully');
    expect(result.timestamp).toBeDefined();
  });

  it('throws HttpException when seeding fails', async () => {
    seedMock.mockRejectedValue(new Error('failure'));

    await expect(controller.runSeeder()).rejects.toBeInstanceOf(HttpException);
  });
});

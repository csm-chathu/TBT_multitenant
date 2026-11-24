import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TicketResourceUtilityController } from 'src/controllers/ticket-resource-utility.controller';
import { S3Service } from 'src/services/s3.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockS3 = {
  generateSignedUrl: jest.fn(),
};

describe('TicketResourceUtilityController', () => {
  let controller: TicketResourceUtilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketResourceUtilityController],
      providers: [{ provide: S3Service, useValue: mockS3 }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketResourceUtilityController>(TicketResourceUtilityController);
    jest.clearAllMocks();
  });

  it('returns signed url when filePath provided', async () => {
    mockS3.generateSignedUrl.mockResolvedValue('signed-url');

    await expect(controller.generateSignedUrl('file.txt')).resolves.toEqual({ url: 'signed-url' });
    expect(mockS3.generateSignedUrl).toHaveBeenCalledWith('file.txt');
  });

  it('throws BadRequest when filePath missing', async () => {
    await expect(controller.generateSignedUrl('')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockS3.generateSignedUrl).not.toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketResourceController } from 'src/controllers/ticket-resource.controller';
import { TicketResourceService } from 'src/services/ticket-resource.service';
import { S3Service } from 'src/services/s3.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

const mockResourceService = {
  uploadForTicketRef: jest.fn(),
  listForTicketRef: jest.fn(),
  remove: jest.fn(),
  getDownloadUrl: jest.fn(),
};

const mockS3Service = {
  generateSignedUrl: jest.fn(),
};

describe('TicketResourceController', () => {
  let controller: TicketResourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketResourceController],
      providers: [
        { provide: TicketResourceService, useValue: mockResourceService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketResourceController>(TicketResourceController);
    jest.clearAllMocks();
  });

  it('uploads a file for a ticket reference', async () => {
    const result = { id: 1 } as any;
    mockResourceService.uploadForTicketRef.mockResolvedValue(result);

    await expect(
      controller.upload('ref123', { originalname: 'file' } as any, 'note'),
    ).resolves.toBe(result);
    expect(mockResourceService.uploadForTicketRef).toHaveBeenCalledWith({
      ticketRef: 'ref123',
      file: { originalname: 'file' },
      remarks: 'note',
    });
  });

  it('throws BadRequest when upload file missing', async () => {
    await expect(controller.upload('ref', undefined as any, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists resources for ticket reference', async () => {
    const items = [{ id: 1 }];
    mockResourceService.listForTicketRef.mockResolvedValue(items as any);

    await expect(controller.list('ref123')).resolves.toEqual(items);
    expect(mockResourceService.listForTicketRef).toHaveBeenCalledWith('ref123');
  });

  it('removes a resource', async () => {
    const response = { deleted: true } as any;
    mockResourceService.remove.mockResolvedValue(response);

    await expect(controller.remove(4, 'key')).resolves.toBe(response);
    expect(mockResourceService.remove).toHaveBeenCalledWith(4, 'key');
  });

  it('generates signed url when filePath provided', async () => {
    mockS3Service.generateSignedUrl.mockResolvedValue('signed');

    await expect(controller.generateSignedUrl('path')).resolves.toEqual({ url: 'signed' });
    expect(mockS3Service.generateSignedUrl).toHaveBeenCalledWith('path');
  });

  it('throws BadRequest when filePath missing for signed url', async () => {
    await expect(controller.generateSignedUrl('')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('redirects to download url', async () => {
    const res: any = { redirect: jest.fn() };
    mockResourceService.getDownloadUrl.mockResolvedValue('http://download');

    await controller.download(10, res);

    expect(mockResourceService.getDownloadUrl).toHaveBeenCalledWith(10);
    expect(res.redirect).toHaveBeenCalledWith('http://download');
  });

  it('propagates NotFoundException from download', async () => {
    const res: any = { redirect: jest.fn() };
    mockResourceService.getDownloadUrl.mockRejectedValue(new NotFoundException());

    await expect(controller.download(22, res)).rejects.toBeInstanceOf(NotFoundException);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('wraps unknown download errors as NotFoundException', async () => {
    const res: any = { redirect: jest.fn() };
    mockResourceService.getDownloadUrl.mockRejectedValue(new Error('oops'));

    await expect(controller.download(22, res)).rejects.toBeInstanceOf(NotFoundException);
  });
});

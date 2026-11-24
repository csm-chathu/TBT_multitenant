import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards, UsePipes, ValidationPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TicketInvoiceService } from '../services/ticket-invoice.service';
import { CreateTicketInvoiceDto, UpdateTicketInvoiceDto } from '../dto/ticket-invoice/ticket-invoice.dto';

@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/invoice')
export class TicketInvoiceController {
  constructor(private readonly service: TicketInvoiceService) {}

  @Get()
  async getInvoice(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.service.getInvoiceForTicket(ticketId);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createInvoice(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: CreateTicketInvoiceDto,
  ) {
    return this.service.addInvoiceForTicket(ticketId, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Use form-data field name "file".');
    }
    return this.service.uploadInvoiceAttachment(ticketId, file);
  }

  @Put(':invoiceId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInvoice(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body() dto: UpdateTicketInvoiceDto,
  ) {
    return this.service.updateInvoice(invoiceId, dto);
  }

  @Delete(':invoiceId')
  async deleteInvoice(@Param('invoiceId', ParseIntPipe) invoiceId: number) {
    return this.service.deleteInvoice(invoiceId);
  }
}

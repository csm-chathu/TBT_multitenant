import { Controller, Post, UseInterceptors, UploadedFile, Param, Body, Get, Delete, Query, UseGuards, BadRequestException, ParseIntPipe, Res, NotFoundException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { TicketResourceService } from '../services/ticket-resource.service'
import { S3Service } from '../services/s3.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { Express } from 'express'
import type { Response } from 'express'

@UseGuards(JwtAuthGuard)
// Accepts either numeric ticket ID or string ticket hash as :ticketRef
@Controller('tickets/:ticketRef/resources')
export class TicketResourceController {
  constructor(
    private readonly service: TicketResourceService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('ticketRef') ticketRef: string,
    @UploadedFile() file: any,
    @Body('remarks') remarks?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Use form-data field name "file".')
    }
    return await this.service.uploadForTicketRef({ ticketRef, file, remarks })
  }

  @Get()
  async list(@Param('ticketRef') ticketRef: string) {
    return await this.service.listForTicketRef(ticketRef)
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('key') key?: string,
  ) {
    return await this.service.remove(id, key)
  }

  /**
   * Generate a signed URL for a file path (compatible with old Sails.js helper)
   * GET /tickets/:ticketRef/resources/signed-url?filePath=<path>
   */
  @Get('signed-url')
  async generateSignedUrl(@Query('filePath') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('filePath query parameter is required')
    }
    const url = await this.s3Service.generateSignedUrl(filePath)
    return { url }
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const downloadUrl = await this.service.getDownloadUrl(id)
      // Redirect to presigned URL - browser will handle the download
      return res.redirect(downloadUrl)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new NotFoundException('File not found or could not be accessed')
    }
  }
}

import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { S3Service } from '../services/s3.service'

@UseGuards(JwtAuthGuard)
@Controller('tickets/resources')
export class TicketResourceUtilityController {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Generate a signed URL for a specific S3 file path.
   * This matches the legacy Sails.js helper signature and can be used without a ticketRef.
   * Example: GET /api/v1/tickets/resources/signed-url?filePath=foo/bar.png
   */
  @Get('signed-url')
  async generateSignedUrl(@Query('filePath') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('filePath query parameter is required')
    }

    const url = await this.s3Service.generateSignedUrl(filePath)
    return { url }
  }
}

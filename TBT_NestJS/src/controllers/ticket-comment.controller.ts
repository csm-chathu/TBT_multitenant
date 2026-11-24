import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TicketCommentService } from '../services/ticket-comment.service';
import { BaseTicketCommentDto } from '../dto/ticket-comment/ticket-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/comments')
export class TicketCommentController {
  constructor(private readonly service: TicketCommentService) {}

  @Get()
  async list(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.service.listForTicket(ticketId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    },
    fileFilter: (req, file, cb) => {
      // Allow common file types
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }
    },
  }))
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: BaseTicketCommentDto,
    @Req() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (!dto.from && req?.user?.userId) {
      dto.from = Number(req.user.userId);
    }
    return this.service.addForTicket(ticketId, dto, files);
  }
}


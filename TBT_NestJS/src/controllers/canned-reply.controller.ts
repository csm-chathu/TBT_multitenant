import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from "@nestjs/common"
import { CannedReplyService } from "../services/canned-reply.service"
import { CreateCannedReplyDto, UpdateCannedReplyDto } from "../dto/canned-reply/canned-reply.dto"
import { JwtAuthGuard } from "../guards/jwt-auth.guard"

@UseGuards(JwtAuthGuard)
@Controller("canned-replies")
export class CannedReplyController {
  constructor(private readonly service: CannedReplyService) {}

  @Get()
  findAll(@Query("applicationId") applicationId?: string, @Query("all") all?: string) {
    return all === 'true'
      ? this.service.findAllForManagement(applicationId ? Number(applicationId) : undefined)
      : this.service.findAll(applicationId ? Number(applicationId) : undefined)
  }

  @Post(":id/verify")
  verify(@Param("id", ParseIntPipe) id: number, @Req() req: any) {
    return this.service.verify(id, req.user.userId)
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() dto: CreateCannedReplyDto) {
    return this.service.create(dto)
  }

  @Put(":id")
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCannedReplyDto) {
    return this.service.update(id, dto)
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
